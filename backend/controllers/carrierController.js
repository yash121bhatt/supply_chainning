const crypto = require('crypto');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/errorHandler').AppError;
const Vehicle = require('../models/Vehicle');
const Shipment = require('../models/Shipment');
const User = require('../models/User');
const { sendDriverInvitationEmail } = require('../utils/email');

// Get carrier's vehicles
exports.getMyVehicles = asyncHandler(async (req, res, next) => {
  const carrierId = req.user._id;
  const { status, page = 1, limit = 20 } = req.query;

  const query = { carrier: carrierId };
  if (status) query.currentStatus = status;

  const vehicles = await Vehicle.find(query)
    .populate('assignedDriver', 'name phone')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Vehicle.countDocuments(query);

  res.status(200).json({
    success: true,
    data: {
      vehicles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// Add new vehicle
exports.addVehicle = asyncHandler(async (req, res, next) => {
  const carrierId = req.user._id;

  const vehicle = new Vehicle({
    ...req.body,
    carrier: carrierId
  });

  await vehicle.save();

  res.status(201).json({
    success: true,
    message: 'Vehicle added successfully',
    data: { vehicle }
  });
});

// Update vehicle
exports.updateVehicle = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const vehicle = await Vehicle.findById(id);
  if (!vehicle) {
    return next(new AppError('Vehicle not found', 404));
  }

  if (vehicle.carrier.toString() !== req.user._id.toString()) {
    return next(new AppError('You are not authorized to update this vehicle', 403));
  }

  Object.assign(vehicle, req.body);
  await vehicle.save();

  res.status(200).json({
    success: true,
    message: 'Vehicle updated successfully',
    data: { vehicle }
  });
});

// Delete vehicle
exports.deleteVehicle = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const vehicle = await Vehicle.findById(id);
  if (!vehicle) {
    return next(new AppError('Vehicle not found', 404));
  }

  if (vehicle.carrier.toString() !== req.user._id.toString()) {
    return next(new AppError('You are not authorized to delete this vehicle', 403));
  }

  // Check if vehicle is in use
  const activeShipment = await Shipment.findOne({
    vehicle: id,
    status: { $in: ['assigned', 'picked_up', 'in_transit'] }
  });

  if (activeShipment) {
    return next(new AppError('Cannot delete vehicle with active shipment', 400));
  }

  await Vehicle.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: 'Vehicle deleted successfully'
  });
});

// Get carrier dashboard
exports.getCarrierDashboard = asyncHandler(async (req, res, next) => {
  const carrierId = req.user._id;

  const [
    totalShipments,
    activeShipments,
    completedShipments,
    totalVehicles,
    availableVehicles,
    monthlyRevenue
  ] = await Promise.all([
    Shipment.countDocuments({ carrier: carrierId }),
    Shipment.countDocuments({
      carrier: carrierId,
      status: { $in: ['assigned', 'picked_up', 'in_transit'] }
    }),
    Shipment.countDocuments({
      carrier: carrierId,
      status: 'delivered'
    }),
    Vehicle.countDocuments({ carrier: carrierId }),
    Vehicle.countDocuments({
      carrier: carrierId,
      currentStatus: 'available'
    }),
    Shipment.aggregate([
      {
        $match: {
          carrier: carrierId,
          status: 'delivered',
          createdAt: {
            $gte: new Date(new Date().setDate(new Date().getDate() - 30))
          }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$pricing.acceptedPrice' }
        }
      }
    ])
  ]);

  // Get recent shipments
  const recentShipments = await Shipment.find({ carrier: carrierId })
    .populate('shipper', 'name companyDetails')
    .populate('driver', 'name')
    .sort({ createdAt: -1 })
    .limit(5);

  res.status(200).json({
    success: true,
    data: {
      stats: {
        totalShipments,
        activeShipments,
        completedShipments,
        totalVehicles,
        availableVehicles,
        monthlyRevenue: monthlyRevenue[0]?.total || 0
      },
      recentShipments
    }
  });
});

// Get carrier earnings
exports.getCarrierEarnings = asyncHandler(async (req, res, next) => {
  const carrierId = req.user._id;
  const { startDate, endDate } = req.query;

  const matchQuery = {
    carrier: carrierId,
    status: 'delivered'
  };

  if (startDate || endDate) {
    matchQuery.createdAt = {};
    if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
    if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
  }

  const earnings = await Shipment.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        total: { $sum: '$pricing.acceptedPrice' },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year': -1, '_id.month': -1 }
    }
  ]);

  const totalEarnings = await Shipment.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        total: { $sum: '$pricing.acceptedPrice' },
        count: { $sum: 1 }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      monthly: earnings,
      total: totalEarnings[0]?.total || 0,
      totalShipments: totalEarnings[0]?.count || 0
    }
  });
});

// Get carrier's drivers
exports.getMyDrivers = asyncHandler(async (req, res, next) => {
  const carrierId = req.user._id;
  const { page = 1, limit = 20 } = req.query;

  const drivers = await User.find({
    role: 'driver',
    'driverDetails.assignedCarrier': carrierId
  })
    .select('-password')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await User.countDocuments({
    role: 'driver',
    'driverDetails.assignedCarrier': carrierId
  });

  res.status(200).json({
    success: true,
    data: {
      drivers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// Invite driver
exports.inviteDriver = asyncHandler(async (req, res, next) => {
  const { name, email, phone, licenseNumber, licenseExpiry } = req.body;
  const carrierId = req.user._id;

  const existingDriver = await User.findOne({ email, role: 'driver' });
  if (existingDriver) {
    return next(new AppError('Driver with this email already exists', 400));
  }

  const inviteToken = crypto.randomBytes(32).toString('hex');
  const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const driver = new User({
    name,
    email,
    phone,
    password: crypto.randomBytes(16).toString('hex'),
    role: 'driver',
    isInvited: true,
    inviteToken,
    tokenExpiry,
    isActive: false,
    emailVerified: false,
    driverDetails: {
      licenseNumber,
      licenseExpiry,
      assignedCarrier: carrierId
    }
  });

  await driver.save();

  try {
    await sendDriverInvitationEmail(email, name, inviteToken, req.user.carrierDetails?.companyName || req.user.name);
  } catch (emailError) {
    await User.findByIdAndDelete(driver._id);
    return next(new AppError('Failed to send invitation email. Please check the email address and try again.', 500));
  }

  res.status(201).json({
    success: true,
    message: 'Driver invited successfully. They will receive an email to set their password.',
    data: { driver: driver.getPublicProfile() }
  });
});

// Resend driver invitation
exports.resendDriverInvite = asyncHandler(async (req, res, next) => {
  const { driverId } = req.params;
  const carrierId = req.user._id;

  const driver = await User.findOne({
    _id: driverId,
    role: 'driver',
    'driverDetails.assignedCarrier': carrierId
  });

  if (!driver) {
    return next(new AppError('Driver not found', 404));
  }

  if (!driver.isInvited) {
    return next(new AppError('This driver was not invited. Use the invite function instead.', 400));
  }

  const inviteToken = crypto.randomBytes(32).toString('hex');
  driver.inviteToken = inviteToken;
  driver.tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await driver.save();

  try {
    await sendDriverInvitationEmail(driver.email, driver.name, inviteToken, req.user.carrierDetails?.companyName || req.user.name);
  } catch (emailError) {
    return next(new AppError('Failed to send invitation email. Please try again.', 500));
  }

  res.status(200).json({
    success: true,
    message: 'Invitation resent successfully'
  });
});