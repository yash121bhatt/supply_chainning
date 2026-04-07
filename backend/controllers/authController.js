const crypto = require('crypto');
const { generateToken } = require('../utils/jwt');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/errorHandler').AppError;
const User = require('../models/User');
const { USER_ROLES } = require('../config/constants');
const { sendVerificationEmail } = require('../utils/email');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer config for avatar upload
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads/avatars');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError('Only JPG, JPEG, and PNG images are allowed', 400));
    }
  }
});

exports.uploadAvatarMiddleware = avatarUpload.single('avatar');

// Generate OTP for verification
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Hash OTP before storing
const hashOTP = (otp) => crypto.createHash('sha256').update(otp).digest('hex');

// Helper to generate and send OTP to user
const triggerOTPEmail = async (user) => {
  const otp = generateOTP();
  user.emailOtp = hashOTP(otp);
  user.emailOtpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes
  user.emailOtpAttempts = 0;
  await user.save();
  await sendVerificationEmail(user.email, otp);
};

// Register new user
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, phone, password, role } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError('User with this email already exists', 400));
  }

  // Validate role
  if (role && !Object.values(USER_ROLES).includes(role)) {
    return next(new AppError('Invalid role specified', 400));
  }

  // Create new user
  const user = new User({
    name,
    email,
    phone,
    password,
    role: role || USER_ROLES.SHIPPER
  });

  // Set additional details based on role
  if (role === USER_ROLES.CARRIER && req.body.companyName) {
    user.carrierDetails = {
      companyName: req.body.companyName,
      gstNumber: req.body.gstNumber,
      panNumber: req.body.panNumber,
      address: req.body.address
    };
  }

  if (role === USER_ROLES.DRIVER && req.body.licenseNumber) {
    user.driverDetails = {
      licenseNumber: req.body.licenseNumber,
      licenseExpiry: req.body.licenseExpiry,
      dateOfBirth: req.body.dateOfBirth,
      experience: req.body.experience
    };
  }

  await user.save();

  // Generate and send OTP for email verification
  await triggerOTPEmail(user);

  // Generate JWT token
  const token = generateToken({ id: user._id, role: user.role });

  res.status(201).json({
    success: true,
    message: 'User registered successfully. Please verify your email with the OTP sent to your email address.',
    data: {
      user: user.getPublicProfile(),
      token
    }
  });
});

// Login user
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Check if email and password are provided
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // Find user and include password for comparison
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return next(new AppError('Invalid email or password', 401));
  }

  // Check if user is active
  if (!user.isActive) {
    return next(new AppError('Your account has been deactivated. Please contact support.', 403));
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return next(new AppError('Invalid email or password', 401));
  }

  // Check if email is verified
  if (!user.emailVerified) {
    return next(new AppError('Please verify your email address using OTP before logging in.', 403));
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Generate JWT token
  const token = generateToken({ id: user._id, role: user.role });

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: user.getPublicProfile(),
      token
    }
  });
});

// Get current user
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: {
      user: user.getPublicProfile()
    }
  });
});

// Update user profile
exports.updateProfile = asyncHandler(async (req, res, next) => {
  const { name, phone, avatar } = req.body;
  const userId = req.user.id;

  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Update fields
  if (name) user.name = name;
  if (phone) user.phone = phone;
  if (avatar) user.avatar = avatar;

  // Update role-specific details
  if (user.role === USER_ROLES.SHIPPER && req.body.companyDetails) {
    Object.assign(user.companyDetails, req.body.companyDetails);
  }

  if (user.role === USER_ROLES.CARRIER && req.body.carrierDetails) {
    Object.assign(user.carrierDetails, req.body.carrierDetails);
  }

  if (user.role === USER_ROLES.DRIVER && req.body.driverDetails) {
    Object.assign(user.driverDetails, req.body.driverDetails);
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: user.getPublicProfile()
    }
  });
});

// Upload avatar
exports.uploadAvatar = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('No image file provided', 400));
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  const avatarUrl = `/uploads/avatars/${req.file.filename}`;
  user.avatar = avatarUrl;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Avatar uploaded successfully',
    data: {
      user: user.getPublicProfile()
    }
  });
});

// Change password
exports.changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return next(new AppError('Please provide current and new password', 400));
  }

  if (newPassword.length < 6) {
    return next(new AppError('New password must be at least 6 characters', 400));
  }

  const user = await User.findById(req.user.id).select('+password');

  // Check current password
  const isPasswordValid = await user.comparePassword(currentPassword);
  if (!isPasswordValid) {
    return next(new AppError('Current password is incorrect', 401));
  }

  // Update password
  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password changed successfully'
  });
});

// Forgot password - send OTP
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return next(new AppError('No user found with this email', 404));
  }

  // Generate reset token (in production, use proper crypto)
  const resetToken = generateOTP();
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  await user.save();

  // Send email with reset token
  await sendVerificationEmail(email, resetToken);

  res.status(200).json({
    success: true,
    message: 'Password reset OTP sent to your email'
  });
});

// Reset password
exports.resetPassword = asyncHandler(async (req, res, next) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return next(new AppError('Please provide email, OTP and new password', 400));
  }

  const user = await User.findOne({
    email,
    resetPasswordToken: otp,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) {
    return next(new AppError('Invalid or expired OTP', 400));
  }

  // Update password
  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  // Generate new token
  const token = generateToken({ id: user._id, role: user.role });

  res.status(200).json({
    success: true,
    message: 'Password reset successful',
    data: { token }
  });
});

// Resend OTP email
exports.resendOTP = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  if (user.emailVerified) {
    return next(new AppError('Email is already verified', 400));
  }

  // Rate limit check
  if (user.emailOtpAttempts >= 5) {
    return next(new AppError('Too many OTP resend attempts. Please try again later.', 429));
  }

  user.emailOtpAttempts += 1;
  await user.save();

  await triggerOTPEmail(user);

  res.status(200).json({
    success: true,
    message: `A new OTP has been sent to your email. Attempt ${user.emailOtpAttempts}/5.`,
    data: { attempts: user.emailOtpAttempts, maxAttempts: 5 }
  });
});

// Verify email with OTP
exports.verifyEmail = asyncHandler(async (req, res, next) => {
  const { email, otp } = req.body;

  if (!otp || !email) {
    return next(new AppError('Please provide email and OTP', 400));
  }

  const user = await User.findOne({ email }).select('+emailOtp');
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  if (user.emailVerified) {
    return next(new AppError('Email is already verified', 400));
  }

  if (!user.emailOtp) {
    return next(new AppError('No OTP sent. Please request a new OTP.', 400));
  }

  if (user.emailOtpExpiry && user.emailOtpExpiry < Date.now()) {
    return next(new AppError('OTP has expired. Please request a new OTP.', 400));
  }

  // Compare hashed OTP
  const hashedInput = hashOTP(otp);
  if (hashedInput !== user.emailOtp) {
    user.emailOtpAttempts = (user.emailOtpAttempts || 0) + 1;
    if (user.emailOtpAttempts >= 5) {
      user.emailOtp = undefined;
      user.emailOtpExpiry = undefined;
      await user.save();
      return next(new AppError('Too many incorrect attempts. Please request a new OTP.', 400));
    }
    await user.save();
    return next(new AppError(`Invalid OTP. ${5 - user.emailOtpAttempts} attempts remaining.`, 400));
  }

  // OTP is correct — mark email as verified
  user.emailVerified = true;
  user.isVerified = true;
  user.emailOtp = undefined;
  user.emailOtpExpiry = undefined;
  user.emailOtpAttempts = 0;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Email verified successfully'
  });
});

// Logout (client-side token removal)
exports.logout = asyncHandler(async (req, res, next) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});