const mongoose = require('mongoose');
const { VEHICLE_TYPES } = require('../config/constants');

const vehicleSchema = new mongoose.Schema({
  // Owner (carrier)
  carrier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Vehicle details
  vehicleNumber: {
    type: String,
    required: [true, 'Please provide vehicle number'],
    unique: true,
    uppercase: true,
    trim: true
  },
  vehicleType: {
    type: String,
    enum: Object.values(VEHICLE_TYPES),
    required: true
  },
  brand: {
    type: String,
    required: true
  },
  model: {
    type: String,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  // Capacity
  capacity: {
    weight: { type: Number, required: true }, // in kg
    weightUnit: { type: String, default: 'kg' },
    volume: Number, // in cubic meters
    length: Number,
    width: Number,
    height: Number
  },
  // Documents
  registrationNumber: {
    type: String,
    required: true
  },
  registrationExpiry: {
    type: Date,
    required: true
  },
  insuranceNumber: {
    type: String,
    required: true
  },
  insuranceExpiry: {
    type: Date,
    required: true
  },
  fitnessCertificate: {
    certificateNumber: String,
    expiryDate: Date,
    documentUrl: String
  },
  pollutionCertificate: {
    certificateNumber: String,
    expiryDate: Date,
    documentUrl: String
  },
  documents: [{
    documentType: String,
    documentUrl: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  currentStatus: {
    type: String,
    enum: ['available', 'in_use', 'maintenance', 'inactive'],
    default: 'available'
  },
  // Assigned driver
  assignedDriver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // Location
  currentLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  },
  // Additional details
  fuelType: {
    type: String,
    enum: ['petrol', 'diesel', 'cng', 'electric', 'hybrid']
  },
  mileage: Number, // km per liter
  color: String,
  additionalFeatures: [String],
  notes: String
}, {
  timestamps: true
});

// Index for geospatial queries
vehicleSchema.index({ currentLocation: '2dsphere' });
vehicleSchema.index({ carrier: 1 });
vehicleSchema.index({ currentStatus: 1 });

module.exports = mongoose.model('Vehicle', vehicleSchema);