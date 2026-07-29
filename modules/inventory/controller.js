const InventoryModel = require('./model');

const InventoryController = {
    // Render the main inventory page
    renderInventoryDashboard: async (req, res) => {
        try {
            const userId = req.session.userId;
            const shop = await InventoryModel.getShopByUserId(userId);
            
            let products = [];
            if (shop) {
                products = await InventoryModel.getProductsByShop(shop.id);
            }
            
            res.render('inventory', { 
                username: req.session.username,
                shop,
                products,
                error: null,
                success: null
            });
        } catch (error) {
            console.error('Error rendering inventory:', error);
            res.status(500).send('Internal Server Error');
        }
    },

    // Create a new shop
    createShop: async (req, res) => {
        try {
            const userId = req.session.userId;
            const { shopName, shopDescription } = req.body;
            const shopSlug = shopName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

            await InventoryModel.createShop(userId, shopName, shopSlug, shopDescription);
            res.redirect('/inventory');
        } catch (error) {
            console.error('Error creating shop:', error);
            res.status(500).send('Error creating shop');
        }
    },

    // Create a new product
    createProduct: async (req, res) => {
        try {
            const userId = req.session.userId;
            const shop = await InventoryModel.getShopByUserId(userId);
            
            if (!shop) {
                return res.status(403).send('You must create a shop first.');
            }

            const { name, description, category, price, stock_level } = req.body;
            const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            
            await InventoryModel.createProduct(shop.id, {
                name, slug, description, category, price, stock_level
            });
            
            res.redirect('/inventory');
        } catch (error) {
            console.error('Error creating product:', error);
            res.status(500).send('Error creating product');
        }
    },

    // Update product
    updateProduct: async (req, res) => {
        try {
            const userId = req.session.userId;
            const productId = req.params.id;
            const shop = await InventoryModel.getShopByUserId(userId);

            if (!shop) return res.status(403).send('Unauthorized');

            const success = await InventoryModel.updateProduct(productId, shop.id, req.body);
            if (success) {
                res.redirect('/inventory');
            } else {
                res.status(404).send('Product not found or unauthorized');
            }
        } catch (error) {
            console.error('Error updating product:', error);
            res.status(500).send('Error updating product');
        }
    },

    // Delete product
    deleteProduct: async (req, res) => {
        try {
            const userId = req.session.userId;
            const productId = req.params.id;
            const shop = await InventoryModel.getShopByUserId(userId);

            if (!shop) return res.status(403).send('Unauthorized');

            const success = await InventoryModel.deleteProduct(productId, shop.id);
            if (success) {
                res.redirect('/inventory');
            } else {
                res.status(404).send('Product not found or unauthorized');
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            res.status(500).send('Error deleting product');
        }
    },

    // Search and Discovery (Buyer view)
    discoverProducts: async (req, res) => {
        try {
            const { q, category, sort } = req.query;
            const products = await InventoryModel.searchProducts(q, category, sort);
            
            // This would normally render a buyer catalog view. For now we return JSON
            res.json({ products });
        } catch (error) {
            console.error('Error searching products:', error);
            res.status(500).send('Error searching products');
        }
    }
};

module.exports = InventoryController;
