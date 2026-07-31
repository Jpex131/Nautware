# Route Map

*This document lists the currently registered routes in the Nautware application, including auth requirements and purpose.*

## Core Routes
- `GET /` : Marketplace landing page and entry point. Auth required: No
- `GET /login` : Render the login page. Auth required: No
- `GET /register` : Render the registration page. Auth required: No
- `POST /auth/login` : Authenticate a user and create a session. Auth required: No
- `POST /auth/register` : Register a new user account. Auth required: No
- `GET /auth/logout` : End the current session and redirect home. Auth required: No
- `GET /dashboard` : Render the dashboard for an authenticated user. Auth required: Yes
- `GET /finance` : Render the finance dashboard for an authenticated user. Auth required: Yes
- `GET /services` : Render the services page for an authenticated user. Auth required: Yes
- `GET /health` : Health check endpoint for the server. Auth required: No

## Inventory Module
- `GET /inventory/` : Render the inventory dashboard for the current user. Auth required: Yes
- `POST /inventory/shop/create` : Create a new shop for the authenticated user. Auth required: Yes
- `POST /inventory/product/create` : Create a new product under the user’s shop. Auth required: Yes
- `POST /inventory/product/:id/update` : Update a product belonging to the user’s shop. Auth required: Yes
- `POST /inventory/product/:id/delete` : Delete a product belonging to the user’s shop. Auth required: Yes
- `GET /inventory/api/discover` : Discover and search marketplace products. Auth required: Yes

## Orders Module
- `POST /orders/create` : Create a new order for a buyer checkout flow. Auth required: Yes
- `GET /orders/my-orders` : Return the authenticated buyer’s order history. Auth required: Yes
- `GET /orders/shop-orders` : Return orders for a shop managed by the authenticated seller. Auth required: Yes
- `POST /orders/:id/status` : Update the status of an order for the authenticated seller. Auth required: Yes
