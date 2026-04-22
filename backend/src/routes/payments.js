const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const paymentCtrl = require('../controllers/paymentController');

// Create a Stripe payment intent – shipper only (or carrier if you allow carrier‑initiated)
router.post('/:shipmentId/create-intent', protect, authorize('shipper', 'carrier'), paymentCtrl.createPaymentIntent);

// Stripe webhook – no auth, but Stripe signature verification inside controller
router.post('/:shipmentId/webhook', paymentCtrl.webhook);

module.exports = router;
