// Payment model
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  shipment:        { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment', required: true },
  carrier:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount:          { type: Number, required: true },
  currency:        { type: String, default: 'INR' },
  paymentIntentId: { type: String, required: true },
  status:          { type: String, enum: ['pending', 'succeeded', 'failed'], default: 'pending' },
  receiptUrl:      { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
