const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/errorHandler').AppError;
const Bid = require('../models/Bid');
const Shipment = require('../models/Shipment');
const Notification = require('../models/Notification');
const { SHIPMENT_STATUS } = require('../config/constants');

const BID_STATUS = Bid.schema.statics.BID_STATUS;

exports.placeBid = asyncHandler(async (req, res, next) => {
  const { shipmentId, amount, notes, proposedPickupDate, proposedDeliveryDate, validUntil } = req.body;
  const carrierId = req.user._id;

  const shipment = await Shipment.findById(shipmentId);
  if (!shipment) {
    return next(new AppError('Shipment not found', 404));
  }

  if (shipment.status !== SHIPMENT_STATUS.PENDING) {
    return next(new AppError('This shipment is no longer accepting bids', 400));
  }

  const existingBid = await Bid.findOne({
    shipment: shipmentId,
    carrier: carrierId,
    status: BID_STATUS.PENDING
  });

  if (existingBid) {
    return next(new AppError('You already have a pending bid on this shipment', 400));
  }

  if (new Date() > new Date(validUntil)) {
    return next(new AppError('Valid until date must be in the future', 400));
  }

  const bid = new Bid({
    shipment: shipmentId,
    carrier: carrierId,
    shipper: shipment.shipper,
    amount,
    notes,
    proposedPickupDate,
    proposedDeliveryDate,
    validUntil: validUntil || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });

  await bid.save();
  await bid.populate('carrier', 'name email phone carrierDetails');

  await Notification.create({
    recipient: shipment.shipper,
    type: 'new_bid',
    title: 'New Bid Received',
    message: `A carrier has placed a bid of ₹${amount} on shipment ${shipment.shipmentNumber}`,
    shipment: shipmentId,
    data: { bidId: bid._id }
  });

  res.status(201).json({
    success: true,
    message: 'Bid placed successfully',
    data: { bid }
  });
});

exports.getBidsForShipment = asyncHandler(async (req, res, next) => {
  const { shipmentId } = req.params;
  const shipperId = req.user._id;

  const shipment = await Shipment.findById(shipmentId);
  if (!shipment) {
    return next(new AppError('Shipment not found', 404));
  }

  if (shipment.shipper.toString() !== shipperId.toString() && req.user.role !== 'admin') {
    return next(new AppError('You do not have permission to view bids for this shipment', 403));
  }

  const bids = await Bid.find({ shipment: shipmentId })
    .populate('carrier', 'name email phone carrierDetails companyDetails')
    .sort({ amount: 1 });

  res.status(200).json({
    success: true,
    data: { bids }
  });
});

exports.getMyBids = asyncHandler(async (req, res, next) => {
  const carrierId = req.user._id;
  const { status, page = 1, limit = 20 } = req.query;

  const query = { carrier: carrierId };
  if (status) query.status = status;

  const bids = await Bid.find(query)
    .populate('shipment', 'shipmentNumber status pickupLocation deliveryLocation pickupDate pricing')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Bid.countDocuments(query);

  res.status(200).json({
    success: true,
    data: {
      bids,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

exports.getBidById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const bid = await Bid.findById(id)
    .populate('carrier', 'name email phone carrierDetails')
    .populate('shipment')
    .populate('shipper', 'name email phone');

  if (!bid) {
    return next(new AppError('Bid not found', 404));
  }

  const userId = req.user._id.toString();
  const isAuthorized = [
    bid.carrier._id.toString(),
    bid.shipper._id.toString()
  ].includes(userId) || req.user.role === 'admin';

  if (!isAuthorized) {
    return next(new AppError('You do not have permission to view this bid', 403));
  }

  res.status(200).json({
    success: true,
    data: { bid }
  });
});

exports.acceptBid = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const shipperId = req.user._id;

  const bid = await Bid.findById(id).populate('shipment');
  if (!bid) {
    return next(new AppError('Bid not found', 404));
  }

  if (bid.shipper.toString() !== shipperId.toString()) {
    return next(new AppError('Only the shipper can accept bids', 403));
  }

  if (bid.status !== BID_STATUS.PENDING) {
    return next(new AppError('This bid is no longer valid', 400));
  }

  if (bid.isExpired()) {
    return next(new AppError('This bid has expired', 400));
  }

  const shipment = bid.shipment;
  if (shipment.status !== SHIPMENT_STATUS.PENDING) {
    return next(new AppError('Shipment is no longer available', 400));
  }

  bid.status = BID_STATUS.ACCEPTED;
  bid.acceptedAt = new Date();
  bid.respondedBy = shipperId;
  await bid.save();

  await Bid.updateMany(
    { shipment: shipment._id, _id: { $ne: bid._id } },
    { status: BID_STATUS.REJECTED, rejectedAt: new Date() }
  );

  shipment.carrier = bid.carrier;
  shipment.status = SHIPMENT_STATUS.ASSIGNED;
  shipment.pricing.acceptedPrice = bid.amount;
  shipment.statusHistory.push({
    status: SHIPMENT_STATUS.ASSIGNED,
    notes: `Bid accepted. Price: ₹${bid.amount}`,
    updatedBy: shipperId
  });
  await shipment.save();

  await Notification.create({
    recipient: bid.carrier,
    type: 'bid_accepted',
    title: 'Bid Accepted',
    message: `Your bid of ₹${bid.amount} for shipment ${shipment.shipmentNumber} has been accepted!`,
    shipment: shipment._id,
    data: { bidId: bid._id }
  });

  res.status(200).json({
    success: true,
    message: 'Bid accepted successfully',
    data: { bid, shipment }
  });
});

exports.rejectBid = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { reason } = req.body;
  const shipperId = req.user._id;

  const bid = await Bid.findById(id).populate('shipment');
  if (!bid) {
    return next(new AppError('Bid not found', 404));
  }

  if (bid.shipper.toString() !== shipperId.toString()) {
    return next(new AppError('Only the shipper can reject bids', 403));
  }

  if (bid.status !== BID_STATUS.PENDING) {
    return next(new AppError('This bid is no longer valid', 400));
  }

  bid.status = BID_STATUS.REJECTED;
  bid.rejectedAt = new Date();
  bid.respondedBy = shipperId;
  bid.bidHistory.push({
    action: 'rejected',
    notes: reason || 'Bid rejected by shipper',
    timestamp: new Date(),
    updatedBy: shipperId
  });
  await bid.save();

  await Notification.create({
    recipient: bid.carrier,
    type: 'bid_rejected',
    title: 'Bid Rejected',
    message: `Your bid for shipment ${bid.shipment.shipmentNumber} has been rejected.`,
    shipment: bid.shipment._id,
    data: { bidId: bid._id }
  });

  res.status(200).json({
    success: true,
    message: 'Bid rejected',
    data: { bid }
  });
});

exports.counterOffer = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { counterAmount, notes, proposedPickupDate, proposedDeliveryDate } = req.body;
  const userId = req.user._id;

  const bid = await Bid.findById(id);
  if (!bid) {
    return next(new AppError('Bid not found', 404));
  }

  const isShipper = bid.shipper.toString() === userId.toString();
  const isCarrier = bid.carrier.toString() === userId.toString();

  if (!isShipper && !isCarrier) {
    return next(new AppError('You do not have permission to counter this bid', 403));
  }

  if (bid.status !== BID_STATUS.PENDING && bid.status !== BID_STATUS.COUNTERED) {
    return next(new AppError('Cannot counter this bid in its current state', 400));
  }

  bid.bidHistory.push({
    previousAmount: bid.amount,
    newAmount: counterAmount,
    action: 'counter_offer',
    notes,
    timestamp: new Date(),
    updatedBy: userId
  });

  bid.amount = counterAmount;
  bid.status = BID_STATUS.COUNTERED;
  bid.counterOfferFrom = userId;
  if (proposedPickupDate) bid.proposedPickupDate = proposedPickupDate;
  if (proposedDeliveryDate) bid.proposedDeliveryDate = proposedDeliveryDate;
  bid.validUntil = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

  await bid.save();

  const recipientId = isShipper ? bid.carrier : bid.shipper;
  await Notification.create({
    recipient: recipientId,
    type: 'bid_countered',
    title: 'Counter Offer Received',
    message: `A counter offer of ₹${counterAmount} has been made for your bid.`,
    shipment: bid.shipment,
    data: { bidId: bid._id }
  });

  res.status(200).json({
    success: true,
    message: 'Counter offer sent',
    data: { bid }
  });
});

exports.respondToCounter = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { accept, notes } = req.body;
  const userId = req.user._id;

  const bid = await Bid.findById(id).populate('shipment');
  if (!bid) {
    return next(new AppError('Bid not found', 404));
  }

  const isShipper = bid.shipper.toString() === userId.toString();
  const isCarrier = bid.carrier.toString() === userId.toString();

  if (!isShipper && !isCarrier) {
    return next(new AppError('You do not have permission to respond to this bid', 403));
  }

  if (bid.status !== BID_STATUS.COUNTERED) {
    return next(new AppError('This bid is not in countered status', 400));
  }

  if (accept) {
    bid.status = BID_STATUS.ACCEPTED;
    bid.acceptedAt = new Date();
    bid.respondedBy = userId;

    const shipment = bid.shipment;
    shipment.carrier = bid.carrier;
    shipment.status = SHIPMENT_STATUS.ASSIGNED;
    shipment.pricing.acceptedPrice = bid.amount;
    shipment.statusHistory.push({
      status: SHIPMENT_STATUS.ASSIGNED,
      notes: `Counter offer accepted. Final price: ₹${bid.amount}`,
      updatedBy: userId
    });
    await shipment.save();

    await Bid.updateMany(
      { shipment: shipment._id, _id: { $ne: bid._id } },
      { status: BID_STATUS.REJECTED, rejectedAt: new Date() }
    );
  } else {
    bid.status = BID_STATUS.REJECTED;
    bid.rejectedAt = new Date();
    bid.respondedBy = userId;
  }

  if (notes) {
    bid.notes = notes;
  }

  await bid.save();

  const recipientId = isShipper ? bid.carrier : bid.shipper;
  await Notification.create({
    recipient: recipientId,
    type: accept ? 'bid_accepted' : 'bid_rejected',
    title: accept ? 'Counter Offer Accepted' : 'Counter Offer Rejected',
    message: accept
      ? `Your counter offer of ₹${bid.amount} has been accepted!`
      : `The counter offer of ₹${bid.amount} has been rejected.`,
    shipment: bid.shipment._id,
    data: { bidId: bid._id }
  });

  res.status(200).json({
    success: true,
    message: accept ? 'Counter offer accepted' : 'Counter offer rejected',
    data: { bid }
  });
});

exports.withdrawBid = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const carrierId = req.user._id;

  const bid = await Bid.findById(id);
  if (!bid) {
    return next(new AppError('Bid not found', 404));
  }

  if (bid.carrier.toString() !== carrierId.toString()) {
    return next(new AppError('Only the carrier can withdraw their bid', 403));
  }

  if (bid.status !== BID_STATUS.PENDING && bid.status !== BID_STATUS.COUNTERED) {
    return next(new AppError('Cannot withdraw bid in its current state', 400));
  }

  bid.status = BID_STATUS.WITHDRAWN;
  await bid.save();

  res.status(200).json({
    success: true,
    message: 'Bid withdrawn successfully',
    data: { bid }
  });
});
