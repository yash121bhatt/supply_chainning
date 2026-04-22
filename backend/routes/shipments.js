const express = require('express');
const router = express.Router();
const shipmentController = require('../controllers/shipmentController');
const { protect, authorize } = require('../middleware/auth');
const { body } = require('express-validator');
const { validateAsync } = require('../middleware/validate');

// All routes require authentication
router.use(protect);

// Validation rules
const createShipmentValidation = [
  body('pickupLocation').isObject().withMessage('Pickup location is required'),
  body('pickupLocation.address').notEmpty().withMessage('Pickup address is required'),
  body('pickupLocation.city').notEmpty().withMessage('Pickup city is required'),
  body('pickupLocation.state').notEmpty().withMessage('Pickup state is required'),
  body('pickupLocation.zipCode').notEmpty().withMessage('Pickup zip code is required'),
  body('deliveryLocation').isObject().withMessage('Delivery location is required'),
  body('deliveryLocation.address').notEmpty().withMessage('Delivery address is required'),
  body('deliveryLocation.city').notEmpty().withMessage('Delivery city is required'),
  body('deliveryLocation.state').notEmpty().withMessage('Delivery state is required'),
  body('deliveryLocation.zipCode').notEmpty().withMessage('Delivery zip code is required'),
  body('pickupDate')
    .notEmpty().withMessage('Pickup date is required')
    .isISO8601().withMessage('Invalid pickup date'),
  body('deliveryDate')
    .notEmpty().withMessage('Delivery date is required')
    .isISO8601().withMessage('Invalid delivery date'),
  body('goodsDetails').isObject().withMessage('Goods details are required'),
  body('goodsDetails.description')
    .notEmpty().withMessage('Goods description is required'),
  body('goodsDetails.weight')
    .notEmpty().withMessage('Weight is required')
    .isNumeric().withMessage('Weight must be a number'),
  body('goodsDetails.value')
    .notEmpty().withMessage('Goods value is required')
    .isNumeric().withMessage('Value must be a number'),
  body('pricing').isObject().withMessage('Pricing info is required'),
  body('pricing.quotedPrice')
    .notEmpty().withMessage('Quoted price is required')
    .isNumeric().withMessage('Price must be a number'),
  body('shipmentType')
    .optional()
    .isIn(['full_truckload', 'less_than_truckload', 'partial_truckload', 'container'])
    .withMessage('Invalid shipment type')
];

const updateStatusValidation = [
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled'])
    .withMessage('Invalid status'),
  body('location')
    .optional()
    .isObject(),
  body('notes')
    .optional()
    .isString()
];

// Shipper routes
router.post('/', authorize('shipper'), validateAsync(createShipmentValidation), shipmentController.createShipment);
router.get('/my-shipments', authorize('shipper', 'carrier'), shipmentController.getMyShipments);
router.get('/:id', shipmentController.getShipmentById);

// Shipment status updates (Driver)
router.put('/:id/status', authorize('driver'), validateAsync(updateStatusValidation), shipmentController.updateShipmentStatus);
router.put('/:id/location', authorize('driver'), shipmentController.updateShipmentLocation);
router.post('/:id/pod', authorize('driver'), shipmentController.uploadProofOfDelivery);

// Carrier routes
router.get('/available/list', authorize('carrier'), shipmentController.getAvailableShipments);
router.put('/:id/accept', authorize('carrier'), shipmentController.acceptShipment);
router.put('/:id/reject', authorize('carrier'), shipmentController.rejectShipment);
router.put('/:id/assign-driver', authorize('carrier'), shipmentController.assignDriver);

// Common routes
router.put('/:id', shipmentController.updateShipment);
router.delete('/:id', shipmentController.cancelShipment);
router.get('/:id/tracking', shipmentController.trackShipment);
router.post('/:id/rating', shipmentController.submitRating);

module.exports = router;