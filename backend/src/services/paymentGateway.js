const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * Create a payment intent for the given amount (in smallest currency unit, e.g. paise for INR)
 */
exports.createPaymentIntent = async (amount, currency = 'INR') => {
  return stripe.paymentIntents.create({
    amount,
    currency,
    automatic_payment_methods: { enabled: true }
  });
};

/**
 * Verify a Stripe webhook event (used in controller webhook handler)
 */
exports.verifyWebhook = (req) => {
  const sig = req.headers['stripe-signature'];
  return stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
};
