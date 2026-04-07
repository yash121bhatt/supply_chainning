const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/errorHandler').AppError;
const Shipment = require('../models/Shipment');
const User = require('../models/User');

// Get driver dashboard
exports.getDriverDashboard = asyncHandler(async (req, res, next) => {
  const driverId = req.user._id;

  const [
    totalShipments,
    activeShipment,
    completedShipments,
    monthlyEarnings
  ] = await Promise.all([
    Shipment.countDocuments({ driver: driverId }),
    Shipment.findOne({
      driver: driverId,
      status: { $in: ['assigned', 'picked_up', 'in_transit'] }
    }),
    Shipment.countDocuments({ driver: driverId, status: 'delivered' }),
    Shipment.aggregate([
      {
        $match: {
          driver: driverId,
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

  // Get upcoming shipment if exists
  const upcomingShipment = activeShipment
    ? await Shipment.findById(activeShipment._id)
        .populate('shipper', 'name phone')
        .populate('carrier', 'name')
        .populate('vehicle', 'vehicleNumber vehicleType')
    : null;

  res.status(200).json({
    success: true,
    data: {
      stats: {
        totalShipments,
        completedShipments,
        monthlyEarnings: monthlyEarnings[0]?.total || 0
      },
      activeShipment: upcomingShipment
    }
  });
});

// Get active shipments
exports.getActiveShipments = asyncHandler(async (req, res, next) => {
  const driverId = req.user._id;

  const shipments = await Shipment.find({
    driver: driverId,
    status: { $in: ['assigned', 'picked_up', 'in_transit'] }
  })
    .populate('shipper', 'name phone companyDetails')
    .populate('carrier', 'name')
    .populate('vehicle', 'vehicleNumber vehicleType brand model')
    .sort({ pickupDate: 1 });

  res.status(200).json({
    success: true,
    data: { shipments }
  });
});

// Get driver profile
exports.getDriverProfile = asyncHandler(async (req, res, next) => {
  const driver = await User.findById(req.user._id)
    .select('-password')
    .populate('driverDetails.assignedCarrier', 'name email phone carrierDetails');

  res.status(200).json({
    success: true,
    data: { driver }
  });
});

// Update driver profile
exports.updateDriverProfile = asyncHandler(async (req, res, next) => {
  const driver = await User.findById(req.user._id);

  const { name, phone, avatar, licenseNumber, licenseExpiry, aadhaarNumber } = req.body;

  if (name) driver.name = name;
  if (phone) driver.phone = phone;
  if (avatar) driver.avatar = avatar;
  if (licenseNumber) driver.driverDetails.licenseNumber = licenseNumber;
  if (licenseExpiry) driver.driverDetails.licenseExpiry = licenseExpiry;
  if (aadhaarNumber) driver.driverDetails.aadhaarNumber = aadhaarNumber;

  await driver.save();

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: { driver: driver.getPublicProfile() }
  });
});

// Get driver earnings
exports.getDriverEarnings = asyncHandler(async (req, res, next) => {
  const driverId = req.user._id;
  const { startDate, endDate } = req.query;

  const matchQuery = {
    driver: driverId,
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

  // Get recent completed shipments
  const recentShipments = await Shipment.find({
    driver: driverId,
    status: 'delivered'
  })
    .populate('shipper', 'name')
    .sort({ updatedAt: -1 })
    .limit(10);

  res.status(200).json({
    success: true,
    data: {
      monthly: earnings,
      total: totalEarnings[0]?.total || 0,
      totalShipments: totalEarnings[0]?.count || 0,
      recentShipments
    }
  });
});

// Get earnings for a specific shipment
exports.getShipmentEarnings = asyncHandler(async (req, res, next) => {
  const { shipmentId } = req.params;
  const driverId = req.user._id;

  const shipment = await Shipment.findOne({
    _id: shipmentId,
    driver: driverId
  })
    .populate('shipper', 'name')
    .populate('carrier', 'name');

  if (!shipment) {
    return next(new AppError('Shipment not found', 404));
  }

  // Calculate driver's share (e.g., 70% of total price)
  const driverShare = shipment.pricing.acceptedPrice * 0.7;

  res.status(200).json({
    success: true,
    data: {
      shipment: {
        shipmentNumber: shipment.shipmentNumber,
        status: shipment.status,
        totalPrice: shipment.pricing.acceptedPrice,
        driverShare,
        completedAt: shipment.updatedAt
      }
    }
  });
});

// Update availability
exports.updateAvailability = asyncHandler(async (req, res, next) => {
  const { isAvailable } = req.body;

  const driver = await User.findById(req.user._id);
  driver.isActive = isAvailable;
  await driver.save();

  res.status(200).json({
    success: true,
    message: 'Availability updated successfully',
    data: { isAvailable: driver.isActive }
  });
});