const pool = require('./db');

async function initDB() {
    try {
        console.log('Connecting to database and initializing schema...');
        
        const connection = await pool.getConnection();

        // Create Users table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                first_name VARCHAR(100),
                last_name VARCHAR(100),
                profile_image_url VARCHAR(500),
                bio TEXT,
                is_admin BOOLEAN DEFAULT FALSE,
                is_active BOOLEAN DEFAULT TRUE,
                kyc_verified BOOLEAN DEFAULT FALSE,
                kyc_verification_date TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ users table initialized');

        // Create Shops table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS shops (
                id SERIAL PRIMARY KEY,
                user_id BIGINT UNSIGNED UNIQUE NOT NULL,
                shop_name VARCHAR(255) NOT NULL,
                shop_slug VARCHAR(255) UNIQUE NOT NULL,
                shop_description TEXT,
                shop_image_url VARCHAR(500),
                shop_banner_url VARCHAR(500),
                rating_average DECIMAL(3,2) DEFAULT 0.00,
                total_sales INT DEFAULT 0,
                verification_status ENUM('PENDING', 'VERIFIED', 'REJECTED') DEFAULT 'PENDING',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('✅ shops table initialized');

        // Create Shop Posts table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS shop_posts (
                id SERIAL PRIMARY KEY,
                shop_id BIGINT UNSIGNED NOT NULL,
                content TEXT NOT NULL,
                image_url VARCHAR(500) NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
                INDEX idx_shop_id (shop_id)
            )
        `);
        console.log('✅ shop_posts table initialized');

        // Create Products table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS products (
                id SERIAL PRIMARY KEY,
                shop_id BIGINT UNSIGNED NOT NULL,
                name VARCHAR(255) NOT NULL,
                slug VARCHAR(255),
                description TEXT NOT NULL,
                detailed_specs JSON,
                category VARCHAR(100),
                price DECIMAL(10, 2) NOT NULL,
                currency ENUM('USD', 'EUR', 'BTC', 'ETH') DEFAULT 'USD',
                stock_level INT DEFAULT 0,
                sku VARCHAR(100),
                images JSON,
                average_rating DECIMAL(3, 2) DEFAULT 0.00,
                review_count INT DEFAULT 0,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
                INDEX idx_shop_id (shop_id),
                INDEX idx_category (category)
            )
        `);
        console.log('✅ products table initialized');

        // Create Orders table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS orders (
                id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
                order_number VARCHAR(50) UNIQUE NOT NULL,
                customer_id BIGINT UNSIGNED NOT NULL,
                seller_id BIGINT UNSIGNED NOT NULL,
                status ENUM('PENDING', 'PAYMENT_HELD', 'PAID', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED') DEFAULT 'PENDING',
                total_amount DECIMAL(12, 2) NOT NULL,
                delivery_method ENUM('STANDARD_MAIL', 'DRONE_DROP', 'LOCAL_PICKUP') DEFAULT 'STANDARD_MAIL',
                special_instructions TEXT,
                shipping_address_id BIGINT UNSIGNED NULL,
                billing_address_id BIGINT UNSIGNED NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                completed_at TIMESTAMP NULL,
                FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE RESTRICT,
                FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE RESTRICT,
                INDEX idx_customer_id (customer_id),
                INDEX idx_seller_id (seller_id),
                INDEX idx_status (status),
                UNIQUE KEY unique_order_number (order_number)
            )
        `);
        console.log('✅ orders table initialized');

        // Create Order Items table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS order_items (
                id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
                order_id BIGINT UNSIGNED NOT NULL,
                product_id BIGINT UNSIGNED NULL,
                service_id BIGINT UNSIGNED NULL,
                quantity INT DEFAULT 1,
                unit_price DECIMAL(10, 2) NOT NULL,
                line_total DECIMAL(12, 2) NOT NULL,
                service_date DATETIME NULL,
                service_time_slot VARCHAR(50) NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
                INDEX idx_order_id (order_id)
            )
        `);
        console.log('✅ order_items table initialized');

        // Create Payments table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS payments (
                id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
                order_id BIGINT UNSIGNED UNIQUE NOT NULL,
                customer_id BIGINT UNSIGNED NOT NULL,
                seller_id BIGINT UNSIGNED NOT NULL,
                amount DECIMAL(12, 2) NOT NULL,
                payment_gateway_id BIGINT UNSIGNED NOT NULL,
                status ENUM('PENDING', 'HELD', 'RELEASED', 'REFUNDED', 'DISPUTED', 'FAILED') DEFAULT 'PENDING',
                transaction_id VARCHAR(255),
                payment_method_details JSON,
                holds_until TIMESTAMP NULL,
                dispute_deadline TIMESTAMP NULL,
                released_at TIMESTAMP NULL,
                refunded_at TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT,
                FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE RESTRICT,
                FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE RESTRICT,
                INDEX idx_status (status),
                INDEX idx_customer_id (customer_id),
                INDEX idx_seller_id (seller_id)
            )
        `);
        console.log('✅ payments table initialized');

        connection.release();
        console.log('Database initialization complete!');
        process.exit(0);
    } catch (error) {
        console.error('Error initializing database:', error);
        process.exit(1);
    }
}

initDB();
