const express = require('express');
const router = express.Router();
const carrierController = require('../controllers/carrierController');
const { protect, authorize } = require('../middleware/auth');
const { body } = require('express-validator');
const { validateAsync } = require('../middleware/validate');

// All routes require authentication
router.use(protect);

// Carrier specific routes
router.use(authorize('carrier'));

// Vehicle management
router.get('/vehicles', carrierController.getMyVehicles);
router.post('/vehicles', validateAsync([
  body('vehicleNumber').notEmpty().withMessage('Vehicle number is required'),
  body('vehicleType').notEmpty().withMessage('Vehicle type is required'),
  body('brand').notEmpty().withMessage('Brand is required'),
  body('model').notEmpty().withMessage('Model is required'),
  body('year').notEmpty().withMessage('Year is required').isNumeric(),
  body('capacity.weight').notEmpty().withMessage('Capacity weight is required').isNumeric(),
  body('registrationNumber').notEmpty().withMessage('Registration number is required'),
  body('insuranceNumber').notEmpty().withMessage('Insurance number is required')
]), carrierController.addVehicle);
router.put('/vehicles/:id', carrierController.updateVehicle);
router.delete('/vehicles/:id', carrierController.deleteVehicle);

// Dashboard
router.get('/dashboard', carrierController.getCarrierDashboard);
router.get('/earnings', carrierController.getCarrierEarnings);

// Driver management
router.get('/drivers', carrierController.getMyDrivers);
router.post('/drivers/invite', carrierController.inviteDriver);

module.exports = router;