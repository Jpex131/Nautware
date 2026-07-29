const pool = require('../../core/database/db');

class InventoryModel {
    // --- SHOP MANAGEMENT ---
    
    static async createShop(userId, shopName, shopSlug, shopDescription) {
        const [result] = await pool.execute(
            'INSERT INTO shops (user_id, shop_name, shop_slug, shop_description) VALUES (?, ?, ?, ?)',
            [userId, shopName, shopSlug, shopDescription]
        );
        return result.insertId;
    }

    static async getShopByUserId(userId) {
        const [rows] = await pool.execute(
            'SELECT * FROM shops WHERE user_id = ?',
            [userId]
        );
        return rows.length > 0 ? rows[0] : null;
    }

    // --- SELLER PRODUCT MANAGEMENT ---

    static async createProduct(shopId, data) {
        const { name, slug, description, category, price, stock_level } = data;
        const [result] = await pool.execute(
            'INSERT INTO products (shop_id, name, slug, description, category, price, stock_level) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [shopId, name, slug, description, category, price, stock_level || 0]
        );
        return result.insertId;
    }

    static async updateProduct(productId, shopId, data) {
        const { name, description, category, price } = data;
        const [result] = await pool.execute(
            'UPDATE products SET name = ?, description = ?, category = ?, price = ? WHERE id = ? AND shop_id = ?',
            [name, description, category, price, productId, shopId]
        );
        return result.affectedRows > 0;
    }

    static async deleteProduct(productId, shopId) {
        const [result] = await pool.execute(
            'DELETE FROM products WHERE id = ? AND shop_id = ?',
            [productId, shopId]
        );
        return result.affectedRows > 0;
    }

    static async updateStock(productId, shopId, stockLevel) {
        const [result] = await pool.execute(
            'UPDATE products SET stock_level = ? WHERE id = ? AND shop_id = ?',
            [stockLevel, productId, shopId]
        );
        return result.affectedRows > 0;
    }

    static async getProductsByShop(shopId) {
        const [rows] = await pool.execute(
            'SELECT * FROM products WHERE shop_id = ? ORDER BY created_at DESC',
            [shopId]
        );
        return rows;
    }

    // --- BUYER DISCOVERY ---
    
    static async getProductById(productId) {
        const [rows] = await pool.execute(
            'SELECT p.*, s.shop_name FROM products p JOIN shops s ON p.shop_id = s.id WHERE p.id = ?',
            [productId]
        );
        return rows.length > 0 ? rows[0] : null;
    }

    static async searchProducts(query, category, sort) {
        let sql = 'SELECT p.*, s.shop_name FROM products p JOIN shops s ON p.shop_id = s.id WHERE p.is_active = TRUE';
        const params = [];

        if (query) {
            sql += ' AND (p.name LIKE ? OR p.description LIKE ?)';
            params.push(`%${query}%`, `%${query}%`);
        }

        if (category) {
            sql += ' AND p.category = ?';
            params.push(category);
        }

        // Apply sorting
        if (sort === 'price_asc') {
            sql += ' ORDER BY p.price ASC';
        } else if (sort === 'price_desc') {
            sql += ' ORDER BY p.price DESC';
        } else if (sort === 'rating') {
            sql += ' ORDER BY p.average_rating DESC';
        } else {
            sql += ' ORDER BY p.created_at DESC';
        }

        const [rows] = await pool.execute(sql, params);
        return rows;
    }
}

module.exports = InventoryModel;
