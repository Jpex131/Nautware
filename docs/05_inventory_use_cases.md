# Product Management (Inventory) - Use Cases

This document outlines the core use cases and actors for the "Product Manejo" inventory module of the Naut Platform.

## Actors
- **Cliente (Customer)**: End-user browsing products and making purchases.
- **Administrador de Inventario (Admin)**: User responsible for maintaining stock levels and ordering from suppliers.
- **Proveedor (Supplier)**: External entity fulfilling restock orders.

## System Interfaces
- **Payment System**: External system for processing customer payments.

## Use Case Diagram

```mermaid
flowchart LR
    %% Definición de estilos
    classDef actor fill:#f9f9f9,stroke:#333,stroke-width:2px;
    classDef system fill:#e1f5fe,stroke:#0288d1,stroke-width:2px;
    classDef usecase fill:#ffffff,stroke:#4caf50,stroke-width:2px;

    %% Actores
    Cliente((Cliente)):::actor
    Admin((Administrador\nde Inventario)):::actor
    Proveedor((Proveedor)):::actor
    PaymentSys{{Payment System}}:::system

    %% Frontera del Sistema
    subgraph Naut_Platform ["Naut Platform: Product Management (Inventory)"]
        direction TB
        
        %% Casos de Uso del Cliente
        UC_Catalogo([Explorar Catálogo\nVer / Buscar / Detalles]):::usecase
        UC_Cart([Gestionar Carrito]):::usecase
        UC_Checkout([Checkout / Comprar]):::usecase
        UC_Auth([Login / Registro]):::usecase
        UC_Track([Rastrear Orden]):::usecase
        UC_Review([Dejar / Ver Reseñas]):::usecase

        %% Casos de Uso del Admin
        UC_Stock([Gestionar Inventario y Stock]):::usecase
        UC_Restock([Gestionar Pedidos a Proveedores]):::usecase
        
        %% Procesos Internos
        UC_Pay([Procesar Pago y Validar]):::usecase

        %% Relaciones Lógicas (Include / Extend)
        UC_Catalogo -. "<<extend>>\n(Opcional)" .-> UC_Cart
        UC_Cart -. "<<extend>>\n(Opcional)" .-> UC_Checkout
        UC_Checkout -. "<<include>>\n(Obligatorio)" .-> UC_Auth
        UC_Checkout -. "<<include>>\n(Obligatorio)" .-> UC_Pay
    end

    %% Conexiones de Actores a Casos de Uso
    Cliente --- UC_Catalogo
    Cliente --- UC_Track
    Cliente --- UC_Review

    Admin --- UC_Stock
    Admin --- UC_Restock
    Proveedor --- UC_Restock

    %% Conexión a Sistemas Externos
    UC_Pay --- PaymentSys
```
