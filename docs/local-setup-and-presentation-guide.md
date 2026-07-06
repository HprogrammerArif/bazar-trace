# 🎓 Bazar-Trace — Local Setup & Backend Presentation Guide

This guide is designed for your university presentation. It explains how to run Oracle Database locally on Windows without Docker, how to maintain a dual setup (Docker & local), and contains a complete, step-by-step breakdown of how the zero-dependency Node.js native `node:http` backend functions.

---

## 📋 Table of Contents
1. [Installing Oracle Database Locally (Windows)](#1-installing-oracle-database-locally-windows)
2. [Dual Setup: Docker vs. Local Database](#2-dual-setup-docker-vs-local-database)
3. [Zero-Dependency Native Backend Architecture](#3-zero-dependency-native-backend-architecture)
4. [Step-by-Step Request-Response Flow (For Presentation)](#4-step-by-step-request-response-flow-for-presentation)


### Step 2: Configure the Database User & Permissions
To connect the backend, you must create the user schema matching your `.env` settings.
1. Open Command Prompt on Windows.
2. Connect to the administrative container using SQL*Plus:
   ```cmd
   sqlplus sys as sysdba
   ```
   *(When prompted, enter the password you set during installation)*
3. Switch the session to the Pluggable Database:
   ```sql
   ALTER SESSION SET CONTAINER = XEPDB1;
   ```
4. Create the application user (matching your `.env` credentials):
   ```sql
   CREATE USER bazar_user IDENTIFIED BY bazar_pass;
   ```
5. Grant necessary privileges to the user:
   ```sql
   GRANT CONNECT, RESOURCE, DBA TO bazar_user;
   ```
6. Exit SQL*Plus:
   ```sql
   EXIT;
   ```

   DROP USER bazar_user CASCADE;

---

## 2. Dual Setup: Docker vs. Local Database

You can easily switch back and forth between running your database inside Docker and running it locally on your Windows host. This is done entirely by editing your environment file (`backend/.env`).

### Scenario A: Running Locally (For University Presentation)
Use this setup when demonstrating the project directly on a host machine without Docker.

1. Ensure your local Windows Oracle Database service is running.
2. Edit [backend/.env](file:///c:/Users/workm/Desktop/UN/bazar-trace/backend/.env):
   ```ini
   ORACLE_ENABLED=true
   ORACLE_USER=bazar_user
   ORACLE_PASSWORD=bazar_pass
   # Connects to localhost on the standard port 1521
   ORACLE_CONNECT_STRING=localhost:1521/XEPDB1
   ```
3. Run the migrations to set up the schema, seed the admin account, and start the server:
   ```bash
   cd backend
   npm run db:migrate
   npm run db:seed:admin
   npm run dev
   ```

### Scenario B: Running in Docker (Development Mode)
Use this setup when you want to run everything isolated inside containers.

1. Stop any local Windows Oracle services that bind to port `1521` (to prevent conflicts).
2. Launch the docker-compose environment:
   ```bash
   docker compose up -d --build
   ```
3. Docker Compose automatically overrides the connection string environment variable to point to the virtual container network host:
   ```yaml
   ORACLE_CONNECT_STRING: oracle:1521/XEPDB1
   ```

---


## 4. Step-by-Step Request-Response Flow (For Presentation)

When the frontend calls `GET http://localhost:5000/api/v1/products/21` with `Authorization: Bearer <token>`, the request progresses through the layers in this order:

```
  HTTP Client Request
         ↓
  [ http.createServer ]   ← app.js catches socket request
         ↓
  [ Global Middlewares ]  ← logRequest, setHeaders, parseBody
         ↓
  [ Router Registry ]     ← Match regex: ^/api/v1/products/([^/]+)$ (sets req.params.id = '21')
         ↓
  [ Route Middlewares ]   ← authGuard (checks token) -> validate (Zod parameter validations)
         ↓
  [ Controller Layer ]    ← product.controller.js reads input parameters
         ↓
  [ Service Layer ]       ← product.service.js validates business rules
         ↓
  [ Repository Layer ]    ← product.repository.js queries Oracle DB
         ↓
  [ Response Utility ]    ← response.js gzips JSON data and sends it over socket
```

### 1. HTTP Server Hook (`app.js`)
The request hits `http.createServer()`. The server injects standard Express-compatible helper methods (like `res.status`) and parses the request URL parameters into `req.query`, `req.path`, and `req.originalUrl`.

### 2. Global Middlewares
* **`logRequest`**: Measures processing time and logs HTTP actions.
* **`setHeaders`**: Writes standard CORS origins and Helmet-equivalent security headers (`X-Frame-Options`, `X-Content-Type-Options`). If the request is an `OPTIONS` flight pre-check, it writes `204 No Content` and exits.
* **`parseBody`**: Streams incoming chunks for any `POST`/`PATCH` payload and populates `req.body`.

### 3. Route Matcher
The compiled router list checks for a match. It matches `GET` against `/api/v1/products/:id` using its compiled regex pattern:
```javascript
/^\/api\/v1\/products\/([^/]+)$/
```
It extracts `21` from the path and sets `req.params.id = '21'`.

### 4. Route-Level Validation Pipeline
The router runs the matched route's handlers sequentially:
* **`authGuard`**: Reads the JWT token from the `Authorization` header, decrypts it, and registers `req.user`. If invalid, it immediately halts and triggers the `errorHandler`.
* **`validate`**: Validates the schema using Zod to ensure the parameters are correctly typed before letting execution touch the business database.

### 5. Controller ([product.controller.js](file:///c:/Users/workm/Desktop/UN/bazar-trace/backend/src/modules/products/product.controller.js))
The controller handles the HTTP context. It extracts the sanitized parameter (`req.params.id`) and forwards it to the service layer:
```javascript
const product = await productService.get(req.params.id);
```

### 6. Service ([product.service.js](file:///c:/Users/workm/Desktop/UN/bazar-trace/backend/src/modules/products/product.service.js))
Contains core business rules. If a product does not exist, it throws `AppError.notFound('Product not found')` to safely trigger the global error handler. If valid, it queries the Repository.

### 7. Repository ([product.repository.js](file:///c:/Users/workm/Desktop/UN/bazar-trace/backend/src/modules/products/product.repository.js))
Executes queries against Oracle DB. It requests a connection from the pool, runs a parameterized SQL query:
```sql
SELECT * FROM products WHERE id = :id
```
*(Binds `:id` dynamically to prevent SQL Injection)*. It maps the resulting DB rows into a Javascript object, and releases the connection in a `finally` block to prevent leaks.

### 8. Response Generation ([response.js](file:///c:/Users/workm/Desktop/UN/bazar-trace/backend/src/utils/response.js))
The database object climbs back up to the controller, which runs `ok(res, product)`. The utility stringifies the product object, compresses it using `node:zlib`'s Gzip, sets `Content-Encoding: gzip`, and sends it to the frontend.
