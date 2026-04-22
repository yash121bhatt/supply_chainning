const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const bidCtrl = require('../controllers/bidController');

// Carrier places a bid on a shipment
router.post('/:shipmentId', protect, authorize('carrier'), bidCtrl.placeBid);

// Shipper actions on a bid
router.patch('/:bidId/accept', protect, authorize('shipper'), bidCtrl.acceptBid);
router.patch('/:bidId/reject', protect, authorize('shipper'), bidCtrl.rejectBid);

module.exports = router;
