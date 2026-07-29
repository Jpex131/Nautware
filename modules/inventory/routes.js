const express = require('express');
const router = express.Router();
const InventoryController = require('./controller');

// Middleware to ensure authentication
const requireAuth = (req, res, next) => {
    if (req.session && req.session.userId) {
        return next();
    }
    res.redirect('/login');
};

// Apply auth middleware to all inventory routes
router.use(requireAuth);

// Dashboard view
router.get('/', InventoryController.renderInventoryDashboard);

// Shop routes
router.post('/shop/create', InventoryController.createShop);

// Product routes
router.post('/product/create', InventoryController.createProduct);
router.post('/product/:id/update', InventoryController.updateProduct);
router.post('/product/:id/delete', InventoryController.deleteProduct);

// API/Discovery routes
router.get('/api/discover', InventoryController.discoverProducts);

module.exports = router;
