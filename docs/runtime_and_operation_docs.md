# 📘 Bazar-Trace — Runtime Architecture & Operational Guide

This document provides a deep dive into the runtime architecture, communication flows, database mechanisms, and offline syncing protocols of the **Bazar-Trace** application.

---

## 🗺️ Architectural Topology

At runtime, the application runs as three distinct services orchestrated via a Docker bridge network:

```mermaid
flowchart TD
    subgraph Host Machine (Port Bindings)
        Browser([Cashier Browser]) -->|HTTP Port 8080| FE[frontend container: Nginx]
        AdminSQL([SQL*Plus / DB Client]) -->|Oracle Thin Port 1522| DB[oracle container: Oracle XE 21c]
    end

    subgraph Docker Bridge Network (bazar-trace_default)
        FE -->|Reverse Proxies /api/v1| BE[backend container: Express API]
        BE -->|Thin connection / DB Pool| DB
    end
```

### 1. Port Allocation Table
| Service Name | Internal Container Port | Host Bound Port | Protocol | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **frontend** | `80` | `8080` | HTTP | Serves the HTML5/JS static files; reverse-proxies `/api` to the backend. |
| **backend** | `5000` | `5000` | HTTP | Serves the REST API endpoints and connects to the Oracle DB. |
| **oracle** | `1521` | `1522` | TCP (SQL*Net) | Relational database storage container (exposed to host on port 1522). |

---

## 🔀 Nginx Reverse Proxy & Routing Mechanics

The frontend container runs a lightweight **Nginx web server** (`nginx:alpine`) configured in [nginx.conf](file:///c:/Users/workm/Desktop/UN/bazar-trace/frontend/nginx.conf) to perform two critical tasks:

### 1. Static Content Hosting & SPA Router Fallback
Since the PWA uses **hash-based routing** (`#/login`, `#/dashboard`, etc.), Nginx serves the raw files directly. If a browser requests a physical file that doesn't exist, Nginx falls back to `index.html` via:
```nginx
try_files $uri $uri/ /index.html;
```

### 2. Reverse Proxying API Traffic
To prevent **CORS (Cross-Origin Resource Sharing)** issues in production, the PWA sends all API requests directly to the same host under `/api/v1/*`. Nginx intercepts this traffic and proxies it to the Node backend:
```nginx
location /api {
    proxy_pass http://backend:5000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

---

## ⚙️ Backend Clean Architecture & DB Pool

The [backend](file:///c:/Users/workm/Desktop/UN/bazar-trace/backend) follows a strict **Clean Architecture** pattern to isolate database drivers from business logic.

```
Request ──▶ Routes ──▶ Controller ──▶ Service ──▶ Repository ──▶ Oracle DB
```

1. **Routes Layer**: Exposes endpoint routing (e.g. `product.routes.js`).
2. **Controller Layer**: Deserializes requests, applies [Zod](https://zod.dev/) schemas to validate request bodies, and calls Services.
3. **Service Layer**: Implements business logic (e.g., matching permissions, validating constraints).
4. **Repository Layer**: The *only* layer permitted to interact with the database. It imports `withConnection` from [database.js](file:///c:/Users/workm/Desktop/UN/bazar-trace/backend/src/config/database.js) and executes raw SQL queries.

### 🏊 Oracle Connection Pooling (Thin Mode)
The Node API uses the modern **node-oracledb** Thin driver (no Instant Client binaries required). During bootstrapping, the Express server calls `initDbPool()` which opens a connection pool `bazarPool` mapping to `oracle:1521/XEPDB1`.
* **Min Connections**: 2 (kept active in the background for low-latency queries).
* **Max Connections**: 10 (scales under peak query load).
* **Acquisition Pattern**: Repositories acquire a connection via `withConnection()`, perform their transaction, and automatically return the connection to the pool using a `finally` block to prevent leaks.

---

## 💾 Database Schema & Stock Computations

The Oracle database schema consists of three core tables and one critical view:

```sql
USERS (User accounts, roles: STAFF or ADMIN)
  ▲
  │ created_by
  ▼
PRODUCTS (SKU, barcode, name, prices, low-stock threshold)
  ▲
  │ product_id
  ▼
TRANSACTIONS (client_txn_id UNIQUE, txn_type IN/OUT, quantity, occurred_at)
```

### 🧮 Calculating Stock Dynamically via View (`v_product_stock`)
To prevent concurrent sales from causing race conditions on a static counter, the app **derives** the current stock of every product on the fly. 

The view `v_product_stock` aggregates transactions:
```sql
CREATE OR REPLACE VIEW v_product_stock AS
SELECT 
    product_id,
    SUM(CASE WHEN txn_type = 'IN' THEN quantity ELSE 0 END) -
    SUM(CASE WHEN txn_type = 'OUT' THEN quantity ELSE 0 END) AS current_qty
FROM transactions
GROUP BY product_id;
```
This guarantees absolute correctness: if two cashier terminals simultaneously record sales, the transactions log inserts the entries sequentially, and the computed stock is always mathematically sound.

---

## 📴 Offline PWA Sync & Idempotence

The primary user requirement is that Bazar-Trace must remain functional when cellular connection (2G/3G) drops.

```
               [ Online Status Check ]
                      /       \
               (Online)       (Offline)
                 /                 \
  POST directly to API         1. Generate UUID clientTxnId
                               2. Write to local IndexedDB 'transactions' store
                               3. Queue in IndexedDB 'sync_queue' store
                               4. Replay via SyncManager when "online" event fires
```

### 1. IndexedDB Caching (App Shell + Lists)
* **Pre-cached Shell**: The Service Worker's `install` event downloads and stores all PWA core assets (`index.html`, `/css/`, `/js/`) in browser cache.
* **Cached Lists**: Products and transactions fetched from the backend are cached inside local IndexedDB object stores (`products`, `transactions`).
* **Offline Search**: When offline, the app shell queries IndexedDB directly (enabling the barcode camera scanner to lookup SKU/barcode data offline).

### 2. Idempotent Write Replays (`client_txn_id`)
When a cashier records a transaction offline, the client app generates a client-side **UUID** as the transaction ID.
1. The transaction is written locally to IndexedDB with `_pending = true`.
2. A synchronization payload is added to the `sync_queue` object store.
3. Once internet connectivity is restored, the `SyncManager` drains the queue FIFO-style by POSTing to the API.

#### 🛡️ Handling Network Failures & Duplicate Retries
If a network request succeeds but the connection drops before the client receives the response, the client will retry the POST request. 
To prevent duplicate sales being recorded in the database, the backend maps `clientTxnId` to the Oracle `client_txn_id UNIQUE` constraint.
* If a duplicate UUID is submitted, Oracle throws a unique key violation.
* The backend controller catches this error code (e.g. `ORA-00001`), identifies that it has already been recorded, and returns a successful `200 OK` response with the existing transaction data instead of failing.
* The client removes the item from the queue, resolving the sync seamlessly.
