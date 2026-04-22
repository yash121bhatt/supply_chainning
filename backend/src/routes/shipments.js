const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const shipmentCtrl = require('../controllers/shipmentController');

// Create – shipper only
router.post('/', protect, authorize('shipper'), shipmentCtrl.createShipment);

// List – varies by role (auth middleware provides req.user)
router.get('/', protect, shipmentCtrl.listShipments);

module.exports = router;
