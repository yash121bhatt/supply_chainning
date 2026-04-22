const mongoose = require('mongoose');

const BID_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  COUNTERED: 'countered',
  WITHDRAWN: 'withdrawn'
};

const bidSchema = new mongoose.Schema({
  shipment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shipment',
    required: true
  },
  carrier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  shipper: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Bid amount is required']
  },
  proposedPickupDate: {
    type: Date
  },
  proposedDeliveryDate: {
    type: Date
  },
  notes: {
    type: String,
    maxlength: 500
  },
  estimatedDistance: {
    type: Number
  },
  validUntil: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: Object.values(BID_STATUS),
    default: BID_STATUS.PENDING
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  bidHistory: [{
    previousAmount: Number,
    newAmount: Number,
    action: {
      type: String,
      enum: ['counter_offer', 'revision']
    },
    notes: String,
    timestamp: { type: Date, default: Date.now },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  counterOfferFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  acceptedAt: Date,
  rejectedAt: Date,
  respondedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

bidSchema.index({ shipment: 1, carrier: 1 });
bidSchema.index({ shipment: 1, status: 1 });
bidSchema.index({ carrier: 1, status: 1 });
bidSchema.index({ validUntil: 1 });

bidSchema.methods.isExpired = function() {
  return new Date() > this.validUntil || this.status !== BID_STATUS.PENDING;
};

bidSchema.statics.BID_STATUS = BID_STATUS;

module.exports = mongoose.model('Bid', bidSchema);
