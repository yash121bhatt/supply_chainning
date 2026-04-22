const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

const createOrder = async (amount, currency = 'INR', receipt, notes = {}) => {
  const options = {
    amount: amount * 100,
    currency,
    receipt: receipt || `receipt_${Date.now()}`,
    notes
  };

  return await razorpay.orders.create(options);
};

const getOrder = async (orderId) => {
  return await razorpay.orders.fetch(orderId);
};

const verifyPayment = (orderId, paymentId, signature) => {
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return expectedSignature === signature;
};

const capturePayment = async (paymentId, amount) => {
  return await razorpay.payments.capture(paymentId, amount * 100);
};

const refundPayment = async (paymentId, amount) => {
  return await razorpay.refunds.create({
    payment_id: paymentId,
    amount: amount * 100,
    speed: 'normal'
  });
};

const getPayment = async (paymentId) => {
  return await razorpay.payments.fetch(paymentId);
};

module.exports = {
  razorpay,
  createOrder,
  getOrder,
  verifyPayment,
  capturePayment,
  refundPayment,
  getPayment
};
