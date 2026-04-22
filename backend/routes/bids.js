const express = require('express');
const router = express.Router();
const bidController = require('../controllers/bidController');
const { protect, authorize } = require('../middleware/auth');
const { body } = require('express-validator');
const { validateAsync } = require('../middleware/validate');

router.use(protect);

const placeBidValidation = [
  body('shipmentId').notEmpty().withMessage('Shipment ID is required'),
  body('amount')
    .notEmpty().withMessage('Bid amount is required')
    .isNumeric().withMessage('Amount must be a number')
    .custom((value) => value > 0).withMessage('Amount must be greater than 0'),
  body('validUntil')
    .optional()
    .isISO8601().withMessage('Invalid date format')
];

const counterOfferValidation = [
  body('counterAmount')
    .notEmpty().withMessage('Counter amount is required')
    .isNumeric().withMessage('Amount must be a number')
];

router.post('/', authorize('carrier'), validateAsync(placeBidValidation), bidController.placeBid);
router.get('/my-bids', authorize('carrier'), bidController.getMyBids);
router.get('/:id', bidController.getBidById);
router.put('/:id/accept', authorize('shipper'), bidController.acceptBid);
router.put('/:id/reject', authorize('shipper'), bidController.rejectBid);
router.put('/:id/counter', bidController.counterOffer);
router.put('/:id/respond-counter', bidController.respondToCounter);
router.put('/:id/withdraw', authorize('carrier'), bidController.withdrawBid);
router.get('/shipment/:shipmentId', bidController.getBidsForShipment);

module.exports = router;
