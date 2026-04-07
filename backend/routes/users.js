const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Admin only routes
router.get('/', authorize('admin'), userController.getAllUsers);
router.get('/stats', authorize('admin'), userController.getUserStats);
router.put('/:id/verify', authorize('admin'), userController.verifyUser);
router.put('/:id/status', authorize('admin'), userController.updateUserStatus);

// User routes (accessible to authenticated users)
router.get('/:id', userController.getUserById);
router.delete('/:id', userController.deleteAccount);

module.exports = router;