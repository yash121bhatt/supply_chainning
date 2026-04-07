const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// All routes require admin auth
router.use(protect);
router.use(authorize('admin'));

// Dashboard
router.get('/dashboard', adminController.getDashboardStats);

// Shipments
router.get('/shipments', adminController.getAllShipments);
router.get('/shipments/stats', adminController.getShipmentStats);
router.put('/shipments/:id', adminController.adminUpdateShipment);
router.put('/shipments/:id/cancel', adminController.adminCancelShipment);

module.exports = router;
