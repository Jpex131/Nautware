<div align="center">
  <img src="assets/images/naut_logo.png" alt="Nautware Logo" height="80">
  <br/>
  <h1>Nautware Marketplace Platform</h1>
  <p><strong>A Dark Aerospace marketplace for buyers, sellers, shops, product listings, orders, and payments.</strong></p>
</div>

---

## 🚀 Project Vision

Nautware is a multi-sided marketplace platform where buyers discover products, sellers open shops, publish listings, and coordinate orders and payments through a single immersive command center. The product is designed with a cinematic, high-clarity "Dark Aerospace" experience that feels precise, mission-ready, and operationally alive.

Our goal is to orchestrate commerce across the marketplace—connecting buyers, sellers, inventory, and transactions—while maintaining a sharp, elegant, and highly interactive experience.

## 🛠 Tech Stack

- **Backend:** Node.js, Express.js
- **Frontend:** EJS templates, Vanilla CSS (Dark Aerospace theme)
- **Database:** MySQL (relational database)
- **Architecture:** MVC / Modular Monolith

## 🧩 Core Experience

The platform is built around three connected commerce roles that share the same operational surface:

### 1. Buyer Frontier
Buyers browse listings, compare offers, and place orders with confidence.
- **Functions:** Discover products, inspect catalog details, and complete checkout.
- **Experience:** Fast, immersive, and focused on clarity and trust.

### 2. Seller Hangar
Sellers manage their own shops, publish product listings, and track inventory availability.
- **Functions:** Create storefronts, maintain catalog items, and monitor order activity.
- **Experience:** Operational freedom with a clear view of stock, demand, and fulfillment.

### 3. Commerce Command
Orders, payments, and marketplace activity flow through a shared platform for observability and coordination.
- **Functions:** Track transactions, support payment events, and keep inventory and sales activity aligned.
- **Experience:** A centralized control deck for the marketplace engine.

## 🏗 System Architecture

The platform structures logic using the Model-View-Controller (MVC) pattern. Data persistence is managed through a relational database to support marketplace operations across buyers, sellers, listings, orders, and payments.

```text
nautware/
├── core/                       # The Shared Hub
│   ├── database/               # Relational DB Config
│   ├── routes/                 # Global routing (Auth, Dashboard)
│   └── views/                  # Shared UI templates
├── modules/                    # Marketplace application modules
│   └── inventory/              # Catalog, stock, and marketplace item logic
├── public/                     # Static assets (CSS, logos, imagery)
└── server.js                   # Application entry point
```

## 🗺 Implementation Plan

1. **Phase 1: Foundation & Data Modeling**
   Establish the Node.js environment and design the relational schema for shops, listings, buyers, orders, and payments.
2. **Phase 2: Core Marketplace Routing**
   Build the shared command center, including authentication, dashboard navigation, and marketplace entry points.
3. **Phase 3: Commerce Module Development**
   Deliver buyer discovery, seller shop management, inventory alignment, and order/payment workflows.

## 💻 Getting Started

1. Install dependencies with `npm install`.
2. Create your environment file with `cp .env.example .env`.
3. Configure your MySQL credentials in the `.env` file.
4. Create the database with `node core/database/create_db_first.js`.
5. Initialize the schema with `node core/database/init_db.js`.
6. Start the development server with `npm run dev`.

---
*Designed & engineered for a resilient marketplace experience with maximum clarity, uptime, and operational focus.*
