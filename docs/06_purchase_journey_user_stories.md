# Epic: Complete a Product Purchase Journey

**Original Concept:** "As a User, I check the product catalog in look for a product (Shorts), then I check the Product description, price, and rating, then proceed to add it to the cart, and give my delivery method (mail or Drop by drone). then input my Payment information, pay and submit order."

## Broken-Down User Stories

### Story 1: Product Evaluation
**User Story:** As a shopper, I want to view a product's description, price, and rating from the catalog so that I can make an informed purchasing decision.

**Acceptance Criteria:**
- **Given** I am browsing the product catalog, **when** I select a product (e.g., Shorts), **then** I am navigated to the product details page.
- The product details page must display the product description, current price, and average user rating.

**Priority:** High

---

### Story 2: Cart Management
**User Story:** As a shopper, I want to add a selected product to my shopping cart so that I can hold it for checkout.

**Acceptance Criteria:**
- **Given** I am on a product details page, **when** I click the "Add to Cart" button, **then** the item is added to my cart.
- A visual confirmation is shown indicating the item was successfully added, and the cart icon updates to reflect the new item count.

**Priority:** High

---

### Story 3: Delivery Method Selection
**User Story:** As a shopper, I want to choose between standard mail or drone drop delivery during checkout so that I can receive my package via my preferred method.

**Acceptance Criteria:**
- **Given** I am in the checkout flow, **when** I reach the delivery section, **then** I am presented with options for "Standard Mail" and "Drop by Drone".
- **When** I select "Drop by Drone", the system verifies if my address is eligible for drone delivery.
- The system saves my selected delivery choice for the final order calculation.

**Priority:** High

---

### Story 4: Payment and Order Submission
**User Story:** As a shopper, I want to securely input my payment information and submit my order so that my purchase is finalized.

**Acceptance Criteria:**
- **Given** I have selected my delivery method, **when** I proceed to the payment section, **then** I am prompted to enter my payment details.
- **When** I click "Submit Order" with valid payment information, **then** the payment is processed, and I am redirected to an Order Confirmation screen.
- The Order Confirmation screen displays a summary of the purchase and a unique order number.

**Priority:** High
