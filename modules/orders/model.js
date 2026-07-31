const pool = require('../../core/database/db');

class OrderModel {
    static async createOrder(buyerId, shopId, items, totalAmount) {
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            const [orderResult] = await connection.execute(
                'INSERT INTO orders (order_number, customer_id, seller_id, total_amount, status) VALUES (?, ?, ?, ?, ?)',
                [
                    `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    buyerId,
                    shopId,
                    totalAmount,
                    'PENDING'
                ]
            );

            const orderId = orderResult.insertId;

            for (const item of items) {
                await connection.execute(
                    'INSERT INTO order_items (order_id, product_id, quantity, unit_price, line_total) VALUES (?, ?, ?, ?, ?)',
                    [orderId, item.productId, item.quantity, item.unitPrice, item.lineTotal]
                );
            }

            await connection.commit();
            return orderId;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
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
