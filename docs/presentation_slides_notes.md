# Bazar-Trace — Presentation Slide Notes & Project Summary

This document contains a structured slide-by-slide guide and comprehensive project summary to help you present **Bazar-Trace** to your university professors during your viva/defense.

---

## 📊 Presentation Slides Outline

### Slide 1: Project Overview & Objectives
*   **Slide Title:** Bazar-Trace: Offline-First PWA Stock Management System
*   **Bullet Points:**
    *   **Objective:** Provide a fast, lightweight, and offline-resilient inventory and sales logging system for micro-retail shops.
    *   **Target User:** Shop cashiers and inventory keepers in connectivity-unstable areas.
    *   **Core Pillars:** Relational data integrity, high-performance offline operations, and zero heavy library dependencies.
*   **Speaker Notes:**
    > "Good morning, professors. Today I am presenting Bazar-Trace, a stock management system engineered specifically for businesses operating in regions with unstable or slow internet connectivity. The primary objective is to allow cashiers to record transactions and perform inventory lookups with zero lag, ensuring that data is safely preserved locally and synchronized to the main servers automatically upon reconnection."

---

### Slide 2: Academic & Architectural Constraints
*   **Slide Title:** Strict Architectural Constraints
*   **Bullet Points:**
    *   **Frontend Constraints:** Only raw code allowed — No React, No Next.js, No Vue, No Tailwind CSS, No NPM component packages.
    *   **Frontend Technologies:** Pure HTML5, Vanilla CSS (CSS variables design system), and raw ES6 JavaScript Modules.
    *   **Backend Stack:** Node.js (ESM, `--watch` mode), **zero external HTTP framework** — custom built-in `http` server, and Oracle Database.
    *   **No Express.js:** All routing, middleware, CORS, body parsing, and request logging are implemented from scratch using only Node.js core APIs.
*   **Speaker Notes:**
    > "Our university enforces strict coding constraints to test our core understanding of web technologies. As a result, no frontend frameworks or pre-processors were used. On the backend, we took this even further — we removed Express.js entirely. The server is built directly on Node.js's built-in `http` module. We wrote our own middleware pipeline, custom router, body parser, CORS handler, and HTTP request logger — all without any third-party HTTP framework. This demonstrates a deep, ground-level understanding of how web servers actually work."

---

### Slide 3: Custom HTTP Server & Router (No Express)
*   **Slide Title:** Hand-Built HTTP Server — Zero Framework Dependencies
*   **Bullet Points:**
    *   **Built-in `http` Module:** `http.createServer()` handles all incoming connections directly.
    *   **Custom Router Class:** Registers routes by method and path pattern; compiles path parameters (e.g. `:id`) into RegExp at startup for fast matching.
    *   **Custom Middleware Pipeline:** `logRequest` (HTTP logger), `setHeaders` (CORS + security headers), `parseBody` (JSON/form body parser) — all written in pure Node.js, no `cors`, `helmet`, or `morgan` packages.
    *   **`next(err)` Error Pattern:** Implements the familiar Express-style error-propagation chain without importing Express.
    *   **Native `--watch` Flag:** Uses Node.js 18+ built-in file watcher instead of `nodemon`.
*   **Speaker Notes:**
    > "This slide highlights the most technically ambitious decision in this project: we eliminated Express.js entirely. The custom `Router` class pre-compiles route path patterns into Regular Expressions at server startup — exactly how Express does it internally. The middleware pipeline chains functions sequentially, catching errors with a `next(err)` pattern. Each middleware is a pure function operating directly on the native `IncomingMessage` and `ServerResponse` objects. Writing this from scratch proves that we fully understand what frameworks like Express abstract away."

---

### Slide 4: Oracle Database — Local Installation (Thin Mode)
*   **Slide Title:** Oracle DB — Local Native Connection, No Docker Required
*   **Bullet Points:**
    *   **Oracle XE 21c+** installed and running directly on the local machine — no Docker Oracle container needed for development.
    *   **Thin Mode Driver:** `oracledb` v6 Thin mode connects via `localhost:1521/XEPDB1` with **zero Oracle Instant Client installation** required.
    *   **`ORACLE_ENABLED` Flag:** Developers can run and test the full API without a database by setting `ORACLE_ENABLED=false` in `.env`.
    *   **Key Entities:** `users`, `products` (low-stock thresholds, expiry dates), and `transactions` (IN/OUT types, prices, idempotency key).
    *   **Programmatic Migrations:** Sequential SQL migration script runner (`npm run db:migrate`).
*   **Speaker Notes:**
    > "For the database, we use Oracle XE 21c installed natively on the developer's machine. We chose the `oracledb` v6 Thin mode driver, which can connect to Oracle using a simple host:port/service_name string — no Oracle Instant Client libraries needed. This makes the development setup much lighter and faster. The `ORACLE_ENABLED` environment flag also allows the entire API to boot and respond to non-database requests even without a live database, which was very useful for early development and testing."

---

### Slide 5: Oracle Schema & Idempotency Design
*   **Slide Title:** Database Schema & Relational Integrity
*   **Bullet Points:**
    *   **Relational Engine:** Oracle DB with strict foreign keys, constraint checks, and database-level defaults.
    *   **Idempotency Key:** `client_txn_id` UNIQUE constraint on the transactions table prevents duplicate sync replays.
    *   **ORA-00001 Conflict Handling:** Backend intercepts Oracle's unique constraint violation and returns a clean `409 Conflict` to the client.
    *   **Seed Scripts:** `npm run db:seed:admin` initializes the first admin without manual SQL*Plus input.
*   **Speaker Notes:**
    > "Relational integrity is strictly enforced with foreign keys, constraint checks, and database-level defaults. One critical schema choice is the `client_txn_id` column in the transactions table. By assigning a UUID on the client side before sending the request, we prevent duplicate records in case of network retries during synchronization — a technique known as idempotent transactions. When Oracle rejects a duplicate with error `ORA-00001`, our backend cleanly translates that into a 409 HTTP response instead of crashing."

---

### Slide 6: Backend Separation of Concerns (Clean Architecture)
*   **Slide Title:** Controller → Service → Repository Pattern
*   **Bullet Points:**
    *   **Repository Layer:** All SQL statements isolated here; only this layer directly references the Oracle connection pool.
    *   **Service Layer:** Core business logic — inventory subtraction warnings, profit margins, cost calculations.
    *   **Controller Layer:** Orchestrates HTTP request parsing, delegates to services, and formats responses.
    *   **Validation Middleware:** Zod schema checks executing before controller logic — invalid payloads are rejected early.
*   **Speaker Notes:**
    > "To keep the backend codebase maintainable at scale, I implemented a clean three-tiered architecture. The Controllers handle HTTP requests and validate inputs using Zod. The Service layer executes business rules, such as stock level updates and analytics checks. The Repository layer handles all SQL execution, isolating Oracle database-specific queries from the rest of the application. This structure works the same way whether you use Express or a custom server — the framework is just the outermost shell."

---

### Slide 7: Frontend Single Page Application (SPA) Engine
*   **Slide Title:** SPA Routing & Lazy Loading Modules
*   **Bullet Points:**
    *   **Custom Router:** Built from scratch using RegExp matching on hash changes (`window.addEventListener('hashchange')`).
    *   **Dynamic Module Loading:** Lazy-loads page controllers (`import()`) in real-time, reducing initial loading sizes.
    *   **Query String Parser:** Splits hash path variables (e.g. `#/record?barcode=X`) and passes query parameters to views.
*   **Speaker Notes:**
    > "Since frameworks like React Router are not allowed, I designed a custom client-side router. It listens to window hash changes and parses them against registered Regular Expressions. To keep the app bundle small and fast, the router lazy-loads the page components dynamically only when the user navigates to them, passing dynamic parameters and query strings to the render methods."

---

### Slide 8: The Sync Engine (IndexedDB Offline Cache)
*   **Slide Title:** Offline-First Data Strategy
*   **Bullet Points:**
    *   **Local Client Caching:** Promise-based wrapper around IndexedDB API (`idb.js`) caching products, transactions, and queues.
    *   **Network Interceptor:** Fetch client intercepts disconnections (`TypeError` catches).
    *   **Optimistic Success UI:** Returns simulated successes to forms while caching payloads in the `sync_queue` locally.
*   **Speaker Notes:**
    > "This slide illustrates the core offline-first sync engine. When the cashier loads the application, the product catalog is cached in IndexedDB. If the network drops, the API client intercepts the error. Instead of crashing, it writes the transaction to a local `sync_queue` store and returns an optimistic success status to the UI, allowing the cashier to proceed without interruptions."

---

### Slide 9: FIFO Sync Queue & Conflict Resolution
*   **Slide Title:** Automatic Synchronization & Idempotency
*   **Bullet Points:**
    *   **Network Event Listeners:** Monitors `online` and `offline` window states.
    *   **FIFO Replay:** Replays queued operations sequentially to preserve logical date-ordering.
    *   **Conflict Resolution:** Intercepts Oracle UNIQUE conflicts (`ORA-00001` or 409 status codes) and cleans queues safely.
*   **Speaker Notes:**
    > "When connectivity is restored, the `SyncManager` is notified. It reads queued transactions and replays them in First-In-First-Out order to maintain date consistency. If a transaction was partially uploaded before the network failed, Oracle's UNIQUE constraint rejects the duplicate insert (`ORA-00001`). The backend returns a conflict code, which our sync manager catches, removing the duplicate from the local queue safely without blocking the rest of the items."

---

### Slide 10: Progressive Web App (PWA) Capabilities
*   **Slide Title:** App Shell Caching & Service Workers
*   **Bullet Points:**
    *   **Service Worker:** Intercepts all browser GET fetch events.
    *   **Static Asset Strategy:** *Stale-While-Revalidate* — loads UI layouts, styles, and scripts instantly from cache.
    *   **API Strategy:** *Network-First* fallback to cache — metrics are shown even when completely disconnected.
*   **Speaker Notes:**
    > "To make the application installable like a native app, I configured PWA support. The Service Worker pre-caches all critical assets. When the app is opened, it loads static assets instantly from the cache using a Stale-While-Revalidate strategy. For API requests, it uses a Network-First strategy, ensuring that the cashier sees the latest data when online, but falls back to cached statistics when offline."

---

### Slide 11: Custom Charts & Native Barcode Scanning
*   **Slide Title:** Zero-Library Visuals & Hardware Integration
*   **Bullet Points:**
    *   **Custom Charts:** 7-Day sales bar chart drawn from scratch using the HTML5 Canvas 2D Context, scaled by High-DPI ratios.
    *   **Native Scanner:** Real-time decoding of UPC/EAN codes from camera feed via native browser `BarcodeDetector` API.
    *   **Web Audio API:** Generates synthesized auditory beep signals on successful scans.
*   **Speaker Notes:**
    > "We avoided heavy chart libraries by writing our own drawing logic using the HTML5 Canvas API, scaling the context by the device pixel ratio for crystal-clear visuals. For barcode scanning, we use the native Web Barcode Detector API to scan barcodes directly from the camera feed via getUserMedia. Upon a successful scan, a beep sound is dynamically synthesized using the Web Audio API, and the product is instantly selected on the form."

---

### Slide 12: Security & Admin Settings
*   **Slide Title:** Access Controls & Account Toggles
*   **Bullet Points:**
    *   **Password Security:** Encrypted with bcrypt hashes at rest, updated via PATCH authentication routes.
    *   **JWT Authentication:** Stateless token-based auth — all protected routes verify the Bearer token before processing.
    *   **Staff Directory (ADMIN only):** List registered shop users and control active states.
    *   **Self-Lockout Protection:** Disables toggle switches for the active administrator account.
*   **Speaker Notes:**
    > "Security is handled via JWT token authentication and role-based access. All users can change their password securely, which forces a logout on success. Administrators are provided with a dedicated Staff Directory where they can register new cashier profiles and toggle account status. To prevent administrative accidents, administrators are restricted from deactivating their own accounts."

---

### Slide 13: Summary of Key Achievements
*   **Slide Title:** Summary & Key Takeaways
*   **Bullet Points:**
    *   **No Frameworks, No Shortcuts:** Custom HTTP server, custom router, custom middleware — built entirely on Node.js core APIs.
    *   **Oracle Native (Thin Mode):** Zero Oracle Instant Client needed — connects directly via `oracledb` v6 Thin driver at `localhost:1521/XEPDB1`.
    *   **100% Offline-First:** Transaction logging and local list caches work in completely disconnected modes.
    *   **Clean Architecture:** MVC separation, Zod validation, and relational database constraints throughout.
*   **Speaker Notes:**
    > "In summary, Bazar-Trace meets all academic constraints while implementing advanced production-ready features. We went beyond the requirements by removing Express.js entirely and replacing it with a hand-built HTTP server and router — demonstrating that we understand web frameworks at a fundamental level, not just how to use them. Oracle runs natively in Thin mode, making the development environment lightweight and dependency-free. Thank you, professors. I am now open to your questions."

---

## 🛠️ Frequently Asked Questions (Viva / Defense Prep)

### Q1: Why did you remove Express.js?
*   **Answer:** Express.js is a high-level abstraction over Node.js's built-in `http` module. By removing it and building the router, middleware pipeline, body parser, CORS handler, and logger from scratch, we demonstrate a ground-level understanding of how HTTP servers work — how request/response objects flow, how middleware chains propagate with `next()`, and how route patterns are matched using Regular Expressions. This is a stronger academic proof of skill than simply calling `app.use()`.

### Q2: Why is Oracle running locally instead of Docker?
*   **Answer:** During development, running Oracle natively on the local machine is faster to start and simpler to maintain than spinning up a Docker container. The `oracledb` v6 Thin mode driver allows us to connect without installing Oracle Instant Client, using just a `host:port/service_name` connection string (`localhost:1521/XEPDB1`). This reduces setup friction significantly. Docker Compose is still available for deploying the full production stack.

### Q3: What is `oracledb` Thin mode and why does it matter?
*   **Answer:** Traditional Oracle drivers require a separately installed Oracle Instant Client (a large native library). Thin mode is a pure-JavaScript implementation of the Oracle wire protocol built into `oracledb` v6+. It connects to Oracle using only the npm package — no additional system-level installation needed. This makes the backend portable across any developer's machine without environment setup issues.

### Q4: Why did you choose IndexedDB instead of LocalStorage for caching?
*   **Answer:** LocalStorage is synchronous, blocking the main thread, and has a strict size limit of ~5MB. IndexedDB is asynchronous, non-blocking, and supports storing large amounts of structured data (e.g. hundreds of products and transactions) with native query and index support.

### Q5: What happens if two cashiers register sales offline with the same product?
*   **Answer:** Both transactions are saved locally with unique client-side UUIDs. When both cashiers reconnect, their sync queues drain sequentially. The database handles each insert independently. The backend subtracts stock based on when the transactions are received.

### Q6: Why is the `client_txn_id` so important for the sync engine?
*   **Answer:** If a network connection drops *after* the backend records the transaction but *before* the client receives the success response, the client will attempt to resend the transaction on reconnect. Without a unique client-side identifier, the backend would insert the same transaction twice. The `client_txn_id` UNIQUE constraint ensures that Oracle rejects the second insert with `ORA-00001`, maintaining transactional accuracy. The backend catches this error and returns a clean 409 response.
