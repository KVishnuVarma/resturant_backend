// server/routes/menu.js

const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const { authenticateUser, authorizeRoles } = require('../middleware/auth');

// Public route to get all menu items
router.get('/items', menuController.getMenu);

// Admin routes
router.post('/admin-create', authenticateUser, authorizeRoles('admin'), menuController.addMenuItem);
router.put('/admin-update/:id', authenticateUser, authorizeRoles('admin'), menuController.updateMenuItem);
router.delete('/admin-delete/:id', authenticateUser, authorizeRoles('admin'), menuController.deleteMenuItem);

module.exports = router;