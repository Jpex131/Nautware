const InventoryModel = require('./model');

const InventoryController = {
    // Render the main inventory page
    renderInventoryDashboard: async (req, res) => {
        try {
            const userId = req.session.userId;
            const shop = await InventoryModel.getShopByUserId(userId);
            
            let products = [];
            let marketplaceProducts = [];
            let marketplaceShops = [];

            if (shop) {
                products = await InventoryModel.getProductsByShop(shop.id);
                marketplaceProducts = await InventoryModel.getAllActiveProducts(shop.id);
                marketplaceShops = await InventoryModel.getAllActiveShops(userId);
            } else {
                marketplaceProducts = await InventoryModel.getAllActiveProducts();
                marketplaceShops = await InventoryModel.getAllActiveShops(userId);
            }
            
            res.render('inventory', { 
                username: req.session.username,
                shop,
                products,
                marketplaceProducts,
                marketplaceShops,
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

    renderShopProfile: async (req, res) => {
        try {
            const { slug } = req.params;
            const shop = await InventoryModel.getShopBySlug(slug);
            if (!shop) {
                return res.status(404).send('Shop not found');
            }

            const products = await InventoryModel.getProductsByShopId(shop.id);
            const posts = await InventoryModel.getPostsByShopId(shop.id);
            const isOwner = req.session.userId === shop.user_id;

            res.render('shop-profile', { shop, products, posts, isOwner });
        } catch (error) {
            console.error('Error rendering shop profile:', error);
            res.status(500).send('Internal Server Error');
        }
    },

    createShopPost: async (req, res) => {
        try {
            const userId = req.session.userId;
            const { shopId } = req.params;
            const shop = await InventoryModel.getShopByUserId(userId);

            if (!shop || String(shop.id) !== String(shopId)) {
                return res.status(403).send('Unauthorized');
            }

            const { content, image_url } = req.body;
            await InventoryModel.createPost(shop.id, content, image_url);
            res.redirect(`/inventory/shop/${shop.shop_slug}`);
        } catch (error) {
            console.error('Error creating shop post:', error);
            res.status(500).send('Error creating shop post');
        }
    },

    deleteShopPost: async (req, res) => {
        try {
            const userId = req.session.userId;
            const { shopId, postId } = req.params;
            const shop = await InventoryModel.getShopByUserId(userId);

            if (!shop || String(shop.id) !== String(shopId)) {
                return res.status(403).send('Unauthorized');
            }

            await InventoryModel.deletePost(postId, shop.id);
            res.redirect(`/inventory/shop/${shop.shop_slug}`);
        } catch (error) {
            console.error('Error deleting shop post:', error);
            res.status(500).send('Error deleting shop post');
        }
    },

    updateShopProfile: async (req, res) => {
        try {
            const userId = req.session.userId;
            const { shopId } = req.params;
            const shop = await InventoryModel.getShopByUserId(userId);

            if (!shop || String(shop.id) !== String(shopId)) {
                return res.status(403).send('Unauthorized');
            }

            const { shopDescription, shopImageUrl, shopBannerUrl } = req.body;
            await InventoryModel.updateShopProfile(shop.id, {
                shopDescription,
                shopImageUrl,
                shopBannerUrl
            });

            res.redirect(`/inventory/shop/${shop.shop_slug}`);
        } catch (error) {
            console.error('Error updating shop profile:', error);
            res.status(500).send('Error updating shop profile');
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

            const { name, description, category, price, stock_level, image_url } = req.body;
            const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            
            await InventoryModel.createProduct(shop.id, {
                name, slug, description, category, price, stock_level, image_url
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
