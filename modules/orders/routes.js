const express = require('express');
const router = express.Router();
const OrderController = require('./controller');

// Middleware to ensure authentication
const requireAuth = (req, res, next) => {
    if (req.session && req.session.userId) {
        return next();
    }
    res.redirect('/login');
};

// Apply auth middleware to all order routes
router.use(requireAuth);

router.post('/create', OrderController.createOrder);
router.get('/my-orders', OrderController.viewMyOrders);
router.get('/shop-orders', OrderController.viewShopOrders);
router.post('/:id/status', OrderController.updateOrderStatus);

module.exports = router;
