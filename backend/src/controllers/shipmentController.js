const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/errorHandler').AppError;
const Shipment = require('../models/Shipment');
const { SHIPMENT_STATUS } = require('../config/constants');

// Create a new shipment (shipper only)
exports.createShipment = asyncHandler(async (req, res, next) => {
  const { pickup, drop, type, weight, dimensions, description, budget, invitedCarriers } = req.body;

  if (!pickup?.address || !drop?.address) {
    return next(new AppError('Pickup and drop addresses are required', 400));
  }

  const shipment = new Shipment({
    shipper: req.user.id,
    pickup,
    drop,
    type: type || 'public',
    weight,
    dimensions,
    description,
    budget,
    invitedCarriers,
    status: SHIPMENT_STATUS.BIDDING // start in bidding phase
  });

  await shipment.save();
  res.status(201).json({ success: true, data: shipment });
});

// List shipments visible to the logged‑in user
exports.listShipments = asyncHandler(async (req, res, next) => {
  const { role, id } = req.user;
  let filter = {};

  if (role === 'shipper') {
    filter.shipper = id; // shipper sees own shipments
  } else if (role === 'carrier') {
    // public shipments OR private shipments where carrier is invited
    filter.$or = [
      { type: 'public' },
      { invitedCarriers: id }
    ];
  } else if (role === 'driver') {
    // driver sees shipments assigned to them
    filter.driver = id;
  } else if (role === 'admin') {
    // admin sees everything – no filter
  }

  const shipments = await Shipment.find(filter)
    .populate('shipper', 'name email')
    .populate('carrier', 'name email')
    .populate('driver', 'name email')
    .sort({ createdAt: -1 });

  res.json({ success: true, data: shipments });
});
