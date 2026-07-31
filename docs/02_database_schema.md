# Database Schema - Nautware Multi-Sided Marketplace

*Complete relational database design for the Nautware marketplace platform, including escrow payments and financial tracking.*

---

## Table of Contents
1. [Core User & Shop Management](#core-user--shop-management)
2. [Products & Services](#products--services)
3. [Orders & Transactions](#orders--transactions)
4. [Payment & Commission System](#payment--commission-system)
5. [Shipment & Delivery](#shipment--delivery)
6. [Reviews & Ratings](#reviews--ratings)
7. [Service Scheduling](#service-scheduling)
8. [Financial Records & Audit Trail](#financial-records--audit-trail)
9. [Disputes & Admin](#disputes--admin)
10. [Inventory Management](#inventory-management)
11. [B2B Supplier Orders](#b2b-supplier-orders)

---

## 1. CORE USER & SHOP MANAGEMENT

### `users`
Represents all platform participants (buyers, sellers, admins).

```sql
CREATE TABLE users (
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
);
```

### `shops`
Each user has a shop (marketplace storefront).

```sql
CREATE TABLE shops (
  id SERIAL PRIMARY KEY,
  user_id INT UNIQUE NOT NULL,
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
);
```

### `addresses`
Shipping and billing addresses for users.

```sql
CREATE TABLE addresses (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  address_type ENUM('SHIPPING', 'BILLING', 'SHOP_LOCATION') DEFAULT 'SHIPPING',
  street_line_1 VARCHAR(255) NOT NULL,
  street_line_2 VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  state_province VARCHAR(100),
  postal_code VARCHAR(20) NOT NULL,
  country VARCHAR(100) NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_drone_eligible BOOLEAN DEFAULT FALSE,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id)
);
```

---

## 2. PRODUCTS & SERVICES

### `products`
Physical items or digital goods sold by shop owners.

```sql
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  shop_id INT NOT NULL,
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
);
```

**detailed_specs** JSON Example:
```json
{
  "material": "Premium Clay",
  "dimensions": {"width": 10, "height": 15, "depth": 8, "unit": "cm"},
  "weight": 2.5,
  "weight_unit": "kg",
  "color": "Red",
  "finish": "Matte",
  "care_instructions": "Handle with care, dust with soft cloth",
  "origin": "Italy",
  "customization": "Available for orders over $100"
}
```

### `services`
Time-based or task-based services offered by sellers.

```sql
CREATE TABLE services (
  id SERIAL PRIMARY KEY,
  shop_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255),
  description TEXT NOT NULL,
  detailed_specs JSON,
  category VARCHAR(100),
  pricing_type ENUM('HOURLY', 'FIXED', 'CUSTOM') DEFAULT 'HOURLY',
  hourly_rate DECIMAL(10, 2),
  fixed_price DECIMAL(10, 2),
  duration_minutes INT,
  average_rating DECIMAL(3, 2) DEFAULT 0.00,
  review_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
  INDEX idx_shop_id (shop_id),
  INDEX idx_category (category)
);
```

---

## 3. ORDERS & TRANSACTIONS

### `orders`
Customer purchases from sellers (B2C marketplace transactions).

```sql
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id INT NOT NULL,
  seller_id INT NOT NULL,
  status ENUM('PENDING', 'PAYMENT_HELD', 'PAID', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED') DEFAULT 'PENDING',
  total_amount DECIMAL(12, 2) NOT NULL,
  delivery_method ENUM('STANDARD_MAIL', 'DRONE_DROP', 'LOCAL_PICKUP') DEFAULT 'STANDARD_MAIL',
  special_instructions TEXT,
  shipping_address_id INT,
  billing_address_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (shipping_address_id) REFERENCES addresses(id) ON DELETE SET NULL,
  FOREIGN KEY (billing_address_id) REFERENCES addresses(id) ON DELETE SET NULL,
  INDEX idx_customer_id (customer_id),
  INDEX idx_seller_id (seller_id),
  INDEX idx_status (status),
  UNIQUE KEY unique_order_number (order_number)
);
```

### `order_line_items`
Individual items within an order.

```sql
CREATE TABLE order_line_items (
  id SERIAL PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT,
  service_id INT,
  quantity INT DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  line_total DECIMAL(12, 2) NOT NULL,
  service_date DATETIME NULL,
  service_time_slot VARCHAR(50) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL,
  INDEX idx_order_id (order_id)
);
```

---

## 4. PAYMENT & COMMISSION SYSTEM

### `payment_gateways`
Configuration for different payment methods Nautware supports.

```sql
CREATE TABLE payment_gateways (
  id SERIAL PRIMARY KEY,
  gateway_type ENUM('CREDIT_CARD', 'CRYPTOCURRENCY', 'INTERNAL_WALLET', 'BANK_TRANSFER') NOT NULL,
  gateway_name VARCHAR(100) NOT NULL,
  is_enabled BOOLEAN DEFAULT TRUE,
  config_data JSON,
  commission_percentage DECIMAL(5, 2),
  min_amount DECIMAL(10, 2),
  max_amount DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### `payments`
Core payment records for orders (escrow system).

```sql
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  order_id INT UNIQUE NOT NULL,
  customer_id INT NOT NULL,
  seller_id INT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  payment_gateway_id INT NOT NULL,
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
  FOREIGN KEY (payment_gateway_id) REFERENCES payment_gateways(id),
  INDEX idx_status (status),
  INDEX idx_customer_id (customer_id),
  INDEX idx_seller_id (seller_id)
);
```

### `commissions`
Track Nautware's commission on each transaction.

```sql
CREATE TABLE commissions (
  id SERIAL PRIMARY KEY,
  payment_id INT UNIQUE NOT NULL,
  order_id INT NOT NULL,
  commission_percentage DECIMAL(5, 2) NOT NULL,
  commission_amount DECIMAL(12, 2) NOT NULL,
  status ENUM('PENDING', 'COLLECTED', 'REVERSED') DEFAULT 'PENDING',
  collected_at TIMESTAMP NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  INDEX idx_status (status)
);
```

### `seller_wallets`
Optional: Track seller balances if using internal wallet system.

```sql
CREATE TABLE seller_wallets (
  id SERIAL PRIMARY KEY,
  user_id INT UNIQUE NOT NULL,
  balance DECIMAL(15, 2) DEFAULT 0.00,
  total_earned DECIMAL(15, 2) DEFAULT 0.00,
  total_withdrawn DECIMAL(15, 2) DEFAULT 0.00,
  last_withdrawal_date TIMESTAMP NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_wallet (user_id)
);
```

---

## 5. SHIPMENT & DELIVERY

### `shipments`
Track shipment info after seller ships order.

```sql
CREATE TABLE shipments (
  id SERIAL PRIMARY KEY,
  order_id INT UNIQUE NOT NULL,
  tracking_number VARCHAR(100),
  carrier ENUM('USPS', 'UPS', 'FEDEX', 'DHL', 'CUSTOM_DRONE', 'LOCAL_DELIVERY') DEFAULT 'USPS',
  carrier_url VARCHAR(500),
  shipped_date DATETIME NOT NULL,
  estimated_delivery_date DATETIME,
  actual_delivery_date DATETIME NULL,
  status ENUM('PENDING', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED', 'RETURNED') DEFAULT 'PENDING',
  requires_signature BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  INDEX idx_status (status),
  INDEX idx_carrier (carrier)
);
```

### `shipment_updates`
Timeline of tracking events for each shipment.

```sql
CREATE TABLE shipment_updates (
  id SERIAL PRIMARY KEY,
  shipment_id INT NOT NULL,
  status ENUM('PENDING', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED', 'RETURNED') NOT NULL,
  location VARCHAR(255),
  description TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE,
  INDEX idx_shipment_id (shipment_id)
);
```

---

## 6. REVIEWS & RATINGS

### `reviews`
Customer reviews tied to completed orders.

```sql
CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT,
  service_id INT,
  reviewer_id INT NOT NULL,
  seller_id INT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  comment TEXT,
  verified_purchase BOOLEAN DEFAULT TRUE,
  helpful_count INT DEFAULT 0,
  unhelpful_count INT DEFAULT 0,
  is_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL,
  FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_product_id (product_id),
  INDEX idx_service_id (service_id),
  INDEX idx_seller_id (seller_id),
  INDEX idx_created_at (created_at)
);
```

---

## 7. SERVICE SCHEDULING

### `service_availability_schedules`
Define when services are available (recurring weekly schedule).

```sql
CREATE TABLE service_availability_schedules (
  id SERIAL PRIMARY KEY,
  service_id INT NOT NULL,
  day_of_week INT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  notes VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
  INDEX idx_service_id (service_id),
  UNIQUE KEY unique_service_day (service_id, day_of_week)
);
```

**day_of_week Reference**: 0=Sunday, 1=Monday, 2=Tuesday, ..., 6=Saturday

**Example Data**:
```sql
-- Cleaning Service: Mon-Fri, 6am-9am
INSERT INTO service_availability_schedules (service_id, day_of_week, start_time, end_time) VALUES
(1, 1, '06:00:00', '09:00:00'),
(1, 2, '06:00:00', '09:00:00'),
(1, 3, '06:00:00', '09:00:00'),
(1, 4, '06:00:00', '09:00:00'),
(1, 5, '06:00:00', '09:00:00');

-- Party Hosting: Sat-Sun, 8am-12pm
INSERT INTO service_availability_schedules (service_id, day_of_week, start_time, end_time) VALUES
(2, 5, '08:00:00', '12:00:00'),
(2, 6, '08:00:00', '12:00:00');
```

### `service_bookings`
Actual booked time slots for services.

```sql
CREATE TABLE service_bookings (
  id SERIAL PRIMARY KEY,
  service_id INT NOT NULL,
  order_id INT NOT NULL,
  customer_id INT NOT NULL,
  seller_id INT NOT NULL,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status ENUM('REQUESTED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') DEFAULT 'REQUESTED',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_seller_id (seller_id),
  INDEX idx_booking_date (booking_date)
);
```

---

## 8. FINANCIAL RECORDS & AUDIT TRAIL

### `financial_records`
Track all financial activities per seller (income/expenses).

```sql
CREATE TABLE financial_records (
  id SERIAL PRIMARY KEY,
  shop_id INT NOT NULL,
  record_type ENUM('SALE', 'PURCHASE', 'COMMISSION', 'REFUND', 'ADJUSTMENT', 'WITHDRAWAL') NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  currency ENUM('USD', 'EUR', 'BTC', 'ETH') DEFAULT 'USD',
  description TEXT,
  reference_type VARCHAR(50),
  reference_id INT,
  order_id INT NULL,
  payment_id INT NULL,
  status ENUM('PENDING', 'COMPLETED', 'REVERSED') DEFAULT 'COMPLETED',
  created_by INT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
  FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_shop_id (shop_id),
  INDEX idx_record_type (record_type),
  INDEX idx_created_at (created_at)
);
```

### `inventory_transactions`
Audit trail for inventory changes.

```sql
CREATE TABLE inventory_transactions (
  id SERIAL PRIMARY KEY,
  product_id INT NOT NULL,
  transaction_type ENUM('PURCHASE', 'SALE', 'RETURN', 'ADJUSTMENT', 'DAMAGE') NOT NULL,
  quantity INT NOT NULL,
  old_stock INT,
  new_stock INT,
  reference_type VARCHAR(50),
  reference_id INT,
  order_id INT NULL,
  notes TEXT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_product_id (product_id),
  INDEX idx_created_at (created_at)
);
```

---

## 9. DISPUTES & ADMIN

### `disputes`
Track disputes raised by customers or sellers.

```sql
CREATE TABLE disputes (
  id SERIAL PRIMARY KEY,
  dispute_number VARCHAR(50) UNIQUE NOT NULL,
  order_id INT NOT NULL,
  payment_id INT NOT NULL,
  initiator_id INT NOT NULL,
  reason ENUM('ITEM_NOT_RECEIVED', 'NOT_AS_DESCRIBED', 'DAMAGED', 'WRONG_ITEM', 'QUALITY_ISSUE', 'SERVICE_NOT_PROVIDED', 'OTHER') NOT NULL,
  description TEXT NOT NULL,
  status ENUM('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'CLOSED') DEFAULT 'OPEN',
  priority ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') DEFAULT 'MEDIUM',
  resolution ENUM('REFUND', 'REPLACEMENT', 'PARTIAL_REFUND', 'NO_ACTION') NULL,
  resolved_by INT,
  resolution_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT,
  FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE RESTRICT,
  FOREIGN KEY (initiator_id) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_status (status),
  INDEX idx_initiator_id (initiator_id),
  UNIQUE KEY unique_dispute_number (dispute_number)
);
```

### `dispute_messages`
Communication thread for dispute resolution.

```sql
CREATE TABLE dispute_messages (
  id SERIAL PRIMARY KEY,
  dispute_id INT NOT NULL,
  sender_id INT NOT NULL,
  message_text TEXT NOT NULL,
  attachment_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dispute_id) REFERENCES disputes(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_dispute_id (dispute_id)
);
```

---

## 10. INVENTORY MANAGEMENT

### `supplier_orders`
B2B orders: Seller purchases products from another Seller (Supplier).

```sql
CREATE TABLE supplier_orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  buyer_id INT NOT NULL,
  supplier_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_amount DECIMAL(12, 2) NOT NULL,
  status ENUM('PENDING', 'PAYMENT_HELD', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED') DEFAULT 'PENDING',
  shipment_id INT NULL,
  payment_id INT NULL,
  delivery_address_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (supplier_id) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
  FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE SET NULL,
  FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL,
  FOREIGN KEY (delivery_address_id) REFERENCES addresses(id) ON DELETE SET NULL,
  INDEX idx_buyer_id (buyer_id),
  INDEX idx_supplier_id (supplier_id),
  INDEX idx_status (status)
);
```

---

## 11. B2B SUPPLIER ORDERS (Alternative approach)

If you prefer treating B2B as a different order type instead of separate table:

```sql
-- Add to orders table:
order_type ENUM('B2C', 'B2B') DEFAULT 'B2C',
supplier_id INT NULL,  -- Only populated if B2B

-- B2C: customer_id → seller_id
-- B2B: buyer_id (seller) → seller_id (supplier)
```

---

## 11. CRITICAL IMPLEMENTATION DECISIONS (RECOMMENDED)

### A. Payment gateway strategy for launch

For the initial release, the most practical configuration is a hybrid model:

- Support an internal wallet / platform ledger for bookkeeping.
- Support bank transfer or manual deposit for easier compliance and lower operational friction.
- Add a stablecoin option such as USDC or USDT for fast settlement and international buyers/sellers.
- Avoid making BTC the primary launch method because it introduces volatility, wallet custody complexity, and a worse user experience for most customers.

Recommended launch order:
1. Internal wallet + bank transfer / manual deposit
2. Stablecoin (USDC/USDT)
3. Credit card / Stripe-style processor later if the business needs higher conversion

This design is similar to how marketplace platforms such as Shopify, Stripe Connect, Etsy, and Mercado Libre operate: the platform receives funds, records them in an internal ledger, then releases them to sellers after confirmation and settlement rules are met.

### B. Wallet and settlement handling

The app should not rely on the raw bank account or crypto wallet balance as the only truth. Instead, use a two-layer balance model:

- Pending / escrow balance: money received from a customer but not yet released to the seller.
- Available balance: money that has been confirmed, released, and is now visible in the seller’s app balance.

Recommended approach:
- The platform receives funds into a platform-controlled account or custodial wallet.
- The database stores the movement as financial ledger entries.
- The seller’s visible balance is a book balance derived from the ledger, not a direct reflection of the bank balance.
- Only after payment confirmation and release rules are met does the seller’s balance become available.

In practical terms:
- Customer pays → payment status becomes HELD / PENDING
- Delivery or service completion occurs → payment can be released
- Seller sees “pending” funds until release, then “available” funds after release

### C. Fee model recommendation

For launch, a simple and transparent model is best:

- Use a base platform commission of 5% for standard B2C marketplace orders.
- Keep the fee configurable per payment method in the gateway settings.
- Example rates:
  - Credit card: 3% to 4% + fixed fee
  - Stablecoin: 1% to 2%
  - Bank transfer / internal wallet: 0% to 1%

The simplest implementation rule is:

$$
platform\_fee = fixed\_fee + (gross\_amount \times commission\_rate)
$$

This keeps the system easy to understand while still allowing different costs by payment method.

Recommended schema enhancement:

```sql
ALTER TABLE payment_gateways
ADD COLUMN fixed_fee_amount DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN settlement_delay_days INT DEFAULT 0,
ADD COLUMN payout_currency VARCHAR(10) DEFAULT 'USD';
```

### D. What is B2B?

B2B means Business-to-Business. In this platform, it refers to a seller buying goods or supplies from another seller for wholesale or replenishment purposes.

Example:
- Seller A buys inventory from Seller B to restock their shop.
- Seller A is not the end customer; they are a business buyer.

This is different from B2C, where a customer buys from a seller for personal use.

### E. B2B order model recommendation

Recommendation: keep a separate `supplier_orders` table for launch.

Why this is better than overloading `orders` with a flag:
- B2B has different business rules from customer checkout.
- B2B flows typically involve supplier selection, restocking, wholesale pricing, and inventory replenishment.
- The data model stays clearer and easier to maintain.

Use:
- `orders` for customer-facing marketplace purchases (B2C)
- `supplier_orders` for seller-to-seller wholesale purchases (B2B)

This is the cleaner approach for the current MVP.

### F. KYC / seller verification recommendation

The seller verification model should be tiered:

- Email verification: required to create and activate a seller account.
- Full identity verification (KYC): required before a seller can receive payouts or withdraw funds.
- Optional business verification: recommended for larger volume sellers or B2B suppliers.

Recommended rule:
- Sellers can list products and receive orders after email verification.
- Sellers can only withdraw or receive payouts after KYC approval.

This reduces fraud while keeping the onboarding experience simple.

Recommended schema extension:

```sql
CREATE TABLE seller_verifications (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  verification_type ENUM('EMAIL', 'IDENTITY', 'ADDRESS', 'BANK_ACCOUNT') DEFAULT 'EMAIL',
  status ENUM('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED') DEFAULT 'PENDING',
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP NULL,
  notes TEXT,
  documents_json JSON,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## KEY BUSINESS LOGIC RULES

### Payment Flow Trigger
```
1. Order created → Payment status = PENDING
2. Payment processed → Payment status = HELD
   - Create financial_record: PENDING (type=SALE)
   - Commission deducted and recorded separately
   - Dispute deadline = NULL until shipment delivered

3. Shipment marked DELIVERED → 
   - dispute_deadline = CURRENT_TIMESTAMP + 10 DAYS
   - Payment status = RELEASED (if no dispute)
   - Financial_record status = COMPLETED

4. If Dispute raised before deadline → Payment status = DISPUTED

5. If Admin resolves REFUND → Payment status = REFUNDED
   - Reverse financial_record
   - Reverse commission
   - Update seller wallet
```

### Inventory Trigger
```
1. Order confirmed + Payment HELD →
   - Deduct quantity from product.stock_level
   - Create inventory_transaction: SALE
   
2. If Payment REFUNDED →
   - Return quantity to product.stock_level
   - Create inventory_transaction: RETURN

3. Supplier Order CONFIRMED →
   - Increase product.stock_level
   - Create inventory_transaction: PURCHASE
   - Create financial_record: PURCHASE (expense)
```

### Commission Calculation
```
commission_amount = order_total * (payment_gateway.commission_percentage / 100)
seller_receives = order_total - commission_amount

Recorded in:
- financial_records: type=COMMISSION
- commissions: tracks the amount collected
- seller_wallets: balance updated only after payment RELEASED
```

---

## INDEXES FOR PERFORMANCE

```sql
-- Critical indexes for queries
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_dispute_deadline ON payments(dispute_deadline);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_seller ON orders(seller_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_products_shop ON products(shop_id);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_reviews_seller ON reviews(seller_id);
CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_financial_shop_date ON financial_records(shop_id, created_at);
CREATE INDEX idx_inventory_product_date ON inventory_transactions(product_id, created_at);
```

---

## IMPLEMENTATION NOTES

### Data Integrity
- All foreign keys use ON DELETE RESTRICT to prevent data loss
- Order status flow is enforced at application level (prevent invalid transitions)
- Payment status must match shipment status for data consistency

### Escrow Logic
- Money is held in `payments` table with status tracking
- No seller wallet access until payment status = RELEASED
- 10-day dispute window enforced via `dispute_deadline` timestamp

### Financial Audit Trail
- Every financial activity logged in `financial_records`
- `inventory_transactions` provides complete stock history
- Commissions tracked separately for easy settlement

### Extensibility
- `JSON` fields (detailed_specs, config_data) allow flexibility
- Multiple payment methods supported via `payment_gateways`
- Support for products and services in same order
