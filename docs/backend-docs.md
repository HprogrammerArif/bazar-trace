# 🔧 Bazar-Trace — Backend Documentation

> **Stack:** Node.js 18+ (ESM) · Custom `http` server · Oracle XE 21c (local, Thin mode) · Docker Compose (production only)
> **Architecture:** Clean Architecture — Custom Router → Controller → Service → Repository
> **Status:** Core backend complete (Auth ✅ · Products ✅ · Transactions ✅ · Analytics ✅)

> [!NOTE]
> Express.js, `cors`, `helmet`, `compression`, and `morgan` have been **completely removed** from this project to satisfy the university's zero-framework-dependency requirement. All HTTP server logic, middleware, routing, CORS, body parsing, and request logging are implemented using only Node.js's built-in `node:http` module.

---

## 📋 Table of Contents

1. [Project Vision & Purpose](#1-project-vision--purpose)
2. [Folder Structure](#2-folder-structure)
3. [Tech Stack — Every Dependency Explained](#3-tech-stack--every-dependency-explained)
4. [Custom HTTP Server — How It Replaces Express](#4-custom-http-server--how-it-replaces-express)
5. [Clean Architecture — The Golden Rule](#5-clean-architecture--the-golden-rule)
6. [Environment Configuration](#6-environment-configuration)
7. [Database — Complete In-Depth Guide](#7-database--complete-in-depth-guide)
8. [API Reference](#8-api-reference)
9. [Middleware System](#9-middleware-system)
10. [Module Breakdown](#10-module-breakdown)
11. [Docker — Production Only](#11-docker--production-only)
12. [Running the Project](#12-running-the-project)
13. [What's Complete vs. What's Missing](#13-whats-complete-vs-whats-missing)
14. [Coding Rules (Strict)](#14-coding-rules-strict)

---

## 1. Project Vision & Purpose

**Bazar-Trace** is a mobile-first PWA for **inventory and stock management**, built for small shop owners in Bangladesh (Chawkbazar, Mirpur, local markets). These shops face:

- Unstable/no internet (2G or offline entirely)
- Non-tech-savvy users
- Low-end Android devices
- Manual tracking via "khata" (handwritten books) — error-prone

**What the backend does:**
Serves a secure, versioned REST API (`/api/v1/...`) that manages users, products, transactions, and analytics. It connects to a locally installed Oracle XE 21c database using the `oracledb` Thin mode driver — no Docker Oracle container needed for development.

---

## 2. Folder Structure

```
backend/
├── .env                        ← Your local secrets (never commit)
├── .env.example                ← Template: copy to .env and fill in values
├── Dockerfile                  ← How to containerize the backend (production)
├── package.json                ← Project metadata + scripts + dependencies
│
└── src/
    ├── server.js               ← Entry point: starts HTTP server, connects DB, handles shutdown
    ├── app.js                  ← Custom http.createServer() + middleware pipeline + router
    │
    ├── config/
    │   ├── env.js              ← Reads .env, validates it with Zod, exports frozen env object
    │   ├── database.js         ← Oracle connection pool: init, close, getConnection, withConnection
    │   ├── logger.js           ← Winston logger (pretty in dev, JSON in prod)
    │   └── env.test.js         ← Unit tests for env validation
    │
    ├── api/
    │   └── v1/
    │       ├── router-helper.js ← Custom Router class (replaces Express Router)
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
    │   ├── error-handler.js    ← Global error handler (last in pipeline)
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
        │   ├── 004_create_views.sql
        │   └── 005_add_low_stock_threshold.sql
        ├── seeds/
        │   ├── seed-admin.js       ← Creates the first ADMIN user
        │   └── seed-dummy-data.js  ← Seeds sample products/transactions for testing
        └── run-migrations.js       ← Runs all .sql files in order, tracks applied migrations
```

---

## 3. Tech Stack — Every Dependency Explained

### Runtime & Module System

| Package | Why we use it |
|---|---|
| **Node.js ≥18** | JavaScript on the server. We use `"type": "module"` in `package.json`, which enables **ES Modules** (`import/export`). Node 18+ has the native `--watch` flag for auto-reload in development. |
| **ES Modules (`import/export`)** | Modern standard. Cleaner than CommonJS `require()`. University + production requirement. |

### HTTP Layer — Custom Built (No Express)

| What | How |
|---|---|
| **HTTP Server** | Node.js built-in `node:http` — `http.createServer()` |
| **Router** | Custom `RouterClass` in `src/api/v1/router-helper.js` — compiles path params to RegExp |
| **Middleware pipeline** | Hand-written: `logRequest`, `setHeaders`, `parseBody` (all in `app.js`) |
| **CORS** | Custom `setHeaders()` middleware reads `CORS_ORIGIN` from env |
| **Security headers** | Custom: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` |
| **Body parsing** | Custom `parseBody()` streams `req.on('data')`, supports JSON + URL-encoded |

### Security

| Package | Why we use it |
|---|---|
| **jsonwebtoken** | Creates and verifies JWT tokens. JWTs are signed strings proving "this user is authenticated" without hitting the DB on every request. |
| **bcryptjs** | Hashes passwords before storing. Pure JS, no native bindings needed. Intentionally slow to defeat brute-force attacks. |

### Validation

| Package | Why we use it |
|---|---|
| **zod** | Schema-first runtime validation for every API request body AND for `.env` values. If input doesn't match → `400 Bad Request` with field-level details. |

### Database

| Package | Why we use it |
|---|---|
| **oracledb 6** | Oracle's official Node.js driver. We use **Thin Mode** — pure JavaScript, no Oracle Instant Client installation required. Just `npm install oracledb` and connect. |

### Logging

| Package | Why we use it |
|---|---|
| **winston** | Structured logging. In dev: coloured, human-readable. In prod: JSON format (pipeable to log aggregators). Replaces `morgan` — we wrote our own `logRequest` middleware. |

### Utilities

| Package | Why we use it |
|---|---|
| **dotenv** | Loads `.env` file into `process.env`. Keeps secrets out of source code. |
| **uuid** | Generates universally unique IDs for `clientTxnId` (offline idempotency keys). |

> **Removed packages:** `express`, `cors`, `helmet`, `compression`, `morgan`, `nodemon` (replaced by `node --watch`).

---

## 4. Custom HTTP Server — How It Replaces Express

This is the most important architectural decision in the backend. Express.js was removed entirely.

### The Custom Router (`src/api/v1/router-helper.js`)

```js
class RouterClass {
  constructor() {
    this.routes = [];      // All registered routes
    this.middlewares = []; // Router-level middlewares
  }

  // Register a sub-router with a URL prefix
  use(prefix, routerInstance) {
    for (const route of routerInstance.routes) {
      let fullPath = prefix + route.path;
      this.routes.push({
        method: route.method,
        path: fullPath,
        handlers: [...this.middlewares, ...route.handlers],
      });
    }
  }

  // Register individual routes
  add(method, path, ...handlers) {
    this.routes.push({ method: method.toUpperCase(), path, handlers });
  }

  get(path, ...handlers)    { this.add('GET',    path, ...handlers); }
  post(path, ...handlers)   { this.add('POST',   path, ...handlers); }
  patch(path, ...handlers)  { this.add('PATCH',  path, ...handlers); }
  delete(path, ...handlers) { this.add('DELETE', path, ...handlers); }
}

export function Router() { return new RouterClass(); }
```

### How route matching works in `app.js`

When `createApp()` is called, it **pre-compiles** every registered path into a RegExp, extracting `:param` names:

```js
const compiledRoutes = apiRouter.routes.map((route) => {
  const paramNames = [];
  const pattern = route.path
    .replace(/([.+*?[^]$(){}=!<>|])/g, '\\$1')   // escape regex chars
    .replace(/:([a-zA-Z0-9_]+)/g, (_, name) => {
      paramNames.push(name);
      return '([^/]+)';                             // :id → capture group
    });
  return {
    method: route.method,
    regex: new RegExp(`^${pattern}$`),
    paramNames,
    handlers: route.handlers,
  };
});
```

On each request, the server finds the matching route and extracts `req.params`:

```js
const matched = compiledRoutes.find(
  (r) => r.method === req.method && r.regex.test(pathname)
);
const match = pathname.match(matched.regex);
req.params = {};
matched.paramNames.forEach((name, i) => {
  req.params[name] = match[i + 1];
});
```

### Custom Middleware Pipeline (in `app.js`)

Three global middlewares run in order for every request, before route handlers:

```js
const globalHandlers = [logRequest, setHeaders, parseBody];
```

**`logRequest`** — HTTP request logger (replaces morgan):
```js
function logRequest(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    // Dev:  "GET /api/v1/products 200 - 12ms"
    // Prod: "127.0.0.1 - - "GET /api/v1/products HTTP/1.1" 200 450"
    httpLogStream.write(logLine);
  });
  next();
}
```

**`setHeaders`** — CORS + security headers (replaces `cors` + `helmet`):
```js
function setHeaders(req, res, next) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  // Handle preflight
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
  next();
}
```

**`parseBody`** — JSON body parser (replaces `express.json()`):
```js
function parseBody(req, res, next) {
  if (req.method === 'GET' || req.method === 'DELETE') {
    req.body = {}; return next();
  }
  let body = '';
  req.on('data', (chunk) => {
    body += chunk;
    if (body.length > 1024 * 1024) next(AppError.badRequest('Body too large'));
  });
  req.on('end', () => {
    try {
      req.body = body ? JSON.parse(body) : {};
      next();
    } catch {
      next(AppError.badRequest('Invalid JSON body'));
    }
  });
}
```

### `next(err)` Error Propagation

Our pipeline implements the same `next(err)` pattern as Express. Any middleware or route handler calling `next(err)` routes to the global `errorHandler`:

```js
function next(err) {
  if (err) return errorHandler(err, req, res, next);
  // ... run next middleware or route handler
}
```

---

## 5. Clean Architecture — The Golden Rule

Every feature module has exactly these layers, in strict order:

```
HTTP Request
     ↓
[ Custom Router ]   ← maps URL + HTTP method → controller function
     ↓
[ Controller ]      ← reads req, calls service, sends res — NO business logic
     ↓
[ Service ]         ← ALL business logic lives here (validation, rules, decisions)
     ↓
[ Repository ]      ← ONLY place that touches Oracle DB. Returns plain JS objects.
     ↓
Oracle Database
```

### Import rules

| Layer | Can import from |
|---|---|
| Routes | controllers, middlewares |
| Controller | services, response utils |
| Service | repositories, AppError, constants |
| Repository | `config/database.js`, `oracledb` ONLY |

> ⚠️ **Never** import a repository directly in a controller. Never write SQL in a service.

### Why this matters

| Problem | Without layers | With layers |
|---|---|---|
| Change DB from Oracle to PostgreSQL | Rewrite everything | Only rewrite Repositories |
| Add a business rule (max stock = 1000) | Scatter across files | One place: the Service |
| Write unit tests | Hard — DB calls everywhere | Easy — mock the Repository |

---

## 6. Environment Configuration

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
ORACLE_ENABLED=false                # Set true when Oracle is running locally
ORACLE_USER=bazar_user              # Your Oracle schema/user
ORACLE_PASSWORD=change_me
ORACLE_CONNECT_STRING=localhost:1521/XEPDB1   # host:port/service_name (Thin mode)

# ─── Oracle Connection Pool ───────────────────────────
ORACLE_POOL_MIN=2             # Always keep 2 connections warm
ORACLE_POOL_MAX=10            # Max 10 concurrent connections
ORACLE_POOL_INCREMENT=1       # Open 1 more connection if demand grows
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
  apiPrefix: '/api/v1',
  jwt: { secret: '...', expiresIn: '12h' },
  oracle: {
    enabled: false,
    user: 'bazar_user',
    connectString: 'localhost:1521/XEPDB1',
    poolMin: 2, poolMax: 10, poolIncrement: 1, poolTimeout: 60,
  },
  // ...
}
```

If any required variable is missing or the wrong type → **server refuses to start** with a clear Zod error message. This prevents mysterious runtime crashes.

---

## 7. Database — Complete In-Depth Guide

### 7.1 Why Oracle?

University requirement + industry exposure. Oracle is the most widely used enterprise database in Bangladesh's banking and government sectors.

### 7.2 Why Local Installation Instead of Docker?

For development, Oracle XE 21c is installed **natively** on the developer's machine. This is faster and simpler than spinning up a Docker container every session.

**Advantages:**
- Starts instantly — no Docker overhead
- Persistent data without volume configuration
- The `oracledb` v6 **Thin mode** driver connects with zero extra installation — just `npm install oracledb` and a connection string

Docker Compose is still available for production deployment.

---

### 7.3 What is oracledb Thin Mode?

Traditional Oracle drivers require a separately installed **Oracle Instant Client** (a large set of native C libraries, hundreds of MB). The Thin mode is a **pure-JavaScript** implementation of the Oracle wire protocol, built into `oracledb` v6+.

**Result:** You can connect to Oracle using only the npm package — no Instant Client, no environment variables like `LD_LIBRARY_PATH`, no native compilation.

Connection string format:
```
localhost:1521/XEPDB1
  ↑           ↑    ↑
  host       port  service_name (XEPDB1 is the default pluggable database in Oracle XE)
```

---

### 7.4 Setting Up Oracle XE 21c Locally

**Step 1 — Download Oracle XE 21c**
Go to: https://www.oracle.com/database/technologies/xe-downloads.html
Download the Windows installer (OracleXE213_Win64.zip ~1.5GB).

**Step 2 — Install**
Run the installer. Remember the password you set for SYS/SYSTEM — you'll need it.

**Step 3 — Create the application user**
Open SQL*Plus or SQLcl as SYSDBA and run:
```sql
-- Connect as SYS
ALTER SESSION SET CONTAINER = XEPDB1;

CREATE USER bazar_user IDENTIFIED BY your_password;
GRANT CONNECT, RESOURCE TO bazar_user;
GRANT CREATE SESSION TO bazar_user;
GRANT UNLIMITED TABLESPACE TO bazar_user;
```

**Step 4 — Set your `.env`**
```bash
ORACLE_ENABLED=true
ORACLE_USER=bazar_user
ORACLE_PASSWORD=your_password
ORACLE_CONNECT_STRING=localhost:1521/XEPDB1
```

**Step 5 — Run migrations**
```bash
npm run db:migrate
```

**Step 6 — Seed the admin**
```bash
npm run db:seed:admin
```

**Done.** Oracle is ready, the tables exist, and the admin user is created.

---

### 7.5 How the Connection Pool Works (`src/config/database.js`)

The backend uses a **connection pool** instead of opening a new connection for every request. A pool keeps a set of connections alive and reuses them — much faster.

```js
// On server startup:
await oracledb.createPool({
  poolAlias: 'bazarPool',
  user: env.oracle.user,
  password: env.oracle.password,
  connectString: env.oracle.connectString,  // "localhost:1521/XEPDB1"
  poolMin: 2,        // Always keep 2 connections open
  poolMax: 10,       // Never exceed 10 simultaneous connections
  poolIncrement: 1,  // Open one more when demand increases
  poolTimeout: 60,   // Release idle connections after 60s
});

// After creating the pool, do a connectivity test:
const conn = await oracledb.getConnection('bazarPool');
await conn.execute('SELECT 1 FROM dual');
await conn.close();
// ↑ If this succeeds, Oracle is up and responding
```

**Key exported functions:**

| Function | Description |
|---|---|
| `initDbPool()` | Creates the pool, tests connectivity. Called at server startup. |
| `closeDbPool()` | Gracefully drains and closes all connections. Called on SIGINT/SIGTERM. |
| `getConnection()` | Returns one connection from the pool. You must `close()` it after use. |
| `withConnection(fn)` | Runs `fn(conn)` and **auto-closes** the connection after — the safe way. |
| `isDbEnabled()` | Returns `true` if `ORACLE_ENABLED=true` |
| `isDbReady()` | Returns `true` if pool was created and tested successfully |

**How repositories use `withConnection`:**
```js
// In any repository file:
import { withConnection } from '../../config/database.js';

export async function findById(id) {
  return withConnection(async (conn) => {
    const result = await conn.execute(
      'SELECT * FROM users WHERE id = :id',
      { id },
    );
    return result.rows[0] ?? null;
  });
  // ← connection is automatically returned to the pool here
}
```

**Global oracledb settings (set once at startup):**
```js
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;  // rows as {col: val} objects (not arrays)
oracledb.autoCommit = false;                       // manual transaction control
oracledb.fetchAsString = [oracledb.CLOB];          // CLOB columns returned as strings
```

---

### 7.6 Why NOT a `stock_qty` Column?

❌ **Problem with a counter column (race condition):**
```
Device A: reads stock=1, sells 1, writes stock=0  ← OK
Device B: reads stock=1 (same read!), sells 1, writes stock=0  ← WRONG! Stock went negative!
```

✅ **Solution: Immutable transaction log + computed view**
```sql
-- v_product_stock VIEW
SELECT SUM(IN qty) - SUM(OUT qty) AS current_qty
FROM transactions WHERE product_id = ?
```
Two devices can write simultaneously — the SUM is always correct because Oracle processes each INSERT atomically.

---

### 7.7 The Migration System (`src/db/run-migrations.js`)

Migrations are SQL files that create the database schema. The migration runner:

1. **Creates a `schema_migrations` table** (if it doesn't exist) to track which files have run
2. **Reads all `.sql` files** from `src/db/migrations/` and sorts them alphabetically
3. **Skips already-applied migrations** — safe to run repeatedly
4. **Splits multi-statement SQL files** by `;` + newline and executes each statement
5. **Records each applied file** in `schema_migrations`

```js
async function run() {
  await initDbPool();
  const files = (await fs.readdir(MIGRATIONS_DIR))
    .filter((f) => f.endsWith('.sql'))
    .sort();                                    // 001_ before 002_ before 003_

  await withConnection(async (conn) => {
    await ensureMigrationsTable(conn);           // CREATE TABLE schema_migrations ...

    for (const file of files) {
      if (await alreadyApplied(conn, file)) {   // SELECT 1 FROM schema_migrations WHERE id = :file
        logger.info(`${file} (skipped)`);
        continue;
      }
      const sql = await fs.readFile(path.join(MIGRATIONS_DIR, file), 'utf8');
      for (const stmt of splitStatements(sql)) {
        await conn.execute(stmt);               // Run each SQL statement
      }
      await conn.commit();
      await recordApplied(conn, file);          // INSERT INTO schema_migrations
      logger.info(`${file} applied ✓`);
    }
  });
}
```

**To run:** `npm run db:migrate`

**To add a new migration:** Create a new file like `006_add_column.sql`. The runner will automatically pick it up and apply it on the next run without re-running previous migrations.

---

### 7.8 Migration Files — Exact SQL

#### `001_create_users.sql`
```sql
CREATE TABLE users (
    id              NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    full_name       VARCHAR2(120)       NOT NULL,
    email           VARCHAR2(160)       NOT NULL,
    password_hash   VARCHAR2(255)       NOT NULL,
    role            VARCHAR2(20)        DEFAULT 'STAFF' NOT NULL,
    is_active       NUMBER(1)           DEFAULT 1 NOT NULL,
    created_at      TIMESTAMP           DEFAULT SYSTIMESTAMP NOT NULL,
    updated_at      TIMESTAMP           DEFAULT SYSTIMESTAMP NOT NULL,
    CONSTRAINT uk_users_email   UNIQUE (email),
    CONSTRAINT chk_users_role   CHECK (role IN ('ADMIN','STAFF')),
    CONSTRAINT chk_users_active CHECK (is_active IN (0,1))
);
```
- `GENERATED ALWAYS AS IDENTITY` — Oracle auto-increment (like MySQL `AUTO_INCREMENT`)
- `uk_users_email` — enforces unique emails at the DB level
- `is_active` is `NUMBER(1)` (0 or 1) — Oracle has no native BOOLEAN type

#### `002_create_products.sql`
```sql
CREATE TABLE products (
    id              NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    sku             VARCHAR2(64)        NOT NULL UNIQUE,
    barcode         VARCHAR2(64),
    name            VARCHAR2(200)       NOT NULL,
    category        VARCHAR2(80),
    unit            VARCHAR2(20)        DEFAULT 'pcs' NOT NULL,
    cost_price      NUMBER(12,2)        NOT NULL,
    sell_price      NUMBER(12,2)        NOT NULL,
    expiry_date     DATE,
    is_active       NUMBER(1)           DEFAULT 1 NOT NULL,
    created_by      NUMBER              NOT NULL,
    created_at      TIMESTAMP           DEFAULT SYSTIMESTAMP NOT NULL,
    updated_at      TIMESTAMP           DEFAULT SYSTIMESTAMP NOT NULL,
    CONSTRAINT fk_products_creator   FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT chk_products_prices   CHECK (cost_price >= 0 AND sell_price >= 0),
    CONSTRAINT chk_products_active   CHECK (is_active IN (0,1))
);

CREATE UNIQUE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_expiry ON products(expiry_date);
```
- **Barcode UNIQUE index** — prevents duplicate barcodes, enables fast `WHERE barcode = :barcode` scanner lookups
- **Expiry index** — speeds up `WHERE expiry_date <= SYSDATE + 7` alert queries
- **Soft delete** — `is_active = 0` instead of DELETE, so transaction history is preserved
- **`cost_price` / `sell_price`** — `NUMBER(12,2)` allows up to 10 digits before the decimal and 2 after

#### `003_create_transactions.sql`
```sql
CREATE TABLE transactions (
    id              NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    client_txn_id   VARCHAR2(40)        NOT NULL UNIQUE,
    product_id      NUMBER              NOT NULL,
    user_id         NUMBER              NOT NULL,
    txn_type        VARCHAR2(10)        NOT NULL,
    quantity        NUMBER(12,3)        NOT NULL,
    unit_price      NUMBER(12,2)        NOT NULL,
    note            VARCHAR2(500),
    occurred_at     TIMESTAMP           DEFAULT SYSTIMESTAMP NOT NULL,
    synced_at       TIMESTAMP,
    CONSTRAINT fk_txn_product FOREIGN KEY (product_id) REFERENCES products(id),
    CONSTRAINT fk_txn_user    FOREIGN KEY (user_id)    REFERENCES users(id),
    CONSTRAINT chk_txn_type   CHECK (txn_type IN ('IN','OUT')),
    CONSTRAINT chk_txn_qty    CHECK (quantity > 0)
);

CREATE INDEX idx_txn_product_time ON transactions(product_id, occurred_at);
CREATE INDEX idx_txn_user         ON transactions(user_id);
CREATE INDEX idx_txn_type_time    ON transactions(txn_type, occurred_at);
```
- **`client_txn_id` UNIQUE** — the frontend generates a UUID before sending. If the same request is replayed (network retry or offline sync replay), Oracle raises `ORA-00001`, the backend returns the existing record → **idempotent write**
- **`occurred_at` vs `synced_at`** — a sale made offline at 2pm has `occurred_at=14:00` but `synced_at=15:30` when connectivity returned. Analytics always use `occurred_at`
- **`quantity NUMBER(12,3)`** — supports fractional quantities (e.g. 0.5 kg)
- Three composite indexes for the most common query patterns

#### `004_create_views.sql`
```sql
CREATE OR REPLACE VIEW v_product_stock AS
SELECT  p.id            AS product_id,
        p.sku,
        p.name,
        NVL(SUM(CASE WHEN t.txn_type = 'IN'  THEN t.quantity ELSE 0 END), 0)
        - NVL(SUM(CASE WHEN t.txn_type = 'OUT' THEN t.quantity ELSE 0 END), 0)
                        AS current_qty
FROM    products p
LEFT JOIN transactions t ON t.product_id = p.id
GROUP BY p.id, p.sku, p.name;
```
- `NVL(expr, 0)` — Oracle's null-safe fallback (like `COALESCE` in PostgreSQL)
- `LEFT JOIN` — products with zero transactions still appear (with `current_qty = 0`)
- Products use this view when listing: `JOIN v_product_stock vs ON vs.product_id = p.id`

#### `005_add_low_stock_threshold.sql`
```sql
ALTER TABLE products ADD low_stock_threshold NUMBER DEFAULT 5 NOT NULL;
ALTER TABLE products ADD CONSTRAINT chk_products_threshold CHECK (low_stock_threshold >= 0);
```
- Added as a separate migration (not in 002) because it was added later
- Default 5 — any product with `current_qty <= low_stock_threshold` triggers a low-stock alert

---

### 7.9 Entity Relationship Diagram

```
USERS ──────────────────────────────────────────────────────────────┐
  id PK (IDENTITY)                                                   │
  full_name, email (UNIQUE), password_hash                          │
  role CHECK('ADMIN','STAFF'), is_active CHECK(0,1)                │
  created_at, updated_at (SYSTIMESTAMP)                             │
  │                                                                  │
  │ created_by FK                   user_id FK                      │
  ▼                                 ▼                                │
PRODUCTS ◄──────────── TRANSACTIONS ───────────────────────────────►┘
  id PK                   id PK
  sku UNIQUE               client_txn_id UNIQUE  ← idempotency key
  barcode (UNIQUE index)   product_id FK → products.id
  name, category, unit     user_id FK    → users.id
  cost_price, sell_price   txn_type CHECK('IN','OUT')
  low_stock_threshold      quantity NUMBER(12,3) ← supports fractions
  expiry_date (index)      unit_price, note
  is_active (soft delete)  occurred_at ← when sale happened (offline-aware)
  created_by FK            synced_at   ← when it reached the server
  │
  └──────── v_product_stock VIEW
               current_qty = SUM(IN qty) - SUM(OUT qty)
```

---

### 7.10 Common Database Questions & Answers

**Q: How do I check if Oracle is running?**
```bash
# In Windows — check if the Oracle service is up:
services.msc → look for "OracleServiceXE" → should be "Running"

# Or connect via SQL*Plus:
sqlplus bazar_user/your_password@localhost:1521/XEPDB1
SQL> SELECT 1 FROM dual;
```

**Q: What if `npm run db:migrate` fails with "ORA-01017: invalid username/password"?**
Your `.env` credentials don't match the Oracle user you created. Double-check `ORACLE_USER` and `ORACLE_PASSWORD` in `.env`.

**Q: What if migrations fail with "ORA-00942: table or view does not exist"?**
Run migrations in order — if `002_create_products.sql` runs before `001_create_users.sql`, the `FOREIGN KEY` on `created_by` will fail because `users` doesn't exist yet. The migration runner sorts alphabetically, so `001_` always runs first.

**Q: Can I run migrations multiple times safely?**
Yes. The runner checks `schema_migrations` before each file. Already-applied migrations are skipped with a "skipped" log message. Only new migration files are applied.

**Q: How do I reset the database completely?**
```sql
-- Connect as SYSDBA and drop then recreate the user:
ALTER SESSION SET CONTAINER = XEPDB1;
DROP USER bazar_user CASCADE;  -- removes ALL tables, views, indexes
CREATE USER bazar_user IDENTIFIED BY your_password;
GRANT CONNECT, RESOURCE, UNLIMITED TABLESPACE TO bazar_user;
```
Then run `npm run db:migrate` again.

**Q: What is `XEPDB1`?**
Oracle XE installs with two databases:
- `XE` — the Container Database (CDB) — the root
- `XEPDB1` — the Pluggable Database (PDB) — where you actually create users and tables

Always connect to `XEPDB1` for application data. Never work directly in the CDB root.

**Q: Why `GENERATED ALWAYS AS IDENTITY` instead of a SEQUENCE?**
In older Oracle versions, auto-increment required manually creating a SEQUENCE and a TRIGGER. Oracle 12c+ supports `IDENTITY` columns natively, which is much cleaner. `GENERATED ALWAYS` means Oracle controls the value — you cannot insert your own ID.

**Q: What is `ORA-00001: unique constraint violated`?**
This error means you tried to insert a row with a value that already exists in a UNIQUE column (like `email` in `users`, or `client_txn_id` in `transactions`). Our backend catches this specific Oracle error code and returns a `409 Conflict` HTTP response instead of a 500 error.

**Q: What does `SELECT 1 FROM dual` mean?**
`dual` is a special one-row, one-column table that Oracle provides. `SELECT 1 FROM dual` is the standard Oracle way to run a no-op query to test connectivity (like `SELECT 1` in PostgreSQL).

**Q: Why `NUMBER(1)` for booleans?**
Oracle does not have a native `BOOLEAN` data type in SQL (it exists in PL/SQL but not in regular table columns). The convention is `NUMBER(1)` with a `CHECK (col IN (0,1))` constraint where 1 = true, 0 = false. Our code treats it as a JavaScript boolean when returned.

**Q: How does the sync conflict work exactly?**
```
1. Frontend generates UUID: "abc-123" before sending
2. POST /transactions { clientTxnId: "abc-123", ... }
3. Server inserts into Oracle → success → responds 201
4. Network drops before client receives 201
5. Client retries: POST /transactions { clientTxnId: "abc-123", ... }
6. Oracle: INSERT ... — raises ORA-00001 (client_txn_id UNIQUE violated)
7. Backend catches ORA-00001 → finds existing row by clientTxnId → returns it as 200
8. Client gets the response, removes from sync queue — done, no duplicate
```

**Q: How does the `low_stock_threshold` alert work?**
```sql
-- In analytics repository:
SELECT p.id, p.name, vs.current_qty, p.low_stock_threshold
FROM   products p
JOIN   v_product_stock vs ON vs.product_id = p.id
WHERE  p.is_active = 1
  AND  vs.current_qty <= p.low_stock_threshold
ORDER BY vs.current_qty ASC;
```

**Q: How do I seed dummy test data?**
```bash
npm run db:seed:dummy
```
This runs `src/db/seeds/seed-dummy-data.js` which inserts sample products and transactions.

---

## 8. API Reference

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
| PATCH | `/auth/password` | Any | Change own password (forces logout). |

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
| GET | `/products?search=&limit=&offset=` | Any | List products with current stock from `v_product_stock` |
| GET | `/products/:id` | Any | Single product |
| GET | `/products/barcode/:barcode` | Any | Lookup by barcode (for scanner) |
| POST | `/products` | Any | Create product |
| PATCH | `/products/:id` | Any | Partial update |
| DELETE | `/products/:id` | ADMIN | Soft delete (sets `is_active=0`) |

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
  "lowStockThreshold": 10,
  "expiryDate": "2026-12-31"
}
```

---

### Transaction Endpoints

| Method | URL | Auth | Description |
|---|---|---|---|
| POST | `/transactions` | Any | Record a stock IN or sale OUT (idempotent) |
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

**Response:**
```json
{ "status": "ok", "db": "connected" }
```

---

## 9. Middleware System

Middlewares run in order for every request. Think of them as a chain of guards.

```
Request
  │
  ▼
logRequest()      ← Log method, URL, status, duration (custom — no morgan)
setHeaders()      ← CORS + security headers (custom — no cors/helmet)
parseBody()       ← Stream and parse JSON body (custom — no express.json)
  │
  ▼
Router (matches URL by pre-compiled RegExp)
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
export const authGuard = (req, res, next) => {
  const header = req.headers.authorization;   // "Bearer eyJ..."
  if (!header?.startsWith('Bearer ')) throw AppError.unauthorized('No token');

  const token = header.slice(7);              // remove "Bearer "
  const payload = verifyToken(token);         // throws if invalid/expired
  req.user = { id: payload.sub, role: payload.role, email: payload.email };
  next();
};
```

### `validate(schema)` — Zod validation middleware

```js
// Usage in route files:
router.post('/products', authGuard, validate(createProductSchema), controller.create);

// If body doesn't match schema → throws ZodError
// errorHandler catches it → sends 400 BAD_REQUEST with field details:
// { "error": { "code": "BAD_REQUEST", "details": { "sku": "Required" } } }
```

### `errorHandler` — What errors get caught

| Error type | Response |
|---|---|
| `ZodError` | 400 BAD_REQUEST with field-level details |
| `AppError` (operational) | Its own `statusCode` and `code` |
| Oracle `ORA-00001` | 409 CONFLICT |
| Unknown error (bug) | 500 INTERNAL_ERROR (stack hidden in prod) |

---

## 10. Module Breakdown

### Auth Module (`/auth`)

**Complete:**
- ✅ Login (email + password → JWT)
- ✅ Register (ADMIN only — creates STAFF or ADMIN)
- ✅ Get current user (`/me`)
- ✅ Change password (`PATCH /auth/password`)
- ✅ Password hashed with bcryptjs (10 rounds)
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
  → sendSuccess(res, { token, user })
```

---

### Products Module (`/products`)

**Complete:**
- ✅ List products (paginated, with search, current stock from `v_product_stock`)
- ✅ Get by ID
- ✅ Get by barcode (for scanner)
- ✅ Create product (Zod validation)
- ✅ Update product (partial PATCH)
- ✅ Soft delete (ADMIN only)
- ✅ Low stock threshold per product

---

### Transactions Module (`/transactions`)

**Complete:**
- ✅ Record IN (stock received from supplier)
- ✅ Record OUT (sale to customer)
- ✅ Idempotent via `client_txn_id` UNIQUE constraint
- ✅ Filter by type, productId, date range
- ✅ Supports `occurredAt` (offline timestamp from client)

---

### Analytics Module (`/analytics`)

**Complete:**
- ✅ Dashboard counts (active products, low stock count, expiring soon, expired)
- ✅ 7-day sales chart data (revenue + units per day using `occurred_at`)
- ✅ Expiring products list (within 7 days)
- ✅ Low-stock products list (below threshold)

**Potential additions:**
- 📋 Profit margin per product (`sell_price - cost_price`)
- 📋 Top-selling products (ORDER BY SUM(quantity) DESC)
- 📋 Monthly revenue trend

---

### Health Module (`/health`)

- ✅ Returns `{ status: "ok", db: "connected" | "disabled" }`
- Checks `isDbReady()` from `database.js`

---

## 11. Docker — Production Only

> Docker is **not required** for local development. Oracle runs locally (native install). Docker Compose is for deploying the full production stack.

### The `Dockerfile` (backend)

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src/ ./src/

EXPOSE 5000

CMD ["node", "src/server.js"]
```

**Why `COPY package*.json` before `COPY src/`?**
Docker builds in layers. If `src/` changes but `package.json` doesn't, it reuses the cached `npm install` layer — much faster rebuilds.

### The `docker-compose.yml` (production)

```yaml
services:
  oracle:
    image: gvenzl/oracle-xe:21-slim
    environment:
      ORACLE_PASSWORD: oracle
      APP_USER: bazar_user
      APP_USER_PASSWORD: bazar_pass
    ports:
      - "1521:1521"
    healthcheck:
      test: ["CMD", "healthcheck.sh"]
      interval: 30s
      retries: 10
    volumes:
      - oracle-data:/opt/oracle/oradata

  backend:
    build: ./backend
    depends_on:
      oracle:
        condition: service_healthy
    environment:
      NODE_ENV: production
      PORT: 5000
      ORACLE_ENABLED: "true"
      ORACLE_USER: bazar_user
      ORACLE_PASSWORD: bazar_pass
      ORACLE_CONNECT_STRING: oracle:1521/XEPDB1   # "oracle" = service name
    ports:
      - "5000:5000"

  frontend:
    build: ./frontend
    depends_on:
      - backend
    ports:
      - "8080:80"

volumes:
  oracle-data:
```

**Key:** Inside Docker Compose, `ORACLE_CONNECT_STRING` uses the **service name** (`oracle`) instead of `localhost`, because containers communicate by service name on Docker's internal network.

---

## 12. Running the Project

### Option A: Local Development (No Docker)

```bash
# 1. Make sure Oracle XE 21c is installed and running locally
# 2. Create the bazar_user schema (see Section 7.4 above)

# 3. Set up backend:
cd backend
cp .env.example .env
# Edit .env: set ORACLE_ENABLED=true and fill in your credentials

npm install
npm run db:migrate       # Creates all tables and views
npm run db:seed:admin    # Creates the admin user
npm run dev              # Starts server with --watch (auto-reload)

# API: http://localhost:5000/api/v1/health
```

### Option B: Full Production Stack (Docker)

```bash
# From the project root:
docker compose up -d --build

# First boot only (Oracle takes ~5 minutes to initialize):
docker compose exec backend npm run db:migrate
docker compose exec backend npm run db:seed:admin

# Verify:
curl http://localhost:5000/api/v1/health
# Frontend: http://localhost:8080
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
| `npm run dev` | Start with `node --watch` (auto-restart on file change, no nodemon) |
| `npm start` | Start without watch (production) |
| `npm test` | Run all `.test.js` files with Node's built-in test runner |
| `npm run db:migrate` | Run SQL migration files in order |
| `npm run db:seed:admin` | Create the first admin user |
| `npm run db:seed:dummy` | Insert sample products and transactions for testing |

---

## 13. What's Complete vs. What's Missing

### ✅ Fully Complete
- Custom Node.js `http` server with hand-built router, middleware pipeline, CORS, body parser
- Environment validation (Zod)
- Oracle connection pool (Thin mode) with graceful shutdown
- Winston logging (pretty dev / JSON prod)
- JWT authentication (login, register, /me, change password)
- Role-based access control (ADMIN / STAFF)
- Global error handler (Zod errors, Oracle ORA-00001, AppError, unknown errors)
- Products CRUD (create, read, update, soft delete, barcode lookup, low stock threshold)
- Transactions (IN/OUT, idempotent, offline-ready with `clientTxnId`, `occurredAt`)
- Analytics dashboard endpoint (counts, 7-day sales, expiry, low-stock)
- Health check endpoint
- Database migrations (5 SQL files + migration tracking table)
- Admin seed script

### 📋 Suggested Additions

| Feature | Endpoint | Priority |
|---|---|---|
| Profit analytics (margin per product) | `GET /analytics/profit` | High |
| Top-selling products | `GET /analytics/top-products` | High |
| Transaction history per product | `GET /products/:id/transactions` | Medium |
| Monthly summary | `GET /analytics/monthly?month=2026-04` | Medium |
| Bulk stock-in (CSV import) | `POST /products/import` | Low |
| Soft-delete restore | `PATCH /products/:id/restore` | Low |

---

## 14. Coding Rules (Strict)

```js
// ✅ async/await ONLY — no callbacks, no .then()
const user = await authRepository.findByEmail(email);

// ✅ ES Modules — import/export only, no require()
import { withConnection } from '../../config/database.js';
export function login() { ... }

// ✅ Thin controllers — no logic, just orchestrate
export const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);  // all logic in service
  sendSuccess(res, result);
});

// ✅ Always use withConnection — never leave connections open
export async function findById(id) {
  return withConnection(async (conn) => {
    const result = await conn.execute(
      'SELECT * FROM users WHERE id = :id',
      { id },
    );
    return result.rows[0] ?? null;
  });
}

// ✅ Parameterized queries ALWAYS — never string concatenation
await conn.execute(
  `SELECT * FROM users WHERE email = :email`,
  { email }   // ← bind variables prevent SQL injection
);

// ✅ Naming conventions
const userId = 1;              // camelCase for variables and functions
class AppError { ... }         // PascalCase for classes
// auth-guard.js               // kebab-case for file names

// ✅ Zod for all request validation
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// ✅ AppError for known errors
throw AppError.notFound('Product not found');
throw AppError.conflict('Email already registered');
throw AppError.unauthorized('Invalid credentials');

// ✅ Never import repositories in controllers
// ✅ Never write SQL in services
// ✅ Never write business logic in controllers
```
