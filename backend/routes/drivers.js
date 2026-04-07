const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driverController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Driver specific routes
router.use(authorize('driver'));

// Dashboard
router.get('/dashboard', driverController.getDriverDashboard);
router.get('/active-shipments', driverController.getActiveShipments);

// Profile
router.get('/profile', driverController.getDriverProfile);
router.put('/profile', driverController.updateDriverProfile);

// Earnings
router.get('/earnings', driverController.getDriverEarnings);
router.get('/earnings/:shipmentId', driverController.getShipmentEarnings);

// Availability
router.put('/availability', driverController.updateAvailability);

module.exports = router;