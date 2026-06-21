# Epic: Complete the Product Posting Process

**Original concept:** As a seller, I want to register on the platform, create a product, add a description and price, and post it so that buyers can find it in the catalog.

## Breakdown of user stories

### Story 1: Seller registration
**User story:**
As a seller, I want to register on the platform with my information so that I can access the seller tools.

**Acceptance criteria:**
- **Given** that I am a new user, **when** I go to the registration page and fill in my details (name, email, password), **then** my account is successfully created.
- I am redirected to the seller dashboard after registering.

**Priority:** High

---

### Story 2: Product creation
**User story:**
As a seller, I want to create a new product on the platform so that I can start setting it up.

**Acceptance criteria:**
- **Given** that I am on my seller dashboard, **when** I click "New Product", **then** a creation form opens.
- The form allows me to enter the product name (e.g. Coffee).

**Priority:** High

---

### Story 3: Product description and price
**User story:**
As a seller, I want to add a description and price to my product so that buyers have clear information before purchasing.

**Acceptance criteria:**
- **Given** that I am filling out the product creation form, **when** I enter the description and price, **then** these details are saved and linked to the product.
- The price field must only accept positive numeric values.
- The description field must have a maximum limit of 500 characters.

**Priority:** High

---

### Story 4: Publishing the product
**User story:**
As a seller, I want to publish my product so that it appears in the catalog and buyers can find it.

**Acceptance criteria:**
- **Given** that I have a product with a complete name, description, and price, **when** I click "Publish", **then** the product appears in the public catalog.
- A visual confirmation is shown indicating the product was successfully published.
- If any required field is missing, the system notifies me of the error before publishing.

**Priority:** High
