// Bid model
const mongoose = require('mongoose');
const { BID_STATUS } = require('../config/constants');

const bidSchema = new mongoose.Schema({
  shipment: { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment', required: true },
  carrier:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount:   { type: Number, required: true },
  note:     { type: String },
  status:   { type: String, enum: Object.values(BID_STATUS), default: BID_STATUS.PENDING }
}, { timestamps: true });

module.exports = mongoose.model('Bid', bidSchema);
