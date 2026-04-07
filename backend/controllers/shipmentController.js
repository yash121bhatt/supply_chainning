const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/errorHandler').AppError;
const Shipment = require('../models/Shipment');
const User = require('../models/User');
const Chat = require('../models/Chat');
const Notification = require('../models/Notification');
const { SHIPMENT_STATUS } = require('../config/constants');

// Create new shipment (Shipper)
exports.createShipment = asyncHandler(async (req, res, next) => {
  const shipperId = req.user._id;
  const year = new Date().getFullYear();
  const randomNum = Math.floor(100000 + Math.random() * 900000);

  const shipment = new Shipment({
    ...req.body,
    shipper: shipperId,
    status: SHIPMENT_STATUS.PENDING,
    shipmentNumber: `SHP${year}${randomNum}`
  });

  await shipment.save();

  res.status(201).json({
    success: true,
    message: 'Shipment created successfully',
    data: shipment
  });
});

// Get my shipments (Shipper)
exports.getMyShipments = asyncHandler(async (req, res, next) => {
  const shipperId = req.user._id;
  const { status, page = 1, limit = 20 } = req.query;

  const query = { shipper: shipperId };
  if (status) query.status = status;

  const shipments = await Shipment.find(query)
    .populate('carrier', 'name email phone avatar')
    .populate('driver', 'name phone avatar')
    .populate('vehicle', 'vehicleNumber vehicleType brand model')
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

// Get shipment by ID
exports.getShipmentById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const shipment = await Shipment.findById(id)
    .populate('shipper', 'name email phone avatar')
    .populate('carrier', 'name email phone avatar carrierDetails')
    .populate('driver', 'name phone avatar driverDetails')
    .populate('vehicle', 'vehicleNumber vehicleType brand model capacity');

  if (!shipment) {
    return next(new AppError('Shipment not found', 404));
  }

  // Check permission
  const userId = req.user._id.toString();
  const userRole = req.user.role;

  const isShipper = shipment.shipper._id.toString() === userId;
  const isCarrier = shipment.carrier && shipment.carrier._id.toString() === userId;
  const isDriver = shipment.driver && shipment.driver._id.toString() === userId;
  const isAdmin = userRole === 'admin';

  if (!isShipper && !isCarrier && !isDriver && !isAdmin) {
    return next(new AppError('You do not have permission to view this shipment', 403));
  }

  res.status(200).json({
    success: true,
    data: { shipment }
  });
});

// Get available shipments (Carrier)
exports.getAvailableShipments = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 20, pickupLocation, deliveryLocation, shipmentType } = req.query;

  const query = {
    status: SHIPMENT_STATUS.PENDING,
    carrier: null
  };

  // Add location filters if provided
  if (pickupLocation) {
    query['pickupLocation.city'] = { $regex: pickupLocation, $options: 'i' };
  }

  if (deliveryLocation) {
    query['deliveryLocation.city'] = { $regex: deliveryLocation, $options: 'i' };
  }

  if (shipmentType) {
    query.shipmentType = shipmentType;
  }

  const shipments = await Shipment.find(query)
    .populate('shipper', 'name companyDetails')
    .sort({ pickupDate: 1 })
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

// Accept shipment (Carrier)
exports.acceptShipment = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { acceptedPrice } = req.body;
  const carrierId = req.user._id;

  const shipment = await Shipment.findById(id);
  if (!shipment) {
    return next(new AppError('Shipment not found', 404));
  }

  if (shipment.status !== SHIPMENT_STATUS.PENDING) {
    return next(new AppError('This shipment is no longer available', 400));
  }

  if (shipment.carrier) {
    return next(new AppError('This shipment has already been assigned', 400));
  }

  // Update shipment
  shipment.carrier = carrierId;
  shipment.status = SHIPMENT_STATUS.ASSIGNED;
  if (acceptedPrice) {
    shipment.pricing.acceptedPrice = acceptedPrice;
  }

  // Add status history
  shipment.statusHistory.push({
    status: SHIPMENT_STATUS.ASSIGNED,
    notes: 'Shipment accepted by carrier',
    updatedBy: carrierId
  });

  await shipment.save();

  // Create notification for shipper
  await Notification.create({
    recipient: shipment.shipper,
    type: 'shipment_assigned',
    title: 'Shipment Accepted',
    message: `Your shipment ${shipment.shipmentNumber} has been accepted by a carrier.`,
    shipment: shipment._id
  });

  res.status(200).json({
    success: true,
    message: 'Shipment accepted successfully',
    data: { shipment }
  });
});

// Reject shipment (Carrier)
exports.rejectShipment = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { reason } = req.body;

  const shipment = await Shipment.findById(id);
  if (!shipment) {
    return next(new AppError('Shipment not found', 404));
  }

  res.status(200).json({
    success: true,
    message: 'Shipment rejected'
  });
});

// Assign driver to shipment (Carrier)
exports.assignDriver = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { driverId, vehicleId } = req.body;

  const shipment = await Shipment.findById(id);
  if (!shipment) {
    return next(new AppError('Shipment not found', 404));
  }

  if (shipment.carrier.toString() !== req.user._id.toString()) {
    return next(new AppError('You are not authorized to assign driver to this shipment', 403));
  }

  // Verify driver belongs to carrier
  const driver = await User.findOne({ _id: driverId, driverDetails: { assignedCarrier: req.user._id } });
  if (!driver) {
    return next(new AppError('Driver not found or not assigned to your company', 404));
  }

  shipment.driver = driverId;
  shipment.vehicle = vehicleId;

  await shipment.save();

  // Create notification for driver
  await Notification.create({
    recipient: driverId,
    type: 'shipment_assigned',
    title: 'New Assignment',
    message: `You have been assigned to shipment ${shipment.shipmentNumber}.`,
    shipment: shipment._id
  });

  res.status(200).json({
    success: true,
    message: 'Driver assigned successfully',
    data: { shipment }
  });
});

// Update shipment status (Driver)
exports.updateShipmentStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { status, location, notes } = req.body;

  const shipment = await Shipment.findById(id);
  if (!shipment) {
    return next(new AppError('Shipment not found', 404));
  }

  if (shipment.driver?.toString() !== req.user._id.toString()) {
    return next(new AppError('You are not authorized to update this shipment', 403));
  }

  shipment.status = status;
  shipment.statusHistory.push({
    status,
    location: location || shipment.currentLocation,
    notes,
    updatedBy: req.user._id
  });

  await shipment.save();

  // Notify relevant parties
  const notifications = [];
  if (shipment.shipper) {
    notifications.push({
      recipient: shipment.shipper,
      type: 'shipment_delivered',
      title: `Shipment ${status}`,
      message: `Your shipment ${shipment.shipmentNumber} status updated to ${status}.`,
      shipment: shipment._id
    });
  }
  if (shipment.carrier && status === SHIPMENT_STATUS.DELIVERED) {
    notifications.push({
      recipient: shipment.carrier,
      type: 'shipment_delivered',
      title: 'Shipment Delivered',
      message: `Shipment ${shipment.shipmentNumber} has been delivered.`,
      shipment: shipment._id
    });
  }

  if (notifications.length > 0) {
    await Notification.insertMany(notifications);
  }

  res.status(200).json({
    success: true,
    message: 'Shipment status updated successfully',
    data: { shipment }
  });
});

// Update shipment location (Driver)
exports.updateShipmentLocation = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { latitude, longitude, address, city, state } = req.body;

  const shipment = await Shipment.findById(id);
  if (!shipment) {
    return next(new AppError('Shipment not found', 404));
  }

  if (shipment.driver?.toString() !== req.user._id.toString()) {
    return next(new AppError('You are not authorized to update this shipment', 403));
  }

  shipment.currentLocation = {
    address,
    city,
    state,
    coordinates: {
      lat: latitude,
      lng: longitude
    }
  };

  await shipment.save();

  res.status(200).json({
    success: true,
    message: 'Location updated successfully',
    data: { shipment }
  });
});

// Upload proof of delivery (Driver)
exports.uploadProofOfDelivery = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { deliveryImage, signatureImage, receivedBy } = req.body;

  const shipment = await Shipment.findById(id);
  if (!shipment) {
    return next(new AppError('Shipment not found', 404));
  }

  if (shipment.driver?.toString() !== req.user._id.toString()) {
    return next(new AppError('You are not authorized to update this shipment', 403));
  }

  shipment.proofOfDelivery = {
    deliveryImage,
    signatureImage,
    receivedBy,
    deliveredAt: new Date()
  };

  await shipment.save();

  res.status(200).json({
    success: true,
    message: 'Proof of delivery uploaded successfully',
    data: { shipment }
  });
});

// Update shipment
exports.updateShipment = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const shipment = await Shipment.findById(id);
  if (!shipment) {
    return next(new AppError('Shipment not found', 404));
  }

  // Check permission
  const userId = req.user._id.toString();
  const isShipper = shipment.shipper.toString() === userId;
  const isAdmin = req.user.role === 'admin';

  if (!isShipper && !isAdmin) {
    return next(new AppError('You do not have permission to update this shipment', 403));
  }

  // Only allow updates for pending shipments
  if (shipment.status !== SHIPMENT_STATUS.PENDING && !isAdmin) {
    return next(new AppError('Cannot update shipment after assignment', 400));
  }

  Object.assign(shipment, req.body);
  await shipment.save();

  res.status(200).json({
    success: true,
    message: 'Shipment updated successfully',
    data: { shipment }
  });
});

// Cancel shipment
exports.cancelShipment = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const shipment = await Shipment.findById(id);
  if (!shipment) {
    return next(new AppError('Shipment not found', 404));
  }

  // Check permission
  const userId = req.user._id.toString();
  const isShipper = shipment.shipper.toString() === userId;
  const isCarrier = shipment.carrier?.toString() === userId;
  const isAdmin = req.user.role === 'admin';

  if (!isShipper && !isCarrier && !isAdmin) {
    return next(new AppError('You do not have permission to cancel this shipment', 403));
  }

  // Cannot cancel already delivered shipments
  if (shipment.status === SHIPMENT_STATUS.DELIVERED) {
    return next(new AppError('Cannot cancel a delivered shipment', 400));
  }

  shipment.status = SHIPMENT_STATUS.CANCELLED;
  shipment.statusHistory.push({
    status: SHIPMENT_STATUS.CANCELLED,
    notes: 'Shipment cancelled',
    updatedBy: req.user._id
  });

  await shipment.save();

  res.status(200).json({
    success: true,
    message: 'Shipment cancelled successfully',
    data: { shipment }
  });
});

// Track shipment
exports.trackShipment = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const shipment = await Shipment.findById(id)
    .select('shipmentNumber status currentLocation pickupLocation deliveryLocation estimatedArrival statusHistory')
    .populate('driver', 'name phone avatar')
    .populate('vehicle', 'vehicleNumber vehicleType');

  if (!shipment) {
    return next(new AppError('Shipment not found', 404));
  }

  res.status(200).json({
    success: true,
    data: { shipment }
  });
});