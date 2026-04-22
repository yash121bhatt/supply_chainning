const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { USER_ROLES } = require('../config/constants');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Please provide a phone number'],
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: Object.values(USER_ROLES),
    default: USER_ROLES.SHIPPER,
    required: true
  },
  avatar: {
    type: String,
    default: null
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  // Email verification OTP
  emailOtp: {
    type: String,
    select: false
  },
  emailOtpExpiry: {
    type: Date,
    default: null
  },
  emailOtpAttempts: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isInvited: {
    type: Boolean,
    default: false
  },
  inviteToken: {
    type: String,
    select: false
  },
  tokenExpiry: {
    type: Date,
    default: null
  },
  // Shipper specific fields
  companyDetails: {
    companyName: String,
    gstNumber: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: { type: String, default: 'India' }
    }
  },
  // Carrier specific fields
  carrierDetails: {
    companyName: String,
    gstNumber: String,
    panNumber: String,
    businessLicense: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: { type: String, default: 'India' }
    }
  },
  // Driver specific fields
  driverDetails: {
    licenseNumber: String,
    licenseExpiry: Date,
    dateOfBirth: Date,
    aadhaarNumber: String,
    experience: { type: Number, default: 0 }, // years
    assignedCarrier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  kycDocuments: [{
    documentType: String,
    documentUrl: String,
    verified: { type: Boolean, default: false },
    uploadedAt: { type: Date, default: Date.now }
  }],
  lastLogin: {
    type: Date,
    default: null
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Get public profile
userSchema.methods.getPublicProfile = function() {
  const user = this.toObject();
  delete user.password;
  delete user.resetPasswordToken;
  delete user.resetPasswordExpire;
  delete user.emailOtp;
  delete user.emailOtpExpiry;
  delete user.emailOtpAttempts;
  delete user.inviteToken;
  delete user.tokenExpiry;
  return user;
};

// Index for faster queries
userSchema.index({ role: 1 });
userSchema.index({ isVerified: 1 });

module.exports = mongoose.model('User', userSchema);