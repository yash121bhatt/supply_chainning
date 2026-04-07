const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/errorHandler').AppError;
const User = require('../models/User');
const Shipment = require('../models/Shipment');

// Get all users (Admin only)
exports.getAllUsers = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 20, role, search } = req.query;

  const query = {};
  if (role) query.role = role;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const users = await User.find(query)
    .select('-password')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await User.countDocuments(query);

  res.status(200).json({
    success: true,
    data: {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// Get user statistics (Admin only)
exports.getUserStats = asyncHandler(async (req, res, next) => {
  const stats = await Promise.all([
    User.countDocuments({ role: 'shipper' }),
    User.countDocuments({ role: 'carrier' }),
    User.countDocuments({ role: 'driver' }),
    User.countDocuments({ role: 'admin' }),
    User.countDocuments({ isVerified: true }),
    User.countDocuments({ isActive: false })
  ]);

  const [
    totalShippers,
    totalCarriers,
    totalDrivers,
    totalAdmins,
    verifiedUsers,
    inactiveUsers
  ] = stats;

  res.status(200).json({
    success: true,
    data: {
      totalShippers,
      totalCarriers,
      totalDrivers,
      totalAdmins,
      verifiedUsers,
      inactiveUsers,
      totalUsers: totalShippers + totalCarriers + totalDrivers + totalAdmins
    }
  });
});

// Get user by ID
exports.getUserById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  // Users can view their own profile
  if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
    return next(new AppError('You do not have permission to view this profile', 403));
  }

  const user = await User.findById(id).select('-password');
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  res.status(200).json({
    success: true,
    data: { user }
  });
});

// Verify user (Admin only)
exports.verifyUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { isVerified } = req.body;

  const user = await User.findById(id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  user.isVerified = isVerified !== undefined ? isVerified : true;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'User verification status updated',
    data: { user: user.getPublicProfile() }
  });
});

// Update user status (Admin only)
exports.updateUserStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { isActive } = req.body;

  const user = await User.findById(id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  if (id === req.user._id.toString()) {
    return next(new AppError('You cannot deactivate your own account', 400));
  }

  user.isActive = isActive !== undefined ? isActive : !user.isActive;
  await user.save();

  res.status(200).json({
    success: true,
    message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
    data: { user: user.getPublicProfile() }
  });
});

// Delete account (user can delete their own)
exports.deleteAccount = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  // Users can delete their own account, admins can delete any account
  if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
    return next(new AppError('You do not have permission to delete this account', 403));
  }

  const user = await User.findById(id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Soft delete - mark as inactive
  user.isActive = false;
  user.email = `${user.email}_deleted_${Date.now()}`;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Account deleted successfully'
  });
});