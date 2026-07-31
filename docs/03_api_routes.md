# API Routes & Web Endpoints

*This document lists the URLs and routing structure for the Nautware marketplace platform.*

## Core Routes
- `GET /` : Marketplace landing and command overview
- `GET /login` : Authentication gateway
- `POST /auth/login` : Login handler

## Marketplace Modules

### Buyer Experience
- `GET /marketplace` : Browse available listings
- `GET /listings` : List all active products
- `GET /listings/:id` : View a specific listing

### Seller Experience
- `GET /shops` : View seller storefronts
- `POST /shops` : Create a new shop
- `GET /shops/:id` : View a seller shop profile
- `POST /listings` : Publish a new product listing

### Orders & Payments
- `GET /orders` : View customer or seller orders
- `POST /orders` : Create a new order
- `GET /orders/:id` : Review a specific order
- `POST /payments/checkout` : Process checkout and payment initiation

### Catalog & Inventory
- `GET /inventory` : Review stock availability for listings
- `PUT /inventory/:id` : Update listing stock or availability
