# 🔧 Bazar-Trace — Backend Documentation

> **Stack:** Node.js (ESM) + Express.js + Oracle 21c + Docker  
> **Architecture:** Clean Architecture — Routes → Controller → Service → Repository  
> **Status:** Core backend complete (Auth ✅ · Products ✅ · Transactions ✅ · Analytics ✅)

---

## 📋 Table of Contents

1. [Project Vision & Purpose](#1-project-vision--purpose)
2. [Folder Structure](#2-folder-structure)
3. [Tech Stack — Every Dependency Explained](#3-tech-stack--every-dependency-explained)
4. [Clean Architecture — The Golden Rule](#4-clean-architecture--the-golden-rule)
5. [Environment Configuration](#5-environment-configuration)
6. [Database Design](#6-database-design)
7. [API Reference](#7-api-reference)
8. [Middleware System](#8-middleware-system)
9. [Module Breakdown](#9-module-breakdown)
10. [Docker — Full Explanation](#10-docker--full-explanation)
11. [Running the Project](#11-running-the-project)
12. [What's Complete vs. What's Missing](#12-whats-complete-vs-whats-missing)
13. [Coding Rules (Strict)](#13-coding-rules-strict)

---

## 1. Project Vision & Purpose

**Bazar-Trace** is a mobile-first PWA for **inventory and stock management**, built for small shop owners in Bangladesh (Chawkbazar, Mirpur, local markets). These shops face:

- Unstable/no internet (2G or offline entirely)
- Non-tech-savvy users
- Low-end Android devices
- Manual tracking via "khata" (handwritten books) — error-prone

**What the backend does:**  
Serves a secure, versioned REST API (`/api/v1/...`) that manages users, products, transactions, and analytics. It is designed to be run via Docker so it works identically on your office PC, your home laptop, and any university lab machine.

---

## 2. Folder Structure

```
backend/
├── .env                        ← Your local secrets (never commit)
├── .env.example                ← Template: copy to .env and fill in values
├── Dockerfile                  ← How to containerize the backend
├── package.json                ← Project metadata + scripts + dependencies
│
└── src/
    ├── server.js               ← Entry point: starts HTTP server, connects DB, handles shutdown
    ├── app.js                  ← Express app factory: middlewares + routes wired together
    │
    ├── config/
    │   ├── env.js              ← Reads .env, validates it with Zod, exports frozen env object
    │   ├── database.js         ← Oracle connection pool: init, close, getConnection, withConnection
    │   ├── logger.js           ← Winston logger (pretty in dev, JSON in prod)
    │   └── env.test.js         ← Unit tests for env validation
    │
    ├── api/
    │   └── v1/
    │       └── routes/
    │           └── index.js    ← Aggregates all module routes under /api/v1
    │
    ├── modules/                ← One folder per feature domain
    │   ├── auth/
    │   │   ├── auth.routes.js
    │   │   ├── auth.controller.js
    │   │   ├── auth.service.js
    │   │   ├── auth.repository.js
    │   │   └── auth.schema.js  ← Zod schemas for request validation
    │   │
    │   ├── users/
    │   │   └── (same 5-file pattern)
    │   │
    │   ├── products/
    │   │   └── (same 5-file pattern)
    │   │
    │   ├── transactions/
    │   │   └── (same 5-file pattern)
    │   │
    │   ├── analytics/
    │   │   └── (same 4-file pattern, no schema needed)
    │   │
    │   └── health/
    │       └── (liveness check)
    │
    ├── middlewares/
    │   ├── auth-guard.js       ← Verifies JWT, attaches req.user
    │   ├── role-guard.js       ← Checks req.user.role against allowed roles
    │   ├── validate.js         ← Runs a Zod schema against req.body / req.params
    │   ├── error-handler.js    ← Global error handler (last middleware)
    │   ├── not-found.js        ← 404 handler for unknown routes
    │   └── validate.test.js
    │
    ├── shared/
    │   └── constants/
    │       └── roles.js        ← { ADMIN: 'ADMIN', STAFF: 'STAFF' }
    │
    ├── utils/
    │   ├── app-error.js        ← AppError class (statusCode, code, isOperational)
    │   ├── async-handler.js    ← Wraps async route handlers, catches rejections
    │   ├── jwt.js              ← signToken / verifyToken
    │   ├── password.js         ← hashPassword / verifyPassword (bcryptjs)
    │   ├── response.js         ← sendSuccess helper
    │   ├── jwt.test.js
    │   └── password.test.js
    │
    └── db/
        ├── migrations/
        │   ├── 001_create_users.sql
        │   ├── 002_create_products.sql
        │   ├── 003_create_transactions.sql
        │   └── 004_create_views.sql
        ├── seeds/
        │   └── seed-admin.js   ← Creates the first ADMIN user
        └── run-migrations.js   ← Runs all .sql files in order
```

---

## 3. Tech Stack — Every Dependency Explained

### Runtime & Module System
| Package | Why we use it |
|---|---|
| **Node.js ≥18** | JavaScript on the server. We use `"type": "module"` in package.json, which means **ES Modules** (`import/export`) instead of old `require()`. Node 18+ has native `--watch` for auto-reload in dev. |
| **ES Modules (`import/export`)** | Modern standard. Cleaner than CommonJS. University + production requirement. |

### Web Framework
| Package | Why we use it |
|---|---|
| **express 4** | The most popular Node.js HTTP framework. Lightweight, flexible. Handles routing, middleware, request/response. |

### Security
| Package | Why we use it |
|---|---|
| **helmet** | Automatically sets ~15 HTTP security headers (X-Content-Type, HSTS, etc.). One line, big security win. |
| **cors** | Allows the frontend (different port/domain) to call the API. Without this, browsers block the request. |
| **jsonwebtoken** | Creates and verifies JWT tokens. JWTs are signed strings that prove "this user is who they say they are" without hitting the DB on every request. |
| **bcryptjs** | Hashes passwords before storing. Pure JS, no native bindings needed. Bcrypt is intentionally slow to make brute-force attacks expensive. |

### Validation
| Package | Why we use it |
|---|---|
| **zod** | Schema-first runtime validation. We define the shape of every API request body. If the request doesn't match, Zod throws and the error handler catches it → `400 Bad Request`. Also used to validate `.env` values. |

### Database
| Package | Why we use it |
|---|---|
| **oracledb 6** | Oracle's official Node.js driver. We use **Thin Mode** — no Oracle Instant Client installation needed. Just `npm install oracledb` and it connects. |

### Logging & Monitoring
| Package | Why we use it |
|---|---|
| **winston** | Structured logging. In dev: coloured, human-readable. In prod: JSON format (easy to pipe into log aggregators). |
| **morgan** | HTTP request logger middleware. Logs every request (method, URL, status, response time). Piped through Winston. |

### Performance
| Package | Why we use it |
|---|---|
| **compression** | Gzip-compresses API responses. Reduces response size by ~70%. Critical for 2G/3G users. |

### Utilities
| Package | Why we use it |
|---|---|
| **dotenv** | Loads `.env` file into `process.env`. Keeps secrets out of source code. |
| **uuid** | Generates universally unique IDs for `clientTxnId` (offline idempotency keys). |
| **nodemon** (dev only) | Watches files, restarts server on change. We actually use Node's native `--watch` in `npm run dev`. |

---

## 4. Clean Architecture — The Golden Rule

Every feature module has exactly these layers, in strict order:

```
HTTP Request
     ↓
[ Routes ]        ← just maps URL + HTTP method → controller function
     ↓
[ Controller ]    ← reads req, calls service, sends res — NO business logic
     ↓
[ Service ]       ← ALL business logic lives here (validation, rules, decisions)
     ↓
[ Repository ]    ← ONLY place that touches Oracle DB. Returns plain JS objects.
     ↓
Oracle Database
```

### Why this matters

| Problem | Without layers | With layers |
|---|---|---|
| Change DB from Oracle to PostgreSQL | Rewrite everything | Only rewrite Repositories |
| Add a business rule (max stock = 1000) | Scatter across files | One place: the Service |
| Write unit tests | Hard — DB calls everywhere | Easy — mock the Repository |
| Debug a bug | Hunt across files | Know exactly which layer owns the problem |

### Import rules (enforced by code review)

| Layer | Can import from |
|---|---|
| Routes | controllers, middlewares |
| Controller | services, response utils |
| Service | repositories, AppError, constants |
| Repository | `config/database.js`, `oracledb` ONLY |

> ⚠️ **Never** import a repository directly in a controller. Never write SQL in a service.

---

## 5. Environment Configuration

**File:** `backend/src/config/env.js`

Every environment variable is:
1. Declared in `.env` (your local secrets)
2. Read by `dotenv` into `process.env`
3. Validated and typed by **Zod** in `env.js`
4. Exported as a frozen typed object

### All variables

```bash
# ─── Application ─────────────────────────────────────
NODE_ENV=development          # development | production | test
PORT=5000                     # API runs at http://localhost:5000
API_PREFIX=/api/v1            # All routes prefixed with this
LOG_LEVEL=debug               # error | warn | info | http | debug

# ─── Security ────────────────────────────────────────
CORS_ORIGIN=http://localhost:5173    # Frontend origin (comma-separated for multiple)
JWT_SECRET=replace-with-32+-chars   # MUST be long and random in production
JWT_EXPIRES_IN=12h                  # Tokens expire after 12 hours
BCRYPT_ROUNDS=10                    # Higher = slower hash = more secure (10 is standard)

# ─── Oracle Database ─────────────────────────────────
ORACLE_ENABLED=false                # Set true when Oracle is running
ORACLE_USER=bazar_user
ORACLE_PASSWORD=change_me
ORACLE_CONNECT_STRING=localhost:1521/XEPDB1   # host:port/service_name

# ─── Oracle Connection Pool ───────────────────────────
ORACLE_POOL_MIN=2             # Always keep 2 connections warm
ORACLE_POOL_MAX=10            # Max 10 concurrent connections
ORACLE_POOL_INCREMENT=1       # Open 1 more if demand grows
ORACLE_POOL_TIMEOUT=60        # Close idle connections after 60s

# ─── Seed Admin (only used by npm run db:seed:admin) ──
SEED_ADMIN_EMAIL=admin@bazar-trace.local
SEED_ADMIN_PASSWORD=Admin@123
SEED_ADMIN_NAME=Bazar Admin
```

### How it works

```js
// env.js validates and exports:
export const env = {
  isProd: false,
  port: 5000,
  jwt: { secret: '...', expiresIn: '12h' },
  oracle: { enabled: false, poolMin: 2, poolMax: 10, ... },
  // ...
}
```

If any required variable is missing or wrong type → **server refuses to start** with a clear error message. This prevents mysterious runtime crashes.

---

## 6. Database Design

### Why Oracle?
University requirement + industry exposure. Oracle is the most widely used enterprise database in Bangladesh's banking/government sector.

### Why NOT a `stock_qty` column?

❌ **Problem with a counter column:**
```
Device A: reads stock=1, sells 1, writes stock=0  ← OK
Device B: reads stock=1 (same read!), sells 1, writes stock=0  ← WRONG! Stock went negative!
```

✅ **Solution: Immutable transaction log + computed view**
```sql
-- v_product_stock VIEW
SELECT SUM(IN qty) - SUM(OUT qty) AS current_qty
FROM transactions
WHERE product_id = ?
```
Two devices can write simultaneously — the SUM is always correct.

---

### Tables

#### `USERS`
```sql
CREATE TABLE users (
    id            NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    full_name     VARCHAR2(120)  NOT NULL,
    email         VARCHAR2(160)  NOT NULL,
    password_hash VARCHAR2(255)  NOT NULL,
    role          VARCHAR2(20)   DEFAULT 'STAFF' NOT NULL,  -- 'ADMIN' or 'STAFF'
    is_active     NUMBER(1)      DEFAULT 1 NOT NULL,         -- 1=active, 0=deactivated
    created_at    TIMESTAMP      DEFAULT SYSTIMESTAMP NOT NULL,
    updated_at    TIMESTAMP      DEFAULT SYSTIMESTAMP NOT NULL,
    CONSTRAINT uk_users_email  UNIQUE (email),
    CONSTRAINT chk_users_role  CHECK (role IN ('ADMIN','STAFF')),
    CONSTRAINT chk_users_active CHECK (is_active IN (0,1))
);
```
- `id`: auto-increment, Oracle-native identity column
- `role`: either `ADMIN` (can register users, delete products) or `STAFF` (sells, stocks)
- `is_active`: soft deactivation — we never delete users, just disable them

#### `PRODUCTS`
```sql
CREATE TABLE products (
    id          NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    sku         VARCHAR2(64)   NOT NULL UNIQUE,    -- e.g. RICE-50
    barcode     VARCHAR2(64),                       -- e.g. 8901234567890
    name        VARCHAR2(200)  NOT NULL,
    category    VARCHAR2(80),                       -- e.g. Grain, Dairy
    unit        VARCHAR2(20)   DEFAULT 'pcs' NOT NULL, -- kg, litre, pcs
    cost_price  NUMBER(12,2)   NOT NULL,            -- purchase price
    sell_price  NUMBER(12,2)   NOT NULL,            -- selling price
    expiry_date DATE,                               -- nullable (non-perishables)
    is_active   NUMBER(1)      DEFAULT 1 NOT NULL,  -- soft delete
    created_by  NUMBER         NOT NULL,            -- FK → users.id
    created_at  TIMESTAMP      DEFAULT SYSTIMESTAMP NOT NULL,
    updated_at  TIMESTAMP      DEFAULT SYSTIMESTAMP NOT NULL,
    CONSTRAINT fk_products_creator FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT chk_products_prices CHECK (cost_price >= 0 AND sell_price >= 0),
    CONSTRAINT chk_products_active CHECK (is_active IN (0,1))
);

CREATE UNIQUE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_expiry ON products(expiry_date);
```
- **Barcode index**: fast lookup when scanning
- **Expiry index**: fast alert queries (find all products expiring within 7 days)
- **Soft delete**: `is_active = 0` instead of DELETE, preserving transaction history

#### `TRANSACTIONS`
```sql
CREATE TABLE transactions (
    id             NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    client_txn_id  VARCHAR2(40) NOT NULL UNIQUE,  -- UUID from frontend (idempotency key)
    product_id     NUMBER       NOT NULL,
    user_id        NUMBER       NOT NULL,
    txn_type       VARCHAR2(10) NOT NULL,          -- 'IN' (stock in) or 'OUT' (sale)
    quantity       NUMBER(12,3) NOT NULL,           -- supports fractional (kg)
    unit_price     NUMBER(12,2) NOT NULL,
    note           VARCHAR2(500),                   -- optional memo
    occurred_at    TIMESTAMP    DEFAULT SYSTIMESTAMP NOT NULL,  -- when the sale happened
    synced_at      TIMESTAMP,                       -- when offline txn reached server
    CONSTRAINT fk_txn_product FOREIGN KEY (product_id) REFERENCES products(id),
    CONSTRAINT fk_txn_user    FOREIGN KEY (user_id)    REFERENCES users(id),
    CONSTRAINT chk_txn_type   CHECK (txn_type IN ('IN','OUT')),
    CONSTRAINT chk_txn_qty    CHECK (quantity > 0)
);
```
- **`client_txn_id` UNIQUE**: The frontend generates a UUID before sending. If the same request is replayed (network retry or offline sync), Oracle rejects the duplicate → API returns the existing record → **idempotent**.
- **`occurred_at` vs `synced_at`**: A sale made offline at 2pm will have `occurred_at=14:00` but `synced_at=15:30` when connectivity returned. Analytics use `occurred_at`.

#### `v_product_stock` VIEW
```sql
CREATE OR REPLACE VIEW v_product_stock AS
SELECT  p.id   AS product_id,
        p.sku,
        p.name,
        NVL(SUM(CASE WHEN t.txn_type = 'IN'  THEN t.quantity ELSE 0 END), 0)
        - NVL(SUM(CASE WHEN t.txn_type = 'OUT' THEN t.quantity ELSE 0 END), 0)
                AS current_qty
FROM    products p
LEFT JOIN transactions t ON t.product_id = p.id
GROUP BY p.id, p.sku, p.name;
```
- `NVL(..., 0)` handles products with zero transactions (avoids NULL result)
- `LEFT JOIN` ensures products with no transactions still appear

---

### ER Diagram

```
USERS ──────────────────────────────────────────────────────────┐
  id PK                                                          │
  full_name, email, password_hash                               │
  role (ADMIN|STAFF), is_active                                 │
  │                                                             │
  │ created_by FK           user_id FK                         │
  ▼                         ▼                                   │
PRODUCTS ◄──────────── TRANSACTIONS ───────────────────────────►┘
  id PK                   id PK
  sku UNIQUE              client_txn_id UNIQUE (idempotency)
  barcode (indexed)       product_id FK → products.id
  name, category, unit    user_id FK    → users.id
  cost_price, sell_price  txn_type (IN|OUT)
  expiry_date (indexed)   quantity, unit_price
  is_active (soft delete) occurred_at, synced_at
  │
  └──────── v_product_stock VIEW
               (computed: SUM(IN) - SUM(OUT) = current_qty)
```

---

## 7. API Reference

**Base URL:** `http://localhost:5000/api/v1`  
**Auth:** `Authorization: Bearer <jwt_token>` on all protected routes  
**Response format (always):**
```json
// Success
{ "success": true, "data": { ... } }

// Failure
{ "success": false, "error": { "code": "BAD_REQUEST", "message": "...", "details": { ... } } }
```

**Error codes:** `BAD_REQUEST` · `UNAUTHORIZED` · `FORBIDDEN` · `NOT_FOUND` · `CONFLICT` · `INTERNAL_ERROR`

---

### Auth Endpoints

| Method | URL | Auth | Description |
|---|---|---|---|
| POST | `/auth/login` | Public | Login with email + password. Returns JWT + user object. |
| POST | `/auth/register` | ADMIN only | Create a new STAFF or ADMIN user. |
| GET | `/auth/me` | Any | Get current user from JWT. |

**Login request:**
```json
{ "email": "admin@bazar-trace.local", "password": "Admin@123" }
```
**Login response:**
```json
{
  "token": "eyJ...",
  "user": { "id": 1, "fullName": "Bazar Admin", "email": "...", "role": "ADMIN" }
}
```

---

### User Endpoints

| Method | URL | Auth | Description |
|---|---|---|---|
| GET | `/users` | ADMIN | List all users |
| PATCH | `/users/:id` | ADMIN | Update name / role / active status |

---

### Product Endpoints

| Method | URL | Auth | Description |
|---|---|---|---|
| GET | `/products?search=&limit=&offset=` | Any | List products with current stock |
| GET | `/products/:id` | Any | Single product |
| GET | `/products/barcode/:barcode` | Any | Lookup by barcode (for scanner) |
| POST | `/products` | Any | Create product |
| PATCH | `/products/:id` | Any | Partial update |
| DELETE | `/products/:id` | ADMIN | Soft delete (sets is_active=0) |

**Create product body:**
```json
{
  "sku": "RICE-50",
  "barcode": "8901234567890",
  "name": "Miniket Rice 5kg",
  "category": "Grain",
  "unit": "kg",
  "costPrice": 70,
  "sellPrice": 80,
  "expiryDate": "2026-12-31"
}
```

---

### Transaction Endpoints

| Method | URL | Auth | Description |
|---|---|---|---|
| POST | `/transactions` | Any | Record a stock IN or sale OUT |
| GET | `/transactions?type=OUT&productId=12&from=&to=&limit=&offset=` | Any | List transactions with filters |

**Record transaction body:**
```json
{
  "clientTxnId": "f6e0a8d6-1b3e-4a7f-9c3b-3c1d2a9b6f17",
  "productId": 12,
  "type": "OUT",
  "quantity": 2,
  "unitPrice": 80,
  "note": "regular customer",
  "occurredAt": "2026-04-25T08:30:00.000Z"
}
```
> `clientTxnId` is **generated by the frontend** (UUID). Replaying the same ID returns the existing transaction — safe for offline sync retries.

---

### Analytics Endpoint

| Method | URL | Auth | Description |
|---|---|---|---|
| GET | `/analytics/dashboard` | Any | Dashboard stats |

**Response:**
```json
{
  "counts": {
    "activeProducts": 42,
    "lowStock": 3,
    "expiringSoon": 2,
    "expired": 0
  },
  "sales": [
    { "day": "2026-04-19", "revenue": 1200, "units": 18 }
  ],
  "expiring": [{ "id": 12, "name": "Milk 1L", "expiryDate": "..." }],
  "lowStock": [{ "productId": 8, "name": "Sugar 1kg", "stock": 2 }]
}
```

---

### Health Endpoint

| Method | URL | Auth | Description |
|---|---|---|---|
| GET | `/health` | Public | Liveness + DB connectivity check |

---

## 8. Middleware System

Middlewares run in order for every request. Think of them as a chain of guards.

```
Request
  │
  ▼
helmet()          ← Add security headers
cors()            ← Allow frontend origin
compression()     ← Gzip responses
express.json()    ← Parse JSON body
morgan()          ← Log the request
  │
  ▼
Router (matches URL)
  │
  ├── authGuard   ← Verify JWT token → sets req.user
  ├── roleGuard   ← Check role (ADMIN/STAFF)
  ├── validate()  ← Run Zod schema on req.body
  └── controller  ← Handle request, call service
  │
  ▼
notFoundHandler   ← 404 if no route matched
errorHandler      ← Catch ALL errors, format response
```

### `authGuard` — How JWT auth works

```js
// Every protected route has this middleware
export const authGuard = (req, res, next) => {
  // 1. Read the Authorization header
  const header = req.headers.authorization;  // "Bearer eyJ..."
  
  // 2. Extract the token
  const token = header.slice(7);  // remove "Bearer "
  
  // 3. Verify signature + expiry
  const payload = verifyToken(token);  // throws if invalid/expired
  
  // 4. Attach user info to req
  req.user = { id: payload.sub, role: payload.role, email: payload.email };
  
  next();  // proceed to next middleware
};
```

### `validate(schema)` — Zod validation middleware

```js
// Usage in routes:
router.post('/products', authGuard, validate(createProductSchema), controller.create);

// If body doesn't match schema → throws ZodError
// errorHandler catches it → sends 400 BAD_REQUEST with field details
```

---

## 9. Module Breakdown

### Auth Module (`/auth`)

**What's complete:**
- ✅ Login (email + password → JWT)
- ✅ Register (ADMIN only — creates STAFF or ADMIN)
- ✅ Get current user (`/me`)
- ✅ Password hashed with bcryptjs
- ✅ JWT signed with secret, 12h expiry

**Flow:**
```
POST /auth/login
  → validate(loginSchema)
  → authController.login()
  → authService.login({ email, password })
    → authRepository.findByEmail(email)     ← Oracle query
    → verifyPassword(plain, hash)           ← bcrypt
    → signToken({ sub: id, role, email })   ← JWT
  → res.json({ token, user })
```

---

### Products Module (`/products`)

**What's complete:**
- ✅ List products (paginated, with search, with current stock from view)
- ✅ Get by ID
- ✅ Get by barcode (for scanner)
- ✅ Create product
- ✅ Update product (partial PATCH)
- ✅ Soft delete (ADMIN only)
- ✅ Zod schema validation on create/update

---

### Transactions Module (`/transactions`)

**What's complete:**
- ✅ Record IN (stock received from supplier)
- ✅ Record OUT (sale to customer)
- ✅ Idempotent via `client_txn_id` UNIQUE constraint
- ✅ Filter by type, productId, date range
- ✅ Supports `occurredAt` (offline timestamp)

---

### Analytics Module (`/analytics`)

**What's complete:**
- ✅ Dashboard counts (active products, low stock count, expiring soon, expired)
- ✅ 7-day sales chart data (revenue + units per day)
- ✅ Expiring products list
- ✅ Low-stock products list

**What to add later:**
- 📋 Profit margin per product (sell_price - cost_price)
- 📋 Top-selling products
- 📋 Monthly revenue trend

---

### Health Module (`/health`)

- ✅ Returns `{ status: "ok", db: "connected" | "disabled" }`
- Used by Docker health checks and monitoring

---

## 10. Docker — Full Explanation

> You said you don't know Docker at all. This section explains everything from scratch.

### What problem does Docker solve?

Without Docker:
- You install Node.js on your PC → works
- Friend installs Node.js on their PC → "it doesn't work" (different version, different OS settings)
- University lab → Oracle not installed, Node version is old → project fails in demo

With Docker:
- Everything is packaged into a "container" — a sealed box with the exact right versions of everything
- Same box runs identically on your laptop, office PC, university lab machine
- One command starts the whole stack

### Key concepts

| Concept | Analogy | What it does |
|---|---|---|
| **Image** | A recipe / blueprint | A frozen snapshot of an app + its environment |
| **Container** | A running kitchen from that recipe | A live, running instance of an image |
| **Dockerfile** | The recipe instructions | Step-by-step instructions to build an image |
| **docker-compose.yml** | The restaurant floor plan | Defines multiple containers and how they connect |
| **Volume** | A USB drive plugged into the container | Persistent storage that survives container restarts |
| **Port mapping** | Forwarding a phone call | `"5000:5000"` means "outside port 5000 → container port 5000" |

---

### The `Dockerfile` (backend)

```dockerfile
FROM node:20-alpine          # Start from official Node 20 on tiny Alpine Linux

WORKDIR /app                 # All our files go in /app inside the container

COPY package*.json ./        # Copy package files first (layer cache optimization)
RUN npm ci --omit=dev        # Install only production dependencies

COPY src/ ./src/             # Copy our source code

EXPOSE 5000                  # Document that this container listens on port 5000

CMD ["node", "src/server.js"] # Command to start the API
```

**Why `COPY package*.json` before `COPY src/`?**  
Docker builds in layers. If `src/` changes but `package.json` doesn't, it reuses the cached `npm install` layer — much faster rebuilds.

---

### The `docker-compose.yml`

```yaml
services:
  oracle:                             # Service 1: The database
    image: gvenzl/oracle-xe:21-slim  # Pre-built Oracle XE 21c image (no license needed)
    environment:
      ORACLE_PASSWORD: oracle         # SYS/SYSTEM password
      APP_USER: bazar_user            # Creates this user automatically on first boot
      APP_USER_PASSWORD: bazar_pass
    ports:
      - "1521:1521"                   # Expose Oracle port to your laptop
    healthcheck:
      test: ["CMD", "healthcheck.sh"] # Oracle's own health script
      interval: 30s
      timeout: 10s
      retries: 10                     # Try 10 times before marking unhealthy
    volumes:
      - oracle-data:/opt/oracle/oradata  # Persist database files

  backend:                            # Service 2: Our Express API
    build: ./backend                  # Build from ./backend/Dockerfile
    depends_on:
      oracle:
        condition: service_healthy    # WAIT until Oracle passes its health check
    environment:
      NODE_ENV: production
      PORT: 5000
      ORACLE_ENABLED: "true"
      ORACLE_USER: bazar_user
      ORACLE_PASSWORD: bazar_pass
      ORACLE_CONNECT_STRING: oracle:1521/XEPDB1  # "oracle" = service name above
    ports:
      - "5000:5000"

  frontend:                           # Service 3: Static frontend server
    build: ./frontend
    depends_on:
      - backend
    ports:
      - "8080:80"                     # Nginx serves frontend on port 8080

volumes:
  oracle-data:                        # Named volume → data survives "docker compose down"
```

**Key: `oracle:1521/XEPDB1`**  
Inside Docker Compose, containers can reach each other by **service name**. So `backend` reaches `oracle` by typing `oracle:1521/XEPDB1` instead of `localhost:1521/XEPDB1`.

---

### Docker commands you need to know

```bash
# Start everything (first time or after code changes)
docker compose up -d --build
# -d = detached (runs in background, terminal is free)
# --build = rebuild images (include when you changed code)

# See what's running
docker compose ps

# See live logs
docker compose logs -f           # all services
docker compose logs -f backend   # just the API

# Stop everything (keeps data)
docker compose down

# Stop AND delete data (fresh start)
docker compose down -v

# Restart just one service
docker compose restart backend

# Run a command inside a running container
docker compose exec backend node src/db/run-migrations.js
```

---

### Oracle first-boot takes ~5 minutes
Oracle XE initializes the database on the very first run. **Don't panic** if the backend logs `Failed to connect` for the first few minutes. The `depends_on: service_healthy` will keep retrying until Oracle is ready.

---

### Moving to your home laptop

1. Install Docker Desktop: https://www.docker.com/products/docker-desktop/
2. Copy the entire `bazar/` folder to your laptop (ZIP it, USB, or GitHub)
3. Open terminal in the `bazar/` folder
4. Run: `docker compose up -d --build`
5. First Oracle boot: wait 5 minutes
6. Run migrations: `docker compose exec backend npm run db:migrate`
7. Seed admin: `docker compose exec backend npm run db:seed:admin`
8. Open browser: `http://localhost:8080`

That's it. Same steps work on any machine with Docker installed.

---

## 11. Running the Project

### Option A: Docker (Recommended — everything together)

```bash
# From the bazar/ root folder:
docker compose up -d --build

# First boot only (after Oracle is ready ~5min):
docker compose exec backend npm run db:migrate
docker compose exec backend npm run db:seed:admin

# Verify:
curl http://localhost:5000/api/v1/health
# Frontend: http://localhost:8080
```

### Option B: Manual (backend only, for development)

```bash
# 1. Start Oracle separately (Docker):
docker compose up -d oracle

# 2. Run backend locally:
cd backend
cp .env.example .env
# Edit .env: set ORACLE_ENABLED=true

npm install
npm run db:migrate          # Creates all tables
npm run db:seed:admin       # Creates first admin user
npm run dev                 # Starts server with auto-reload

# API: http://localhost:5000/api/v1/health
```

### Default admin credentials
```
Email:    admin@bazar-trace.local
Password: Admin@123
```
> Change this password immediately after first login in production!

### Available npm scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start with `node --watch` (auto-restart on file change) |
| `npm start` | Start without watch (production) |
| `npm test` | Run all `.test.js` files with Node's built-in test runner |
| `npm run db:migrate` | Run SQL migrations in order |
| `npm run db:seed:admin` | Create the first admin user |

---

## 12. What's Complete vs. What's Missing

### ✅ Fully Complete
- Express app setup with all security middleware
- Environment validation (Zod)
- Oracle connection pool with graceful shutdown
- Winston logging (pretty dev / JSON prod)
- JWT authentication (login, register, /me)
- Role-based access control (ADMIN / STAFF)
- Global error handler (Zod errors, Oracle ORA-00001, AppError, unknown errors)
- Products CRUD (create, read, update, soft delete, barcode lookup)
- Transactions (IN/OUT, idempotent, offline-ready with clientTxnId)
- Analytics dashboard endpoint (counts, 7-day sales, expiry, low-stock)
- Health check endpoint
- Database migrations (4 SQL files)
- Admin seed script
- Docker Compose setup (Oracle XE + backend + frontend)

### 📋 Suggested Additions (for better UX & marks)

| Feature | Endpoint | Priority |
|---|---|---|
| Profit analytics (margin per product) | `GET /analytics/profit` | High |
| Top-selling products | `GET /analytics/top-products` | High |
| Transaction history per product | `GET /products/:id/transactions` | Medium |
| Stock alert threshold on product | `PATCH /products/:id` (add `low_stock_threshold` field) | Medium |
| Monthly summary | `GET /analytics/monthly?month=2026-04` | Medium |
| Bulk stock-in (CSV import) | `POST /products/import` | Low |
| Soft-delete restore | `PATCH /products/:id/restore` | Low |
| Change password | `PATCH /auth/password` | High (security) |

---

## 13. Coding Rules (Strict)

These are enforced throughout the project. Follow them consistently.

```js
// ✅ async/await ONLY — no callbacks, no .then()
const user = await authRepository.findByEmail(email);

// ✅ ES Modules — import/export only, no require()
import express from 'express';
export function login() { ... }

// ✅ Thin controllers — no logic, just orchestrate
export const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);  // all logic in service
  sendSuccess(res, result);
});

// ✅ Naming conventions
const userId = 1;              // camelCase for variables and functions
class AppError { ... }         // PascalCase for classes
// auth-guard.js               // kebab-case for file names

// ✅ Zod for all request validation
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// ✅ Parameterized queries ALWAYS — never string concat
await conn.execute(
  `SELECT * FROM users WHERE email = :email`,
  { email }   // ← bind variables, prevents SQL injection
);

// ✅ AppError for known errors
throw AppError.notFound('Product not found');
throw AppError.conflict('Email already registered');
throw AppError.unauthorized('Invalid credentials');
```
