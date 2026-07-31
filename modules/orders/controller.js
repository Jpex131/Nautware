const OrderModel = require('./model');

const OrderController = {
    createOrder: async (req, res) => {
        try {
            const buyerId = req.session.userId;
            const { shopId, items, totalAmount } = req.body;

            if (!shopId || !items || !totalAmount) {
                return res.status(400).json({ error: 'shopId, items, and totalAmount are required' });
            }

            const orderId = await OrderModel.createOrder(buyerId, shopId, items, totalAmount);
            res.status(201).json({ success: true, orderId });
        } catch (error) {
            console.error('Error creating order:', error);
            res.status(500).json({ error: 'Error creating order' });
        }
    },

    viewMyOrders: async (req, res) => {
        try {
            const buyerId = req.session.userId;
            const orders = await OrderModel.getOrdersByBuyer(buyerId);
            res.json({ orders });
        } catch (error) {
            console.error('Error fetching buyer orders:', error);
            res.status(500).json({ error: 'Error fetching orders' });
        }
    },

    viewShopOrders: async (req, res) => {
        try {
            const sellerId = req.session.userId;
            const shopId = req.query.shopId;

            if (!shopId) {
                return res.status(400).json({ error: 'shopId is required' });
            }

            const orders = await OrderModel.getOrdersByShop(shopId, sellerId);
            res.json({ orders });
        } catch (error) {
            console.error('Error fetching shop orders:', error);
            res.status(500).json({ error: 'Error fetching shop orders' });
        }
    },

    updateOrderStatus: async (req, res) => {
        try {
            const orderId = req.params.id;
            const { shopId, status } = req.body;
            const sellerId = req.session.userId;

            if (!shopId || !status) {
                return res.status(400).json({ error: 'shopId and status are required' });
            }

            const updated = await OrderModel.updateOrderStatus(orderId, shopId, status, sellerId);
            if (updated) {
                res.json({ success: true });
            } else {
                res.status(404).json({ error: 'Order not found or unauthorized' });
            }
        } catch (error) {
            console.error('Error updating order status:', error);
            res.status(500).json({ error: 'Error updating order status' });
        }
    }
};

module.exports = OrderController;
