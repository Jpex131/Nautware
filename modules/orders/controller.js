const OrderModel = require('./model');
const LightningProvider = require('./lightning');

let cleanupRunning = false;

async function getCartSnapshot(cartItems) {
    const products = await OrderModel.getCartProducts(cartItems);
    return {
        items: products,
        totalCents: products.reduce((sum, product) => sum + (product.lineTotalCents || 0), 0)
    };
}

const OrderController = {
    viewCart: async (req, res) => {
        try {
            res.json(await getCartSnapshot(req.session.cart || {}));
        } catch (error) {
            console.error('Error loading cart:', error);
            res.status(500).json({ error: 'Could not load cart' });
        }
    },

    addCartItem: async (req, res) => {
        const productId = Number(req.params.productId);
        const quantity = Number(req.body.quantity ?? 1);
        if (!Number.isSafeInteger(productId) || productId < 1 || !Number.isInteger(quantity) || quantity < 1) {
            return res.status(400).json({ error: 'A valid product and quantity are required' });
        }

        try {
            const cart = { ...(req.session.cart || {}) };
            const newQuantity = (cart[String(productId)] || 0) + quantity;
            const [product] = await OrderModel.getCartProducts({ [productId]: newQuantity });
            if (!product || product.unavailable) {
                return res.status(409).json({ error: 'Product is unavailable or stock is insufficient' });
            }
            cart[String(productId)] = newQuantity;
            req.session.cart = cart;
            res.json(await getCartSnapshot(cart));
        } catch (error) {
            console.error('Error adding to cart:', error);
            res.status(500).json({ error: 'Could not add product to cart' });
        }
    },

    setCartItemQuantity: async (req, res) => {
        const productId = Number(req.params.productId);
        const quantity = Number(req.body.quantity);
        if (!Number.isSafeInteger(productId) || productId < 1 || !Number.isInteger(quantity) || quantity < 1) {
            return res.status(400).json({ error: 'A valid product and quantity are required' });
        }

        try {
            const [product] = await OrderModel.getCartProducts({ [productId]: quantity });
            if (!product || product.unavailable) {
                return res.status(409).json({ error: 'Product is unavailable or stock is insufficient' });
            }
            req.session.cart = { ...(req.session.cart || {}), [String(productId)]: quantity };
            res.json(await getCartSnapshot(req.session.cart));
        } catch (error) {
            console.error('Error updating cart:', error);
            res.status(500).json({ error: 'Could not update cart' });
        }
    },

    removeCartItem: async (req, res) => {
        const productId = Number(req.params.productId);
        if (!Number.isSafeInteger(productId) || productId < 1) {
            return res.status(400).json({ error: 'Invalid product ID' });
        }
        const cart = { ...(req.session.cart || {}) };
        delete cart[String(productId)];
        req.session.cart = cart;
        res.json(await getCartSnapshot(cart));
    },

    createCheckout: async (req, res) => {
        let checkout;
        try {
            const config = LightningProvider.getConfig();
            checkout = await OrderModel.createPendingOrder(req.session.userId, req.session.cart, config.network);
            const invoice = await LightningProvider.createInvoice({
                amountUsd: checkout.totalCents,
                orderNumber: checkout.orderNumber
            });
            const saved = await OrderModel.saveLightningInvoice(checkout.orderId, req.session.userId, invoice);
            if (!saved) throw new Error('Could not attach the invoice to the order');

            req.session.cart = {};
            res.status(201).json({
                success: true,
                checkoutUrl: `/orders/${checkout.orderId}/checkout`
            });
        } catch (error) {
            if (checkout) {
                await OrderModel.cancelPendingOrder(checkout.orderId, req.session.userId).catch(cancelError => {
                    console.error('Could not release checkout reservation:', cancelError);
                });
            }
            if (['EMPTY_CART', 'PRODUCT_UNAVAILABLE', 'OWN_PRODUCT', 'MIXED_SHOPS', 'INSUFFICIENT_STOCK'].includes(error.code)) {
                return res.status(409).json({ error: error.message });
            }
            if (error.code === 'PAYMENT_PROVIDER_UNAVAILABLE' || error.code === 'PAYMENT_PROVIDER_ERROR') {
                return res.status(503).json({ error: error.message });
            }
            console.error('Error creating checkout:', error);
            res.status(503).json({ error: error.message || 'Could not start Lightning checkout' });
        }
    },

    renderCheckout: async (req, res) => {
        try {
            const payment = await OrderModel.getPendingPayment(req.params.id, req.session.userId);
            if (!payment || !payment.payment_request) return res.status(404).send('Checkout not found');
            res.render('checkout', {
                username: req.session.username,
                orderId: req.params.id,
                paymentRequest: payment.payment_request,
                expiresAt: payment.invoice_expires_at,
                paymentStatus: payment.payment_status,
                orderStatus: payment.order_status,
                qrCodeUrl: LightningProvider.getQrCodeUrl(payment.payment_request)
            });
        } catch (error) {
            console.error('Error rendering checkout:', error);
            res.status(500).send('Could not load checkout');
        }
    },

    checkCheckoutStatus: async (req, res) => {
        try {
            const payment = await OrderModel.getPendingPayment(req.params.id, req.session.userId);
            if (!payment) return res.status(404).json({ error: 'Checkout not found' });
            if (payment.payment_status !== 'PENDING' || payment.order_status !== 'PENDING') {
                return res.json({ status: payment.payment_status, orderStatus: payment.order_status });
            }

            let providerPayment;
            try {
                providerPayment = await LightningProvider.getPayment(payment.transaction_id);
            } catch (error) {
                if (error.code === 'PAYMENT_PROVIDER_UNAVAILABLE' || error.code === 'PAYMENT_PROVIDER_ERROR') {
                    return res.status(503).json({ error: 'Could not verify payment yet. Retry shortly.' });
                }
                throw error;
            }

            if (providerPayment.status === 'success') {
                await OrderModel.markOrderPaid(req.params.id, req.session.userId);
                return res.json({ status: 'PAID', orderStatus: 'PAID' });
            }

            const isExpired = payment.invoice_expires_at && new Date(payment.invoice_expires_at) <= new Date();
            if (providerPayment.status === 'failed' || isExpired) {
                await OrderModel.cancelPendingOrder(req.params.id, req.session.userId);
                return res.json({ status: 'EXPIRED', orderStatus: 'CANCELLED' });
            }

            res.json({ status: 'PENDING', orderStatus: 'PENDING' });
        } catch (error) {
            console.error('Error checking checkout status:', error);
            res.status(500).json({ error: 'Could not check payment status' });
        }
    },

    cleanupPendingCheckouts: async () => {
        if (cleanupRunning) return;
        cleanupRunning = true;
        try {
            let expiredCheckouts;
            try {
                expiredCheckouts = await OrderModel.getExpiredPendingCheckouts();
            } catch (error) {
                console.error('Could not list expired checkouts:', error);
                return;
            }

            for (const checkout of expiredCheckouts) {
                if (checkout.transaction_id) {
                    try {
                        const payment = await LightningProvider.getPayment(checkout.transaction_id);
                        if (payment.status === 'success') {
                            await OrderModel.markOrderPaid(checkout.order_id, checkout.customer_id);
                            continue;
                        }
                        if (payment.status === 'pending' && checkout.invoice_expires_at > new Date()) continue;
                    } catch (error) {
                        console.error('Could not verify expired checkout:', error);
                        continue;
                    }
                }
                await OrderModel.cancelPendingOrder(checkout.order_id);
            }
        } finally {
            cleanupRunning = false;
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
