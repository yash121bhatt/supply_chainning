const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');
const { body } = require('express-validator');
const { validateAsync } = require('../middleware/validate');

router.use(protect);

router.post('/create', authorize('shipper'), paymentController.createPayment);
router.post('/verify', paymentController.verifyPayment);
router.get('/status/:shipmentId', paymentController.getPaymentStatus);
router.post('/refund', authorize('shipper', 'admin'), paymentController.initiateRefund);
router.post('/release', authorize('admin'), paymentController.releasePayment);
router.get('/transactions', paymentController.getTransactionHistory);

module.exports = router;
