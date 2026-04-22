const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/errorHandler').AppError;
const Shipment = require('../models/Shipment');
const Payment = require('../models/Payment');
const { createPaymentIntent, verifyWebhook } = require('../services/paymentGateway');
const { SHIPMENT_STATUS } = require('../config/constants');

/**
 * Create a Stripe payment intent for a shipment.
 * Expected body: { amount } – amount in smallest currency unit (e.g., paise for INR).
 * The shipment must be in 'payment_pending' state and belong to the requester (shipper or carrier).
 */
exports.createPaymentIntent = asyncHandler(async (req, res, next) => {
  const { shipmentId } = req.params;
  const { amount, currency } = req.body;
  const userId = req.user.id;
  const userRole = req.user.role;

  const shipment = await Shipment.findById(shipmentId);
  if (!shipment) return next(new AppError('Shipment not found', 404));

  // Only the shipper (who owns the shipment) can initiate payment
  if (String(shipment.shipper) !== userId) {
    return next(new AppError('Only the shipment owner can create a payment intent', 403));
  }

  if (shipment.status !== SHIPMENT_STATUS.PAYMENT_PENDING) {
    return next(new AppError('Shipment is not awaiting payment', 400));
  }

  // Create Stripe intent
  const intent = await createPaymentIntent(amount || shipment.budget * 100, currency || 'INR');

  // Record payment entry
  const payment = await Payment.create({
    shipment: shipment._id,
    carrier: shipment.carrier,
    amount: amount || shipment.budget,
    currency: currency || 'INR',
    paymentIntentId: intent.id,
    status: 'pending'
  });

  // Save intent ID on shipment for reference
  shipment.paymentIntentId = intent.id;
  await shipment.save();

  res.json({
    success: true,
    data: {
      clientSecret: intent.client_secret,
      paymentId: payment._id
    }
  });
});

/**
 * Stripe webhook endpoint – update payment and shipment status on successful payment.
 * Configure Stripe to POST to /api/payments/:shipmentId/webhook.
 */
exports.webhook = asyncHandler(async (req, res, next) => {
  // Verify webhook signature (if secret is set)
  let event;
  try {
    event = verifyWebhook(req);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle successful payment intent events
  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object;
    // Find the payment record by Stripe intent ID
    const payment = await Payment.findOne({ paymentIntentId: intent.id });
    if (payment) {
      payment.status = 'succeeded';
      payment.receiptUrl = intent.charges?.data?.[0]?.receipt_url || null;
      await payment.save();

      // Update the shipment status to 'assigned'
      const shipment = await Shipment.findById(payment.shipment);
      if (shipment) {
        shipment.status = SHIPMENT_STATUS.ASSIGNED;
        await shipment.save();
      }
    }
  }

  // Respond to Stripe to acknowledge receipt
  res.json({ received: true });
});
