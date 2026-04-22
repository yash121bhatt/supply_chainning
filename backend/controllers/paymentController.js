const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/errorHandler').AppError;
const Shipment = require('../models/Shipment');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const razorpay = require('../services/razorpay');
const { SHIPMENT_STATUS, PAYMENT_STATUS } = require('../config/constants');

exports.createPayment = asyncHandler(async (req, res, next) => {
  const { shipmentId } = req.body;
  const userId = req.user._id;

  const shipment = await Shipment.findById(shipmentId).populate('shipper');
  if (!shipment) {
    return next(new AppError('Shipment not found', 404));
  }

  if (shipment.shipper._id.toString() !== userId.toString()) {
    return next(new AppError('You are not authorized to make payment for this shipment', 403));
  }

  if (shipment.status !== SHIPMENT_STATUS.ASSIGNED) {
    return next(new AppError('Shipment must be in assigned status for payment', 400));
  }

  if (shipment.payment?.status === PAYMENT_STATUS.COMPLETED) {
    return next(new AppError('Payment already completed for this shipment', 400));
  }

  const amount = shipment.pricing.acceptedPrice || shipment.pricing.quotedPrice;
  const commissionAmount = amount * 0.05;
  const carrierPayout = amount - commissionAmount;

  const order = await razorpay.createOrder(amount, 'INR', `SHP_${shipment.shipmentNumber}`, {
    shipmentId: shipment._id.toString(),
    shipperId: shipment.shipper._id.toString(),
    carrierId: shipment.carrier?.toString()
  });

  const transaction = new Transaction({
    shipment: shipment._id,
    amount,
    payer: userId,
    payee: shipment.carrier,
    paymentMethod: 'razorpay',
    status: PAYMENT_STATUS.PENDING,
    paymentGateway: {
      orderId: order.id
    },
    commission: {
      percentage: 5,
      amount: commissionAmount
    },
    breakdown: {
      basePrice: amount,
      commission: commissionAmount,
      total: carrierPayout
    }
  });

  await transaction.save();

  res.status(200).json({
    success: true,
    data: {
      orderId: order.id,
      amount,
      currency: 'INR',
      key: process.env.RAZORPAY_KEY_ID,
      transactionId: transaction._id
    }
  });
});

exports.verifyPayment = asyncHandler(async (req, res, next) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, transactionId } = req.body;

  const isValid = razorpay.verifyPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature);
  if (!isValid) {
    return next(new AppError('Payment verification failed', 400));
  }

  const transaction = await Transaction.findById(transactionId);
  if (!transaction) {
    return next(new AppError('Transaction not found', 404));
  }

  transaction.paymentGateway.paymentId = razorpayPaymentId;
  transaction.paymentGateway.signature = razorpaySignature;
  transaction.status = PAYMENT_STATUS.COMPLETED;
  transaction.paidAt = new Date();
  await transaction.save();

  const shipment = await Shipment.findById(transaction.shipment);
  shipment.payment.status = PAYMENT_STATUS.COMPLETED;
  shipment.payment.paymentId = razorpayPaymentId;
  shipment.payment.paidAt = new Date();
  shipment.payment.amount = transaction.amount;
  await shipment.save();

  if (shipment.carrier) {
    await Notification.create({
      recipient: shipment.carrier,
      type: 'payment_received',
      title: 'Payment Received',
      message: `Payment of ₹${transaction.amount} has been received for shipment ${shipment.shipmentNumber}. Funds will be released after delivery.`,
      shipment: shipment._id
    });
  }

  res.status(200).json({
    success: true,
    message: 'Payment verified and completed',
    data: { transaction }
  });
});

exports.getPaymentStatus = asyncHandler(async (req, res, next) => {
  const { shipmentId } = req.params;

  const shipment = await Shipment.findById(shipmentId);
  if (!shipment) {
    return next(new AppError('Shipment not found', 404));
  }

  const transaction = await Transaction.findOne({
    shipment: shipmentId,
    type: { $exists: false }
  }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: {
      paymentStatus: shipment.payment?.status || 'pending',
      transaction
    }
  });
});

exports.initiateRefund = asyncHandler(async (req, res, next) => {
  const { shipmentId, reason } = req.body;
  const userId = req.user._id;

  const shipment = await Shipment.findById(shipmentId);
  if (!shipment) {
    return next(new AppError('Shipment not found', 404));
  }

  if (shipment.payment?.status !== PAYMENT_STATUS.COMPLETED) {
    return next(new AppError('No completed payment found for this shipment', 400));
  }

  if (shipment.status === SHIPMENT_STATUS.DELIVERED) {
    return next(new AppError('Cannot refund delivered shipment', 400));
  }

  const transaction = await Transaction.findOne({
    shipment: shipmentId,
    status: PAYMENT_STATUS.COMPLETED
  });

  if (!transaction) {
    return next(new AppError('Transaction not found', 404));
  }

  const refund = await razorpay.refundPayment(
    transaction.paymentGateway.paymentId,
    transaction.amount
  );

  transaction.refund = {
    refundId: refund.id,
    amount: transaction.amount,
    reason: reason || 'User requested refund',
    refundedAt: new Date()
  };
  transaction.status = PAYMENT_STATUS.REFUNDED;
  await transaction.save();

  shipment.payment.status = PAYMENT_STATUS.REFUNDED;
  await shipment.save();

  res.status(200).json({
    success: true,
    message: 'Refund initiated',
    data: { refund: transaction.refund }
  });
});

exports.releasePayment = asyncHandler(async (req, res, next) => {
  const { shipmentId } = req.body;

  const shipment = await Shipment.findById(shipmentId);
  if (!shipment) {
    return next(new AppError('Shipment not found', 404));
  }

  if (shipment.status !== SHIPMENT_STATUS.DELIVERED) {
    return next(new AppError('Shipment must be delivered to release payment', 400));
  }

  if (!shipment.carrier) {
    return next(new AppError('No carrier assigned to this shipment', 400));
  }

  const settlementDays = 3;
  const deliveryDate = shipment.proofOfDelivery?.deliveredAt || shipment.updatedAt;
  const releaseDate = new Date(deliveryDate);
  releaseDate.setDate(releaseDate.getDate() + settlementDays);

  if (new Date() < releaseDate) {
    return next(new AppError(`Payment will be released on ${releaseDate.toDateString()}`, 400));
  }

  const transaction = await Transaction.findOne({
    shipment: shipmentId,
    status: PAYMENT_STATUS.COMPLETED
  });

  if (!transaction) {
    return next(new AppError('No completed transaction found', 404));
  }

  const carrierPayout = transaction.breakdown?.total || transaction.amount;

  transaction.payout = {
    payoutAmount: carrierPayout,
    payoutStatus: 'completed',
    payoutAt: new Date()
  };
  await transaction.save();

  await Notification.create({
    recipient: shipment.carrier,
    type: 'payment_released',
    title: 'Payment Released',
    message: `Payment of ₹${carrierPayout} has been released for shipment ${shipment.shipmentNumber}.`,
    shipment: shipment._id
  });

  res.status(200).json({
    success: true,
    message: 'Payment released to carrier',
    data: { payout: transaction.payout }
  });
});

exports.getTransactionHistory = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const { page = 1, limit = 20 } = req.query;

  const transactions = await Transaction.find({
    $or: [{ payer: userId }, { payee: userId }]
  })
    .populate('shipment', 'shipmentNumber')
    .populate('payer', 'name email')
    .populate('payee', 'name email')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Transaction.countDocuments({
    $or: [{ payer: userId }, { payee: userId }]
  });

  res.status(200).json({
    success: true,
    data: {
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});
