const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/errorHandler').AppError;
const User = require('../models/User');
const Shipment = require('../models/Shipment');

// Get admin dashboard stats
exports.getDashboardStats = asyncHandler(async (req, res, next) => {
  const userStatsPromise = Promise.all([
    User.countDocuments({ role: 'shipper' }),
    User.countDocuments({ role: 'carrier' }),
    User.countDocuments({ role: 'driver' }),
    User.countDocuments({ isActive: false })
  ]);

  const shipmentStatsPromise = Shipment.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        revenue: { $sum: '$pricing.quotedPrice' }
      }
    }
  ]);

  const recentShipmentsPromise = Shipment.find()
    .populate('shipper', 'name email')
    .populate('carrier', 'name email')
    .sort({ createdAt: -1 })
    .limit(10);

  const [userCounts, shipmentStats, recentShipments] = await Promise.all([
    userStatsPromise,
    shipmentStatsPromise,
    recentShipmentsPromise
  ]);

  const [totalShippers, totalCarriers, totalDrivers, inactiveUsers] = userCounts;

  const shipmentsByStatus = {};
  shipmentStats.forEach(s => {
    shipmentsByStatus[s._id] = s.count;
  });

  const totalRevenue = shipmentStats.reduce((sum, s) => sum + s.revenue, 0);

  res.status(200).json({
    success: true,
    data: {
      stats: {
        totalUsers: totalShippers + totalCarriers + totalDrivers + 1, // +1 for admin
        totalShippers,
        totalCarriers,
        totalDrivers,
        totalShipments: shipmentStats.reduce((sum, s) => sum + s.count, 0),
        pendingShipments: shipmentsByStatus.pending || 0,
        activeShipments: (shipmentsByStatus.assigned || 0) + (shipmentsByStatus.picked_up || 0) + (shipmentsByStatus.in_transit || 0),
        deliveredShipments: shipmentsByStatus.delivered || 0,
        totalRevenue,
        inactiveUsers
      },
      recentShipments
    }
  });
});

// Get all shipments (Admin)
exports.getAllShipments = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 20, status, city } = req.query;

  const query = {};
  if (status) query.status = status;
  if (city) {
    query.$or = [
      { 'pickupLocation.city': { $regex: city, $options: 'i' } },
      { 'deliveryLocation.city': { $regex: city, $options: 'i' } }
    ];
  }

  const shipments = await Shipment.find(query)
    .populate('shipper', 'name email phone')
    .populate('carrier', 'name email phone')
    .populate('driver', 'name email phone')
    .populate('vehicle', 'vehicleNumber vehicleType')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Shipment.countDocuments(query);

  res.status(200).json({
    success: true,
    data: {
      shipments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// Get shipment stats (Admin)
exports.getShipmentStats = asyncHandler(async (req, res, next) => {
  const stats = await Shipment.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalRevenue: { $sum: '$pricing.quotedPrice' }
      }
    }
  ]);

  const statsByStatus = {};
  stats.forEach(s => {
    statsByStatus[s._id] = { count: s.count, revenue: s.totalRevenue };
  });

  const totalShipments = stats.reduce((sum, s) => sum + s.count, 0);
  const totalRevenue = stats.reduce((sum, s) => sum + s.totalRevenue, 0);

  res.status(200).json({
    success: true,
    data: {
      statsByStatus,
      totalShipments,
      totalRevenue
    }
  });
});

// Admin: change shipment status
exports.adminUpdateShipment = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const shipment = await Shipment.findById(id);
  if (!shipment) {
    return next(new AppError('Shipment not found', 404));
  }

  Object.assign(shipment, req.body);

  if (req.body.status) {
    shipment.statusHistory.push({
      status: req.body.status,
      notes: req.body.notes || 'Status updated by admin',
      updatedBy: req.user._id
    });
  }

  await shipment.save();

  res.status(200).json({
    success: true,
    message: 'Shipment updated successfully',
    data: shipment
  });
});

// Admin: cancel shipment (override)
exports.adminCancelShipment = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { reason } = req.body;

  const shipment = await Shipment.findById(id);
  if (!shipment) {
    return next(new AppError('Shipment not found', 404));
  }

  shipment.status = 'cancelled';
  shipment.statusHistory.push({
    status: 'cancelled',
    notes: reason || 'Cancelled by admin',
    updatedBy: req.user._id
  });

  await shipment.save();

  res.status(200).json({
    success: true,
    message: 'Shipment cancelled by admin',
    data: shipment
  });
});
