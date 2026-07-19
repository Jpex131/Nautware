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

        connection.release();
        console.log('Database initialization complete!');
        process.exit(0);
    } catch (error) {
        console.error('Error initializing database:', error);
        process.exit(1);
    }
}

initDB();
