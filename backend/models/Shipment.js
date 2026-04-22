const mongoose = require('mongoose');
const { SHIPMENT_STATUS, SHIPMENT_TYPES } = require('../config/constants');

const locationSchema = new mongoose.Schema({
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  country: { type: String, default: 'India' },
  coordinates: {
    lat: { type: Number },
    lng: { type: Number }
  }
});

const shipmentSchema = new mongoose.Schema({
  // Shipper who created the shipment
  shipper: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Carrier assigned to the shipment
  carrier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // Driver assigned to the shipment
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // Vehicle assigned
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    default: null
  },
  // Shipment details
  shipmentNumber: {
    type: String,
    unique: true,
    required: true
  },
  shipmentType: {
    type: String,
    enum: Object.values(SHIPMENT_TYPES),
    default: SHIPMENT_TYPES.FULL_TRUCKLOAD
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  allowedCarriers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Pickup location
  pickupLocation: {
    type: locationSchema,
    required: [true, 'Please provide pickup location']
  },
  pickupDate: {
    type: Date,
    required: [true, 'Please provide pickup date']
  },
  // Delivery location
  deliveryLocation: {
    type: locationSchema,
    required: [true, 'Please provide delivery location']
  },
  deliveryDate: {
    type: Date,
    required: [true, 'Please provide delivery date']
  },
  // Goods details
  goodsDetails: {
    description: { type: String, required: true },
    weight: { type: Number, required: true }, // in kg
    weightUnit: { type: String, default: 'kg', enum: ['kg', 'tons', 'lbs'] },
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      unit: { type: String, default: 'cm', enum: ['cm', 'inches', 'meters'] }
    },
    quantity: { type: Number, default: 1 },
    value: { type: Number, required: true }, // in INR
    specialInstructions: String,
    isFragile: { type: Boolean, default: false },
    isHazardous: { type: Boolean, default: false }
  },
  // Pricing
  pricing: {
    quotedPrice: { type: Number, required: true },
    acceptedPrice: { type: Number },
    currency: { type: String, default: 'INR' },
    priceBreakdown: {
      basePrice: Number,
      distanceCharge: Number,
      weightCharge: Number,
      tax: Number,
      total: Number
    }
  },
  // Status tracking
  status: {
    type: String,
    enum: Object.values(SHIPMENT_STATUS),
    default: SHIPMENT_STATUS.PENDING
  },
  statusHistory: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    location: locationSchema,
    notes: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  // Real-time tracking
  currentLocation: {
    type: locationSchema,
    default: null
  },
  estimatedArrival: {
    type: Date,
    default: null
  },
  // Payment
  payment: {
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    paymentId: String,
    paidAt: Date,
    amount: Number
  },
  // Proof of delivery
  proofOfDelivery: {
    deliveryImage: String,
    signatureImage: String,
    deliveredAt: Date,
    receivedBy: String
  },
  // Ratings
  shipperRating: {
    rating: { type: Number, min: 1, max: 5 },
    review: String,
    createdAt: Date
  },
  carrierRating: {
    rating: { type: Number, min: 1, max: 5 },
    review: String,
    createdAt: Date
  },
  driverRating: {
    rating: { type: Number, min: 1, max: 5 },
    review: String,
    createdAt: Date
  },
  // Notes and documents
  notes: [{
    text: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: { type: Date, default: Date.now }
  }],
  documents: [{
    name: String,
    url: String,
    uploadedAt: { type: Date, default: Date.now },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  // Distance (calculated)
  distance: {
    type: Number, // in km
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for faster queries
shipmentSchema.index({ shipper: 1 });
shipmentSchema.index({ carrier: 1 });
shipmentSchema.index({ driver: 1 });
shipmentSchema.index({ status: 1 });
shipmentSchema.index({ pickupDate: 1 });

module.exports = mongoose.model('Shipment', shipmentSchema);