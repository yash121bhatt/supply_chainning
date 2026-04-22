const express = require('express');
const router = express.Router();
const directoryController = require('../controllers/directoryController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/carriers', authorize('shipper', 'admin'), directoryController.getCarriers);
router.get('/carriers/:id', authorize('shipper', 'admin'), directoryController.getCarrierProfile);

router.get('/shippers', authorize('carrier', 'admin'), directoryController.getShippers);
router.get('/shippers/:id', authorize('carrier', 'admin'), directoryController.getShipperProfile);

module.exports = router;