const mongoose = require('mongoose');
const { PAYMENT_STATUS } = require('../config/constants');

const transactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    unique: true
  },
  shipment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shipment',
    required: true
  },
  // Payer (shipper)
  payer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Payee (carrier)
  payee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  status: {
    type: String,
    enum: Object.values(PAYMENT_STATUS),
    default: PAYMENT_STATUS.PENDING
  },
  paymentMethod: {
    type: String,
    enum: ['razorpay', 'stripe', 'upi', 'bank_transfer', 'cash'],
    required: true
  },
  paymentGateway: {
    orderId: String,
    paymentId: String,
    signature: String
  },
  // Commission (platform fee)
  commission: {
    percentage: { type: Number, default: 5 }, // 5% platform fee
    amount: Number
  },
  // Payout to carrier
  payout: {
    payoutId: String,
    payoutAmount: Number,
    payoutStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending'
    },
    payoutAt: Date
  },
  // Breakdown
  breakdown: {
    basePrice: Number,
    tax: Number,
    commission: Number,
    total: Number
  },
  // Refund info
  refund: {
    refundId: String,
    amount: Number,
    reason: String,
    refundedAt: Date
  },
  notes: String
}, {
  timestamps: true
});

// Generate unique transaction ID before saving
transactionSchema.pre('save', async function(next) {
  if (this.isNew) {
    const timestamp = Date.now();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    this.transactionId = `TXN${timestamp}${randomNum}`;
  }
  next();
});

transactionSchema.index({ payer: 1 });
transactionSchema.index({ payee: 1 });
transactionSchema.index({ shipment: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ transactionId: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);