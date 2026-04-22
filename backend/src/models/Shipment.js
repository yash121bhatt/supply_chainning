// Shipment model
const mongoose = require('mongoose');
const { SHIPMENT_STATUS } = require('../config/constants');

const locationSchema = new mongoose.Schema({
  address: { type: String, required: true },
  lat: { type: Number },
  lng: { type: Number }
}, { _id: false });

const dimensionsSchema = new mongoose.Schema({
  length: Number,
  width: Number,
  height: Number
}, { _id: false });

const shipmentSchema = new mongoose.Schema({
  shipper: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  carrier: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  driver:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  pickup:   { type: locationSchema, required: true },
  drop:     { type: locationSchema, required: true },

  type: { type: String, enum: ['public', 'private'], default: 'public' },
  weight: Number,
  dimensions: dimensionsSchema,
  description: String,
  budget: Number,

  status: { type: String, enum: Object.values(SHIPMENT_STATUS), default: SHIPMENT_STATUS.DRAFT },

  // payment fields (Stripe/Razorpay intent ID, amount paid)
  paymentIntentId: String,
  amountPaid: Number,

  // For private shipments you may store allowed carrier IDs
  invitedCarriers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

module.exports = mongoose.model('Shipment', shipmentSchema);
