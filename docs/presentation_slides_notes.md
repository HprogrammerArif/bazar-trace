# Bazar-Trace — Presentation Slide Notes & Project Summary

This document contains a structured slide-by-slide guide and comprehensive project summary to help you present **Bazar-Trace** to your university professors during your viva/defense.

---

## 📊 Presentation Slides Outline

### Slide 1: Project Overview & Objectives
*   **Slide Title:** Bazar-Trace: Offline-First PWA Stock Management System
*   **Bullet Points:**
    *   **Objective:** Provide a fast, lightweight, and offline-resilient inventory and sales logging system for micro-retail shops.
    *   **Target User:** Shop cashiers and inventory keepers in connectivity-unstable areas.
    *   **Core Core Pillars:** Relational data integrity, high-performance offline operations, and zero heavy library dependencies.
*   **Speaker Notes:**
    > "Good morning, professors. Today I am presenting Bazar-Trace, a stock management system engineered specifically for businesses operating in regions with unstable or slow internet connectivity. The primary objective is to allow cashiers to record transactions and perform inventory lookups with zero lag, ensuring that data is safely preserved locally and synchronized to the main servers automatically upon reconnection."

---

### Slide 2: Academic & Architectural Constraints
*   **Slide Title:** Strict Architectural Constraints
*   **Bullet Points:**
    *   **Frontend Constraints:** Only raw code allowed — No React, No Next.js, No Vue, No Tailwind CSS, No NPM component packages.
    *   **Frontend Technologies:** Pure HTML5, Vanilla CSS (CSS variables design system), and raw ES6 JavaScript Modules.
    *   **Backend Stack:** Node.js, Express.js (MVC separation), and Oracle Database.
    *   **Deployment:** Containerized environment using Docker and Docker Compose.
*   **Speaker Notes:**
    > "Our university enforces strict coding constraints to test our core understanding of web technologies. As a result, no frontend frameworks or pre-processors were used. The client-side is built entirely using raw JavaScript ES Modules and custom CSS variables, while the backend leverages Express.js connected to an Oracle Database. The entire application is containerized using Docker, making it portable and easy to run on any machine."

---

### Slide 3: Oracle Database & Migrations Design
*   **Slide Title:** Database Schema & Relational Integrity
*   **Bullet Points:**
    *   **Relational Engine:** Oracle DB containerized using official images.
    *   **Key Entities:** `users`, `products` (low-stock thresholds, expiry dates), and `transactions` (IN/OUT types, prices, and references).
    *   **Idempotency Key:** `client_txn_id` UNIQUE constraint on the transactions table.
    *   **Database Migrations:** Programmatic script runner executing SQL files sequentially.
*   **Speaker Notes:**
    > "For storage, we use an Oracle Database. Relational integrity is strictly enforced with foreign keys, constraint checks, and database-level defaults. One critical schema choice is the `client_txn_id` columns in the transactions table. By assigning a UUID on the client side, we prevent duplicate records in case of network retries during synchronization — a technique known as idempotent transactions."

---

### Slide 4: Backend Separation of Concerns (MVC)
*   **Slide Title:** Clean Controller-Service-Repository Pattern
*   **Bullet Points:**
    *   **Repository Layer:** Isolated SQL statements; only this layer directly references connections.
    *   **Service Layer:** Houses core business logic (e.g. inventory subtraction warnings, profit margins, cost calculations).
    *   **Controller Layer:** Orchestrates HTTP requests, parses headers, and delegates actions.
    *   **Validation Middleware:** Zod schema checks executing before controller logic.
*   **Speaker Notes:**
    > "To keep the backend codebase maintainable, I implemented a clean three-tiered MVC architecture. The Controllers handle HTTP requests and inputs validation using Zod. The Service layer executes business rules, such as stock level updates and analytics checks. The Repository layer handles all SQL execution, isolating Oracle database-specific queries from the rest of the application."

---

### Slide 5: Frontend Single Page Application (SPA) Engine
*   **Slide Title:** SPA Routing & Lazy Loading Modules
*   **Bullet Points:**
    *   **Custom Router:** Built from scratch using RegExp matching on hash changes (`window.addEventListener('hashchange')`).
    *   **Dynamic Module Bundling:** Lazy-loads page controllers (`import()`) in real-time, reducing initial loading sizes.
    *   **Query String Parser:** Splits hash path variables (e.g. `#/record?barcode=X`) and passes query parameters to views.
*   **Speaker Notes:**
    > "Since frameworks like React Router are not allowed, I designed a custom client-side router. It listens to window hash changes and parses them against registered Regular Expressions. To keep the app bundle small and fast, the router lazy-loads the page components dynamically only when the user navigates to them, passing dynamic parameters and query strings to the render methods."

---

### Slide 6: The Sync Engine (IndexedDB Offline Cache)
*   **Slide Title:** Offline-First Data Strategy
*   **Bullet Points:**
    *   **Local Client Caching:** Promise-based wrapper around IndexedDB API (`idb.js`) caching products, transactions, and queues.
    *   **Network Interceptor:** Fetch client intercepts disconnections (`TypeError` catches).
    *   **Optimistic Success UI:** Returns simulated successes to forms while caching payloads in the `sync_queue` locally.
*   **Speaker Notes:**
    > "This slide illustrates the core offline-first sync engine. When the cashier loads the application, the product catalog is cached in IndexedDB. If the network drops, the API client intercepts the error. Instead of crashing, it writes the transaction to a local `sync_queue` store and returns an optimistic success status to the UI, allowing the cashier to proceed without interruptions."

---

### Slide 7: FIFO Sync Queue & Conflict Resolution
*   **Slide Title:** Automatic Synchronization & Idempotency
*   **Bullet Points:**
    *   **Network Event Listeners:** Monitors `online` and `offline` window states.
    *   **FIFO Replay:** Replays queued operations sequentially to preserve logical date-ordering.
    *   **Conflict Resolution:** Intercepts Oracle UNIQUE conflicts (`ORA-00001` or 409 status codes) and cleans queues safely.
*   **Speaker Notes:**
    > "When connectivity is restored, the `SyncManager` is notified. It reads queued transactions and replays them in First-In-First-Out order to maintain date consistency. If a transaction was partially uploaded before the network failed, Oracle's UNIQUE constraint rejects the duplicate insert (`ORA-00001`). The backend returns a conflict code, which our sync manager catches, removing the duplicate from the local queue safely without blocking the rest of the items."

---

### Slide 8: Progressive Web App (PWA) Capabilities
*   **Slide Title:** App Shell Caching & Service Workers
*   **Bullet Points:**
    *   **Service Worker:** Intercepts all browser GET fetch events.
    *   **Static Asset Strategy:** *Stale-While-Revalidate* to load UI layouts, styles, and scripts instantly.
    *   **API Strategy:** *Network-First* fallback to cache, ensuring metrics are shown even when completely disconnected.
*   **Speaker Notes:**
    > "To make the application installable like a native app, I configured PWA support. The Service Worker pre-caches all critical assets. When the app is opened, it loads static assets instantly from the cache using a Stale-While-Revalidate strategy. For API requests, it uses a Network-First strategy, ensuring that the cashier sees the latest data when online, but falls back to cached statistics when offline."

---

### Slide 9: Custom Charts & Native Barcode Scanning
*   **Slide Title:** Zero-Library Visuals & Hardware Integration
*   **Bullet Points:**
    *   **Custom Charts:** 7-Day sales bar chart drawn from scratch using the HTML5 Canvas 2D Context, scaled by High-DPI ratios.
    *   **Native Scanner:** Real-time decoding of UPC/EAN codes from camera feed via native browser `BarcodeDetector` API.
    *   **Web Audio API:** Generates synthesized auditory beep signals on successful scans.
*   **Speaker Notes:**
    > "We avoided heavy chart libraries by writing our own drawing logic using the HTML5 Canvas API, scaling the context by the device pixel ratio for crystal-clear visuals. For barcode scanning, we use the native Web Barcode Detector API to scan barcodes directly from the camera feed via getUserMedia. Upon a successful scan, a beep sound is dynamically synthesized using the Web Audio API, and the product is instantly selected on the form."

---

### Slide 10: Security & Admin Settings
*   **Slide Title:** Access Controls & Account Toggles
*   **Bullet Points:**
    *   **Password Security:** Encrypted with bcrypt hashes at rest, updated via PATCH authentication routes.
    *   **Staff Directory (ADMIN only):** List registered shop users and control active states.
    *   **Self-Lockout Protection:** Disables toggle switches for the active administrator account.
*   **Speaker Notes:**
    > "Finally, security is handled via token authentication and roles. All users can change their password securely, which forces a logout on success. Administrators are provided with a dedicated Staff Directory where they can register new cashier profiles and toggle account status. To prevent administrative accidents, administrators are restricted from deactivating their own accounts."

---

### Slide 11: Summary of Key Achievements
*   **Slide Title:** Summary & Key Takeaways
*   **Bullet Points:**
    *   **High Performance:** Clean, fast Single Page Application built completely on Vanilla JS.
    *   **100% Offline-First:** Transaction logging and local list caches work in completely disconnected modes.
    *   **Best Practices:** Follows modern clean coding architectures, MVC separation, and relational database constraints.
*   **Speaker Notes:**
    > "In summary, Bazar-Trace meets all academic constraints while implementing advanced production-ready features. It proves that complex synchronization engines, PWAs, hardware scanner connections, and custom canvas drawings can be fully realized using nothing but vanilla web technologies and robust backend architectures. Thank you, professors. I am now open to your questions."

---

## 🛠️ Frequently Asked Questions (Viva / Defense Prep)

### Q1: Why did you choose IndexedDB instead of LocalStorage for caching?
*   **Answer:** LocalStorage is synchronous, blocking the main thread, and has a strict size limit of ~5MB. IndexedDB is asynchronous, non-blocking, and supports storing large amounts of structured data (e.g. hundreds of products and transactions) with native query and index support.

### Q2: What happens if two cashiers register sales offline with the same product?
*   **Answer:** Both transactions are saved locally with unique client-side UUIDs. When both cashiers reconnect, their sync queues drain sequentially. The database handles each insert independently. The backend subtracts stock based on when the transactions are received.

### Q3: Why is the `client_txn_id` so important for the sync engine?
*   **Answer:** If a network connection drops *after* the backend records the transaction but *before* the client receives the success response, the client will attempt to resend the transaction on reconnect. Without a unique client-side identifier, the backend would insert the same transaction twice. The `client_txn_id` UNIQUE constraint ensures that Oracle rejects the second insert, maintaining transactional accuracy.
