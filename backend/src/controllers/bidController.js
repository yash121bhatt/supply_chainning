const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/errorHandler').AppError;
const Bid = require('../models/Bid');
const Shipment = require('../models/Shipment');
const { BID_STATUS } = require('../config/constants');

// Carrier places a bid on a shipment
exports.placeBid = asyncHandler(async (req, res, next) => {
  const { shipmentId } = req.params;
  const { amount, note } = req.body;
  const carrierId = req.user.id;

  const shipment = await Shipment.findById(shipmentId);
  if (!shipment) return next(new AppError('Shipment not found', 404));

  if (shipment.status !== 'bidding' && shipment.status !== 'draft') {
    return next(new AppError('Cannot bid on a shipment that is not open for bidding', 400));
  }

  // optional: prevent duplicate bids by same carrier
  const existing = await Bid.findOne({ shipment: shipmentId, carrier: carrierId, status: { $ne: BID_STATUS.REJECTED } });
  if (existing) return next(new AppError('You already have an active bid on this shipment', 400));

  const bid = await Bid.create({ shipment: shipmentId, carrier: carrierId, amount, note });
  res.status(201).json({ success: true, data: bid });
});

// Shipper accepts a specific bid
exports.acceptBid = asyncHandler(async (req, res, next) => {
  const { bidId } = req.params;
  const shipperId = req.user.id;

  const bid = await Bid.findById(bidId).populate('shipment');
  if (!bid) return next(new AppError('Bid not found', 404));

  const shipment = bid.shipment;
  if (String(shipment.shipper) !== shipperId) {
    return next(new AppError('Only the shipment owner can accept a bid', 403));
  }

  if (shipment.status !== 'bidding') {
    return next(new AppError('Shipment is not in bidding state', 400));
  }

  // Accept this bid, reject others
  await Bid.updateMany({ shipment: shipment._id }, { status: BID_STATUS.REJECTED });
  bid.status = BID_STATUS.ACCEPTED;
  await bid.save();

  // Assign carrier to shipment and move status forward
  shipment.carrier = bid.carrier;
  shipment.status = 'payment_pending'; // next step after acceptance
  await shipment.save();

  res.json({ success: true, data: { bid, shipment } });
});

// Shipper can also reject a bid
exports.rejectBid = asyncHandler(async (req, res, next) => {
  const { bidId } = req.params;
  const shipperId = req.user.id;

  const bid = await Bid.findById(bidId).populate('shipment');
  if (!bid) return next(new AppError('Bid not found', 404));

  const shipment = bid.shipment;
  if (String(shipment.shipper) !== shipperId) {
    return next(new AppError('Only the shipment owner can reject a bid', 403));
  }

  if (bid.status !== BID_STATUS.PENDING && bid.status !== BID_STATUS.COUNTERED) {
    return next(new AppError('Bid cannot be rejected in its current state', 400));
  }

  bid.status = BID_STATUS.REJECTED;
  await bid.save();
  res.json({ success: true, data: bid });
});
