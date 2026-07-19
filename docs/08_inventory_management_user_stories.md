# Epic: Comprehensive Inventory Management & Discovery

This document covers the remaining user stories required to complete the Inventory Management requirements, including seller inventory control, buyer product discovery, and administrative oversight.

## 1. Seller: Inventory Management

### Story 1: Edit Product Details
**User Story:** As a seller, I want to edit my existing product listings so that I can update prices, descriptions, and other details as they change.

**Acceptance Criteria:**
- **Given** I am on the seller dashboard, **when** I select a product and click "Edit", **then** the product form opens with existing details pre-filled.
- Changes to price, description, and images are saved upon clicking "Update".
- **Priority:** High

### Story 2: Delete Products
**User Story:** As a seller, I want to delete products from my catalog so that discontinued or unavailable items are no longer visible to buyers.

**Acceptance Criteria:**
- **Given** I am viewing my product list, **when** I click "Delete" on a product, **then** the system prompts for confirmation.
- Upon confirmation, the product is removed from the public catalog and my dashboard.
- **Priority:** Medium

### Story 3: Manage Images
**User Story:** As a seller, I want to upload multiple images and choose a primary image so that my product is visually appealing to buyers.

**Acceptance Criteria:**
- **Given** I am creating or editing a product, **when** I upload images, **then** I can see a preview of them.
- I can designate one image as the "Primary Image", which will be shown in search results.
- **Priority:** High

### Story 4: Manage Stock Levels
**User Story:** As a seller, I want to update the available quantity of my products so that buyers know if an item is in stock or sold out.

**Acceptance Criteria:**
- **Given** I am on the seller dashboard, **when** I adjust the "Stock Quantity" for a product, **then** the new quantity is reflected in the database.
- If the stock reaches 0, the product automatically displays as "Out of Stock" to buyers.
- **Priority:** High

---

## 2. Buyer: Product Discovery

### Story 5: Search for Products
**User Story:** As a buyer, I want to search for products using keywords so that I can quickly find specific items I want to purchase.

**Acceptance Criteria:**
- **Given** I am on the platform, **when** I enter keywords into the search bar, **then** a list of matching products is displayed.
- The search checks both product names and descriptions.
- **Priority:** High

### Story 6: Filter and Sort Products
**User Story:** As a buyer, I want to filter products by category and sort them by price or rating so that I can narrow down my choices.

**Acceptance Criteria:**
- **Given** I am viewing the catalog or search results, **when** I select a category filter or sort option (e.g., "Price: Low to High"), **then** the results update dynamically to match my criteria.
- **Priority:** Medium

### Story 7: View Order History
**User Story:** As a buyer, I want to view my past orders and their status so that I can track deliveries or reorder items.

**Acceptance Criteria:**
- **Given** I am logged in, **when** I visit "My Orders", **then** I see a list of my previous purchases.
- Each entry shows the order date, total amount, and current fulfillment status.
- **Priority:** Medium

---

## 3. Admin: Moderation & Features

### Story 8: Moderate Listings and Remove Content
**User Story:** As an Admin, I want to review product listings and remove inappropriate content so that the marketplace remains safe and complies with our guidelines.

**Acceptance Criteria:**
- **Given** I am on the admin panel, **when** I view flagged or recent products, **then** I can choose to "Suspend" or "Delete" the listing.
- The seller is automatically notified if their product is removed.
- **Priority:** High

### Story 9: Manage Categories
**User Story:** As an Admin, I want to create, edit, or remove product categories so that the catalog remains organized as the marketplace grows.

**Acceptance Criteria:**
- **Given** I am on the admin panel, **when** I navigate to category management, **then** I can add new categories or rename existing ones.
- These changes are immediately reflected in the seller product creation form and the buyer's filter sidebar.
- **Priority:** Medium
