# Modelli ER per database dei microservizi

Documento generato a partire dalle entità TypeORM nel monorepo. L’**api-gateway** non persiste dati con entità dedicate.

Riferimenti al codice:

| Servizio | Percorso entità |
|----------|-----------------|
| auth-service | `apps/auth-service/src/app/database/entities/` |
| inventory-service | `apps/inventory-service/src/app/database/entites/` |
| order-service | `apps/order-service/src/app/database/entities/` |

---

## Auth-service

Tabella tipica TypeORM: `user` (nome di default per `@Entity()` senza nome).

```mermaid
erDiagram
    USER {
        int user_id PK
        string email UK
        string password
        string user_role
    }
```

---

## Inventory-service

Tabelle esplicite: `products`, `stock`, `stock_movements`, `warehouses`.

Relazioni TypeORM: **Product** 1:N **Stock**, **Product** 1:N **StockMovement**.

**Warehouse** non è collegata in TypeORM a `Stock` o `Product`. **Stock** e **StockMovement** usano `marketId` come stringa (nessuna FK verso `warehouses` nel modello attuale).

```mermaid
erDiagram
    PRODUCT {
        string product_id PK
        string name
        text description
        decimal basePrice
        decimal vat
        string category
        datetime createdAt
        datetime updatedAt
    }
    STOCK {
        uuid stock_id PK
        string marketId
        int physicalQuantity
        int reservedQuantity
        datetime lastUpdate
        string productId FK
    }
    STOCK_MOVEMENT {
        uuid id PK
        string productId FK
        string marketId
        varchar type
        int quantity
        string orderId
        string reason
        datetime createdAt
    }
    WAREHOUSE {
        uuid warehouse_id PK
        string market_id
        varchar name
        datetime created_at
        datetime updated_at
    }

    PRODUCT ||--o{ STOCK : has
    PRODUCT ||--o{ STOCK_MOVEMENT : logs
```

---

## Order-service

Tabelle: `order`, `order_item`, `payment`, `sub_orders`, `sub_order_items` (ultime due con nome esplicito in `@Entity`).

- **Order** → **Payment**: one-to-one; la FK `payment_id` è sulla tabella **order** (`@JoinColumn` sul lato Order).
- **SubOrderItem** referenzia `order_item_id` in modo logico (stesso valore di `OrderItem.orderItemId`), senza FK TypeORM tra le due tabelle.

```mermaid
erDiagram
    ORDER {
        uuid order_id PK
        datetime createdAt
        datetime updateAt
        varchar order_type
        varchar order_status
        varchar payment_status
        decimal total_amount
        string market_id
        varchar fulfillment_mode
        uuid payment_id FK "nullable"
    }
    ORDER_ITEM {
        varchar order_item_id PK
        string product_id
        string product_name
        int quantity
        decimal price
        uuid order_id FK
    }
    PAYMENT {
        uuid payment_id PK
        datetime created_at
        datetime update_at
        decimal amountTransaction
        varchar method
        varchar document_type
        varchar status
        string transactionDetail
    }
    SUB_ORDER {
        uuid sub_order_id PK
        datetime created_at
        datetime updated_at
        uuid parent_order_id FK "nullable"
        varchar physical_status
        bool is_paid
        int created_by_user_id
        int fulfilled_by_user_id
        uuid warehouse_id "logico, no FK DB"
    }
    SUB_ORDER_ITEM {
        uuid sub_order_item_id PK
        uuid sub_order_id FK
        varchar order_item_id "logico vs order_item"
        int quantity
    }

    ORDER ||--o{ ORDER_ITEM : contains
    ORDER ||--o{ SUB_ORDER : splits_into
    ORDER }o--|| PAYMENT : optional_payment
    SUB_ORDER ||--o{ SUB_ORDER_ITEM : lines
```

---

## Riferimenti cross-servizio (non FK nel DB)

Questi campi collegano i domini a livello applicativo; non sono foreign key tra database distinti:

- `SubOrder.warehouseId` → magazzino nell’inventory-service (UUID opaco).
- `SubOrder.createdByUserId` / `fulfilledByUserId` → `User.userId` nell’auth-service.
- `StockMovement.orderId` → ordine nell’order-service (stringa opaca).
- `OrderItem.productId` / movimenti inventario → prodotto nell’inventory-service.

---

## Visualizzazione

I diagrammi usano [Mermaid](https://mermaid.js.org/). In GitHub/GitLab o in VS Code con estensione Mermaid si vedono come grafici ER.
