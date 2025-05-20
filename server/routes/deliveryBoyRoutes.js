// server/routes/deliveryBoyRoutes.js

const express = require('express');
const router = express.Router();
const deliveryBoyController = require('../controllers/deliveryBoyController');
const { authenticateUser, authorizeRoles } = require('../middleware/auth');

// Auth routes (no authentication required)
router.post('/register', authenticateUser, authorizeRoles('admin'), deliveryBoyController.createDeliveryBoy); // Only admin can create delivery boys
router.post('/login', deliveryBoyController.loginDeliveryBoy);

// Protected routes
router.get('/', authenticateUser, authorizeRoles('admin'), deliveryBoyController.getAllDeliveryBoys); // Admin only
router.put('/:id/status', authenticateUser, authorizeRoles('admin', 'delivery'), deliveryBoyController.updateStatus); // Admin or self

// Get available delivery boys (admin only)
router.get('/available', authenticateUser, authorizeRoles('admin'), deliveryBoyController.getAvailableDeliveryBoys);

// Get delivery boy details
router.get('/:id', authenticateUser, authorizeRoles('admin', 'delivery'), deliveryBoyController.getDeliveryBoyDetails);

module.exports = router;