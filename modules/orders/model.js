const pool = require('../../core/database/db');
const crypto = require('crypto');

class OrderModel {
    static priceToCents(price) {
        const match = String(price).match(/^(\d+)(?:\.(\d{1,2}))?$/);
        if (!match) throw new Error('Invalid product price');
        return Number(match[1]) * 100 + Number((match[2] || '').padEnd(2, '0'));
    }

    static async getCartProducts(cartItems) {
        const items = Object.entries(cartItems || {});
        if (items.length === 0) return [];

        const productIds = items.map(([productId]) => Number(productId));
        const placeholders = productIds.map(() => '?').join(', ');
        const [products] = await pool.execute(
            `SELECT p.id, p.shop_id, p.name, p.price, p.stock_level, p.is_active, s.shop_name
             FROM products p
             JOIN shops s ON s.id = p.shop_id
             WHERE p.id IN (${placeholders})`,
            productIds
        );
        const productById = new Map(products.map(product => [String(product.id), product]));

        return items.map(([productId, quantity]) => {
            const product = productById.get(String(productId));
            if (!product) return { productId: Number(productId), quantity, unavailable: true };

            const unitPriceCents = this.priceToCents(product.price);
            return {
                productId: Number(product.id),
                shopId: String(product.shop_id),
                shopName: product.shop_name,
                name: product.name,
                quantity,
                stockLevel: product.stock_level,
                unitPriceCents,
                lineTotalCents: unitPriceCents * quantity,
                unavailable: !product.is_active || product.stock_level < quantity
            };
        });
    }

    static async createPendingOrder(buyerId, cartItems, network) {
        const connection = await pool.getConnection();
        const items = Object.entries(cartItems || {});
        if (items.length === 0) {
            connection.release();
            const error = new Error('Your cart is empty');
            error.code = 'EMPTY_CART';
            throw error;
        }

        try {
            await connection.beginTransaction();

            const productIds = items.map(([productId]) => Number(productId));
            const placeholders = productIds.map(() => '?').join(', ');
            const [products] = await connection.execute(
                `SELECT p.id, p.shop_id, p.name, p.price, p.stock_level, p.is_active,
                        s.user_id AS seller_id
                 FROM products p
                 JOIN shops s ON s.id = p.shop_id
                 WHERE p.id IN (${placeholders})
                 FOR UPDATE`,
                productIds
            );

            if (products.length !== items.length) {
                const error = new Error('One or more products are no longer available');
                error.code = 'PRODUCT_UNAVAILABLE';
                throw error;
            }
            if (products.some(product => String(product.seller_id) === String(buyerId))) {
                const error = new Error('You cannot purchase products from your own shop');
                error.code = 'OWN_PRODUCT';
                throw error;
            }
            if (products.some(product => !product.is_active)) {
                const error = new Error('One or more products are no longer available');
                error.code = 'PRODUCT_UNAVAILABLE';
                throw error;
            }

            const shopIds = new Set(products.map(product => String(product.shop_id)));
            if (shopIds.size !== 1) {
                const error = new Error('A checkout can only contain products from one shop');
                error.code = 'MIXED_SHOPS';
                throw error;
            }

            const productById = new Map(products.map(product => [String(product.id), product]));
            const checkoutItems = items.map(([productId, quantity]) => {
                const product = productById.get(String(productId));
                if (!Number.isInteger(quantity) || quantity < 1 || product.stock_level < quantity) {
                    const error = new Error(`${product.name} does not have enough stock`);
                    error.code = 'INSUFFICIENT_STOCK';
                    throw error;
                }

                const unitPriceCents = this.priceToCents(product.price);
                return {
                    productId: product.id,
                    quantity,
                    unitPriceCents,
                    lineTotalCents: unitPriceCents * quantity,
                    sellerId: product.seller_id
                };
            });

            const totalCents = checkoutItems.reduce((sum, item) => sum + item.lineTotalCents, 0);
            const sellerId = checkoutItems[0].sellerId;
            const orderNumber = `NW-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
            const [gatewayRows] = await connection.execute(
                'SELECT id FROM payment_gateways WHERE provider_key = ? AND is_active = TRUE LIMIT 1',
                ['lnbits_lightning']
            );
            if (gatewayRows.length === 0) throw new Error('Lightning payment gateway is not initialized');

            const [orderResult] = await connection.execute(
                `INSERT INTO orders (order_number, customer_id, seller_id, status, total_amount)
                 VALUES (?, ?, ?, 'PENDING', ?)`,
                [orderNumber, buyerId, sellerId, (totalCents / 100).toFixed(2)]
            );
            const orderId = orderResult.insertId;

            for (const item of checkoutItems) {
                await connection.execute(
                    'UPDATE products SET stock_level = stock_level - ? WHERE id = ? AND stock_level >= ?',
                    [item.quantity, item.productId, item.quantity]
                );
                await connection.execute(
                    `INSERT INTO order_items (order_id, product_id, quantity, unit_price, line_total)
                     VALUES (?, ?, ?, ?, ?)`,
                    [
                        orderId,
                        item.productId,
                        item.quantity,
                        (item.unitPriceCents / 100).toFixed(2),
                        (item.lineTotalCents / 100).toFixed(2)
                    ]
                );
            }

            await connection.execute(
                `INSERT INTO payments
                    (order_id, customer_id, seller_id, amount, payment_gateway_id, status, payment_method_details)
                 VALUES (?, ?, ?, ?, ?, 'PENDING', ?)`,
                [
                    orderId,
                    buyerId,
                    sellerId,
                    (totalCents / 100).toFixed(2),
                    gatewayRows[0].id,
                    JSON.stringify({ provider: 'lnbits', network })
                ]
            );

            await connection.commit();
            return { orderId, orderNumber, totalCents };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async saveLightningInvoice(orderId, buyerId, invoice) {
        const [result] = await pool.execute(
            `UPDATE payments p
             JOIN orders o ON o.id = p.order_id
             SET p.transaction_id = ?, p.payment_request = ?, p.checking_id = ?, p.invoice_expires_at = ?
             WHERE p.order_id = ? AND o.customer_id = ? AND p.status = 'PENDING' AND o.status = 'PENDING'`,
            [invoice.paymentHash, invoice.paymentRequest, invoice.checkingId, invoice.expiresAt, orderId, buyerId]
        );
        return result.affectedRows > 0;
    }

    static async getPendingPayment(orderId, buyerId) {
        const [rows] = await pool.execute(
            `SELECT p.transaction_id, p.payment_request, p.checking_id, p.invoice_expires_at,
                    p.status AS payment_status, o.status AS order_status
             FROM payments p
             JOIN orders o ON o.id = p.order_id
             WHERE p.order_id = ? AND o.customer_id = ?`,
            [orderId, buyerId]
        );
        return rows[0] || null;
    }

    static async markOrderPaid(orderId, buyerId) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            const [paymentRows] = await connection.execute(
                `SELECT p.status
                 FROM payments p
                 JOIN orders o ON o.id = p.order_id
                 WHERE p.order_id = ? AND o.customer_id = ?
                 FOR UPDATE`,
                [orderId, buyerId]
            );
            if (paymentRows.length === 0) {
                await connection.rollback();
                return false;
            }
            if (paymentRows[0].status !== 'PENDING') {
                await connection.commit();
                return true;
            }

            await connection.execute(
                "UPDATE payments SET status = 'HELD' WHERE order_id = ? AND status = 'PENDING'",
                [orderId]
            );
            await connection.execute(
                "UPDATE orders SET status = 'PAID' WHERE id = ? AND status = 'PENDING'",
                [orderId]
            );
            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async cancelPendingOrder(orderId, buyerId = null) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
                        const buyerFilter = buyerId === null ? '' : 'AND o.customer_id = ?';
                        const params = buyerId === null ? [orderId] : [orderId, buyerId];
            const [orders] = await connection.execute(
                `SELECT o.id, o.customer_id
                 FROM orders o
                 JOIN payments p ON p.order_id = o.id
                 WHERE o.id = ? AND p.status = 'PENDING' AND o.status = 'PENDING'
                                     ${buyerFilter}
                 FOR UPDATE`,
                                params
            );
            if (orders.length === 0) {
                await connection.commit();
                return false;
            }

            const [items] = await connection.execute(
                'SELECT product_id, quantity FROM order_items WHERE order_id = ? AND product_id IS NOT NULL',
                [orderId]
            );
            for (const item of items) {
                await connection.execute(
                    'UPDATE products SET stock_level = stock_level + ? WHERE id = ?',
                    [item.quantity, item.product_id]
                );
            }
            await connection.execute("UPDATE orders SET status = 'CANCELLED' WHERE id = ?", [orderId]);
            await connection.execute("UPDATE payments SET status = 'FAILED' WHERE order_id = ?", [orderId]);
            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async getExpiredPendingCheckouts() {
        const [rows] = await pool.execute(
            `SELECT o.id AS order_id, o.customer_id, p.transaction_id, p.invoice_expires_at
             FROM orders o
             JOIN payments p ON p.order_id = o.id
             WHERE o.status = 'PENDING' AND p.status = 'PENDING'
               AND (p.invoice_expires_at <= NOW()
                    OR (p.payment_request IS NULL AND o.created_at < NOW() - INTERVAL 3 MINUTE))
             ORDER BY o.created_at ASC
             LIMIT 100`
        );
        return rows;
    }

    static async getOrderById(orderId) {
        const [rows] = await pool.execute(
            `SELECT o.*, oi.id AS order_item_id, oi.product_id, oi.quantity, oi.unit_price, oi.line_total
             FROM orders o
             LEFT JOIN order_items oi ON oi.order_id = o.id
             WHERE o.id = ?`,
            [orderId]
        );
        return rows.length > 0 ? rows : [];
    }

    static async getOrdersByBuyer(buyerId) {
        const [rows] = await pool.execute(
            'SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC',
            [buyerId]
        );
        return rows;
    }

    static async getOrdersByShop(shopId, sellerId) {
        const [shopRows] = await pool.execute(
            'SELECT id FROM shops WHERE id = ? AND user_id = ?',
            [shopId, sellerId]
        );

        if (shopRows.length === 0) {
            return [];
        }

        const [rows] = await pool.execute(
            'SELECT * FROM orders WHERE seller_id = ? ORDER BY created_at DESC',
            [sellerId]
        );
        return rows;
    }

    static async updateOrderStatus(orderId, shopId, status, sellerId = null) {
        if (!sellerId) {
            return false;
        }

        const [shopRows] = await pool.execute(
            'SELECT id FROM shops WHERE id = ? AND user_id = ?',
            [shopId, sellerId]
        );

        if (shopRows.length === 0) {
            return false;
        }

        const [result] = await pool.execute(
            'UPDATE orders SET status = ? WHERE id = ? AND seller_id = ?',
            [status, orderId, sellerId]
        );
        return result.affectedRows > 0;
    }
}

module.exports = OrderModel;
