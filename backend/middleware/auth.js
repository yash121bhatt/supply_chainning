const { verifyToken } = require('../utils/jwt');
const AppError = require('../utils/errorHandler').AppError;
const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');

// Protect routes - verify JWT token
exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You are not logged in. Please log in to get access.', 401));
  }

  // Verify token
  const decoded = verifyToken(token);
  if (!decoded) {
    return next(new AppError('Invalid or expired token. Please log in again.', 401));
  }

  // Check if user still exists
  const user = await User.findById(decoded.id).select('-password');
  if (!user) {
    return next(new AppError('The user belonging to this token no longer exists.', 401));
  }

  // Check if user is active
  if (!user.isActive) {
    return next(new AppError('Your account has been deactivated. Please contact support.', 403));
  }

  // Grant access to protected route
  req.user = user;
  next();
});

// Role-based authorization
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(`User role '${req.user.role}' is not authorized to access this route.`, 403)
      );
    }
    next();
  };
};

// Verify email middleware
exports.verifyEmail = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!user.isVerified) {
    return next(new AppError('Please verify your email address first.', 403));
  }

  next();
});

// Optional auth - doesn't fail if no token
exports.optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      const user = await User.findById(decoded.id).select('-password');
      if (user && user.isActive) {
        req.user = user;
      }
    }
  }

  next();
});