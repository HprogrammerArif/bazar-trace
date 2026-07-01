# 🖥️ Bazar-Trace — Frontend Documentation

> **Stack:** HTML + CSS + Vanilla JavaScript (ES Modules) + PWA (Service Worker + IndexedDB)  
> **Constraint:** No React, No Next.js, No Tailwind — university requirement. Raw code only.  
> **Status:** Completed successfully ✓

---

## 📋 Table of Contents

1. [What We're Building](#1-what-were-building)
2. [University Constraints & Why They're Fine](#2-university-constraints--why-theyre-fine)
3. [Folder Structure](#3-folder-structure)
4. [Pages & Features](#4-pages--features)
5. [PWA — What It Means & How It Works](#5-pwa--what-it-means--how-it-works)
6. [Offline-First System (Deep Dive)](#6-offline-first-system-deep-dive)
7. [API Service Layer](#7-api-service-layer)
8. [State Management (No Framework)](#8-state-management-no-framework)
9. [Barcode Scanner](#9-barcode-scanner)
10. [Routing (Without React Router)](#10-routing-without-react-router)
11. [Component Architecture (Without React)](#11-component-architecture-without-react)
12. [Build & Dev Setup](#12-build--dev-setup)
13. [What to Build First](#13-what-to-build-first)
14. [UI/UX Guidelines](#14-uiux-guidelines)

---

## 1. What We're Building

A **Single Page Application (SPA)** that looks and feels like a native mobile app, built with nothing but HTML, CSS, and JavaScript.

**Target user:** A shop owner or staff member in Bangladesh, using a low-end Android phone, possibly on 2G or no internet.

**What the frontend must do:**
- Show a login screen → secure the app
- Dashboard with live stats (stock counts, alerts, 7-day sales chart)
- Product list with search → add/edit/delete products
- Record sales (OUT) and stock received (IN)
- Work with a barcode camera scanner
- Work completely offline → queue actions → sync when internet returns
- Feel fast, mobile-first, easy to use

---

## 2. University Constraints & Why They're Fine

| ❌ Not Allowed | ✅ What We Use Instead |
|---|---|
| React / Next.js / Vue | Plain JavaScript ES Modules |
| Tailwind CSS | Custom CSS with CSS variables |
| NPM UI libraries | Write our own components |
| jQuery | Modern `fetch()`, `querySelector()`, `classList` |

**Why this is actually good for you:**
- You understand every line of code (no black boxes)
- You can explain everything in your viva
- It demonstrates deeper knowledge than "I used React"
- The offline PWA features work just as well without a framework

---

## 3. Folder Structure

```
frontend/
├── index.html                  ← Entry point (the ONE html file — it's a SPA)
├── manifest.json               ← PWA: app name, icons, theme color
├── sw.js                       ← Service Worker: caching + background sync
├── Dockerfile                  ← Nginx to serve static files in Docker
│
├── css/
│   ├── base.css                ← CSS reset, CSS variables (colors, spacing, fonts)
│   ├── components.css          ← Reusable: buttons, cards, modals, forms, badges
│   ├── layout.css              ← Bottom nav, sidebar, page containers
│   └── pages/
│       ├── login.css
│       ├── dashboard.css
│       ├── products.css
│       ├── transactions.css
│       └── scanner.css
│
├── js/
│   ├── app.js                  ← Entry: initializes router, auth, sync
│   │
│   ├── config/
│   │   └── constants.js        ← API_BASE_URL, LOW_STOCK_THRESHOLD, etc.
│   │
│   ├── api/                    ← Backend communication layer
│   │   ├── client.js           ← Base fetch wrapper (auth headers, error handling)
│   │   ├── auth.api.js         ← login(), register(), getMe()
│   │   ├── products.api.js     ← getProducts(), createProduct(), etc.
│   │   ├── transactions.api.js ← recordTransaction(), getTransactions()
│   │   └── analytics.api.js    ← getDashboard()
│   │
│   ├── store/                  ← In-memory state (no Redux, just plain objects)
│   │   ├── auth.store.js       ← currentUser, token, isLoggedIn
│   │   └── ui.store.js         ← loading states, active page, toasts
│   │
│   ├── db/                     ← IndexedDB layer (offline storage)
│   │   ├── idb.js              ← Open DB, schema, upgrade logic
│   │   ├── products.db.js      ← Read/write products to IndexedDB
│   │   ├── transactions.db.js  ← Read/write transactions + sync queue
│   │   └── sync-queue.db.js    ← Manage the offline mutation queue
│   │
│   ├── sync/
│   │   └── sync-manager.js     ← Drain queue when online event fires
│   │
│   ├── router/
│   │   └── router.js           ← Hash-based SPA router (#/login, #/dashboard, etc.)
│   │
│   ├── pages/                  ← One file per page/view
│   │   ├── login.page.js
│   │   ├── dashboard.page.js
│   │   ├── products.page.js
│   │   ├── product-form.page.js   ← Add / Edit product
│   │   ├── transactions.page.js
│   │   ├── record-sale.page.js    ← Quick sale / stock-in form
│   │   ├── scanner.page.js        ← Camera barcode scanner
│   │   └── settings.page.js       ← User management (ADMIN only)
│   │
│   ├── components/             ← Reusable UI pieces
│   │   ├── toast.js            ← Show success/error/warning notifications
│   │   ├── loader.js           ← Spinner overlay
│   │   ├── bottom-nav.js       ← Mobile navigation bar
│   │   ├── modal.js            ← Confirmation dialogs
│   │   ├── chart.js            ← Simple SVG/Canvas chart (no library)
│   │   └── badge.js            ← Low stock / expiry warning badges
│   │
│   └── utils/
│       ├── format.js           ← formatCurrency, formatDate, formatQuantity
│       ├── validate.js         ← Client-side form validation helpers
│       └── uuid.js             ← Generate UUID v4 for clientTxnId
│
└── assets/
    ├── icons/                  ← PWA icons (192x192, 512x512 PNG)
    └── fonts/                  ← Self-hosted fonts (for offline use)
```

---

## 4. Pages & Features

### 🔐 Login Page (`#/login`)
- Email + password form
- Calls `POST /api/v1/auth/login`
- Stores JWT in `localStorage`
- Redirects to dashboard on success
- Error messages for wrong credentials
- No "remember me" — JWT already lasts 12h

---

### 📊 Dashboard Page (`#/dashboard`)
- **5 stat cards:** Total Products · Low Stock · Expiring Soon · Expired · **Net Profit** (loaded from the new `/analytics/profit-loss` API)
- **7-day sales chart:** Bar chart drawn on `<canvas>` (no library)
- **Low stock list:** Products with stock below their custom threshold
- **Expiring soon list:** Products expiring within 7 days
- Refreshes when online after offline period

---

### 📦 Products Page (`#/products`)
- Searchable, scrollable product list
- Each row shows: name, SKU, current stock (from `v_product_stock`), category, sell price
- Color-coded badges: 🔴 Out of stock · 🟡 Low stock · 🟢 OK · ⚠️ Expiring soon
- Floating "+ Add Product" button
- Tap a product → product detail / edit

---

### ➕ Product Form Page (`#/products/new` or `#/products/:id/edit`)
- **Fields:** Name, SKU, Barcode, Category, Unit, Cost Price, Sell Price, Expiry Date, **Low Stock Threshold** (numerical, defaults to 5)
- "Scan Barcode" button → opens camera scanner
- Validation on all fields before submit
- Works offline: saves locally + queues for sync

---

### 💰 Record Sale / Stock-In Page (`#/record`)
- Two tabs: **Sale (OUT)** and **Stock In (IN)**
- Product search or scan barcode
- Shows current stock before recording
- Quantity + price fields
- Optional note
- Generates UUID `clientTxnId` before sending
- **Works offline**: saves to IndexedDB + sync queue

---

### 📷 Scanner Page (`#/scanner`)
- Uses device camera (via `getUserMedia` API)
- Auto-detects barcode using `BarcodeDetector` API (built into modern Android browsers)
- On scan → looks up product → auto-fills the sale form
- No third-party library needed (Chrome/Edge Android supports this natively)

---

### 📋 Transactions Page (`#/transactions`)
- Transaction history list
- Filter by: type (IN/OUT), date range, product
- Shows: product name, type, quantity, unit price, total, who recorded it, when
- Offline-pending transactions show with a ⏳ badge

---

### ⚙️ Settings / Profile Page (`#/settings`)
- **Change Password form:** Any user can update their password via `PATCH /auth/password`
- **User management (ADMIN only):** List all users, toggle user active/inactive, register new staff member
- Only visible if `currentUser.role === 'ADMIN'` (except the password change form which is for everyone)

---

## 5. PWA — What It Means & How It Works

**PWA = Progressive Web App.** It's a website that behaves like a native app:

| Feature | How |
|---|---|
| Install to home screen | `manifest.json` + HTTPS |
| Works offline | Service Worker caches files |
| No app store needed | Just share the URL |
| Push notifications (future) | Service Worker |

### `manifest.json` — App Identity

```json
{
  "name": "Bazar-Trace",
  "short_name": "BazarTrace",
  "description": "Inventory management for small shops",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0f172a",
  "theme_color": "#6366f1",
  "icons": [
    { "src": "assets/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "assets/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```
- `display: standalone` → hides the browser address bar → feels like a native app
- `start_url: /` → tapping the home screen icon opens the app

### Service Worker (`sw.js`) — The Offline Engine

The Service Worker is a JavaScript file that runs **in the background**, separate from your page. It intercepts every network request.

```
Browser (your page)
      ↓ fetch request
Service Worker         ← Intercepts ALL requests
      ↓
  [Is it in cache?]
  YES → return cached response immediately (works offline!)
  NO  → fetch from network → cache a copy → return it
```

**Caching strategy for Bazar-Trace:**

| Resource type | Strategy | Why |
|---|---|---|
| App shell (HTML, CSS, JS) | **Cache First** | App loads instantly, always works |
| GET API requests | **Network First, fallback to cache** | Show fresh data if online, stale if offline |
| POST/PATCH/DELETE | **Never cache** → write to sync queue | Mutations go to IndexedDB, not cache |

---

## 6. Offline-First System (Deep Dive)

This is the most technically impressive part of the project. Understand it thoroughly.

### The Three Scenarios

#### Scenario 1: Online sale (normal)
```
Staff taps "Record Sale"
  → generate UUID clientTxnId
  → POST /api/v1/transactions (with clientTxnId in body)
  → Server saves to Oracle
  → Response: { success: true, data: { id: 42, ... } }
  → Update local product list (stock shown decreases)
  → Toast: "Sale recorded ✓"
```

#### Scenario 2: Offline sale
```
Staff taps "Record Sale" (no internet)
  → generate UUID clientTxnId
  → Try POST → Network fails
  → Write transaction to IndexedDB (transactions store, _pending: true)
  → Write to sync_queue store: { clientTxnId, url, method, body, createdAt }
  → Toast: "Saved offline — will sync when online"
  → UI shows ⏳ pending badge on that transaction
```

#### Scenario 3: Reconnect + sync
```
Internet returns → browser fires "online" event
  → SyncManager.drain() runs
  → Reads sync_queue from IndexedDB (oldest first — FIFO)
  → For each queued item:
      POST /api/v1/transactions with the saved body
      ├── 201/200 → Remove from queue, replace optimistic row with server row
      ├── 409 Conflict → Server already has it (idempotent!) → remove from queue
      ├── 4xx → Mark as failed, show error to user, keep in queue for inspection
      └── 5xx / timeout → Leave in queue, retry next time online
```

### IndexedDB Schema

```
Database: bazar-trace-db (version 1)

Object Stores:
  ├── products
  │     keyPath: id
  │     indices: [barcode, category, is_active]
  │     Purpose: Offline product lookup (barcode scan works offline)
  │
  ├── transactions
  │     keyPath: clientTxnId
  │     indices: [productId, txnType, occurredAt, _pending]
  │     Purpose: Show transaction history even offline
  │
  └── sync_queue
        keyPath: clientTxnId
        indices: [createdAt, status]
        Purpose: Ordered queue of mutations waiting to sync
```

### Why `clientTxnId` is the key

The frontend generates a **UUID** before sending any transaction. This UUID is:

1. The `keyPath` in IndexedDB (used as local ID)
2. Sent in the request body as `clientTxnId`
3. Stored in Oracle as `client_txn_id UNIQUE`

If the network fails halfway and the request is retried, Oracle's `UNIQUE` constraint deduplicates it. The API returns `{ success: true, data: existingTransaction }` — no duplicate sale recorded.

---

## 7. API Service Layer

Every page talks to the backend through a service layer, not directly. This makes it easy to:
- Change the API URL in one place
- Add auth headers automatically
- Handle errors consistently

### `js/api/client.js` — Base Fetch Wrapper

```js
// This is the single place where all HTTP requests go
async function request(url, options = {}) {
  const token = localStorage.getItem('bazar_token');

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    // Server returned 4xx or 5xx
    throw new ApiError(data.error.code, data.error.message, response.status);
  }

  return data.data;  // Always return the inner `data` field
}

export const api = {
  get:    (url) =>         request(url, { method: 'GET' }),
  post:   (url, body) =>   request(url, { method: 'POST',   body: JSON.stringify(body) }),
  patch:  (url, body) =>   request(url, { method: 'PATCH',  body: JSON.stringify(body) }),
  delete: (url) =>         request(url, { method: 'DELETE' }),
};
```

### `js/api/transactions.api.js` — Example API module

```js
import { api } from './client.js';

export async function recordTransaction(payload) {
  return api.post('/transactions', payload);
}

export async function getTransactions(filters = {}) {
  const params = new URLSearchParams(filters).toString();
  return api.get(`/transactions?${params}`);
}
```

---

## 8. State Management (No Framework)

Without React, we manage state using **plain JavaScript module singletons**.

### `js/store/auth.store.js`

```js
// A module is a singleton — imported state is shared across all files
let currentUser = null;
let token = null;

export function setAuth(user, jwt) {
  currentUser = user;
  token = jwt;
  localStorage.setItem('bazar_token', jwt);
  localStorage.setItem('bazar_user', JSON.stringify(user));
}

export function getUser() { return currentUser; }
export function getToken() { return token; }
export function isLoggedIn() { return !!token; }

export function clearAuth() {
  currentUser = null;
  token = null;
  localStorage.removeItem('bazar_token');
  localStorage.removeItem('bazar_user');
}

// Restore from localStorage on page refresh
export function restoreSession() {
  token = localStorage.getItem('bazar_token');
  const stored = localStorage.getItem('bazar_user');
  currentUser = stored ? JSON.parse(stored) : null;
}
```

### Why no Redux / Zustand?

- Auth state changes **once per session** (login/logout). That's it.
- Product and transaction data is fetched fresh from the API or IndexedDB.
- A plain module singleton is all you need. Adding Zustand would be over-engineering.

---

## 9. Barcode Scanner

### The API: `BarcodeDetector`

Modern Android browsers (Chrome 83+, Edge) have a built-in barcode scanner API — **no library needed**.

```js
// Check if supported
if ('BarcodeDetector' in window) {
  // Use native API
} else {
  // Fallback: show manual barcode input field
}

// Open camera and scan
const detector = new BarcodeDetector({ formats: ['ean_13', 'qr_code', 'code_128'] });
const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                                                        //  ↑ rear camera

const video = document.getElementById('scanner-video');
video.srcObject = stream;

// Detect loop
async function detect() {
  const barcodes = await detector.detect(video);
  if (barcodes.length > 0) {
    const barcode = barcodes[0].rawValue;  // e.g. "8901234567890"
    stream.getTracks().forEach(t => t.stop());  // close camera
    onBarcodeDetected(barcode);
  } else {
    requestAnimationFrame(detect);  // keep scanning
  }
}
requestAnimationFrame(detect);
```

### Flow after scan

```
Barcode detected ("8901234567890")
  → GET /api/v1/products/barcode/8901234567890
  │   (or check IndexedDB if offline)
  ├── Product found → auto-fill sale form
  └── Not found → "Product not found. Add it?" prompt
```

---

## 10. Routing (Without React Router)

We use **hash-based routing** — the URL changes like `#/dashboard`, `#/products`, `#/record`. The page never reloads. JavaScript reads the hash and shows the right content.

```js
// js/router/router.js

const routes = {
  '#/login':        () => import('../pages/login.page.js'),
  '#/dashboard':    () => import('../pages/dashboard.page.js'),
  '#/products':     () => import('../pages/products.page.js'),
  '#/products/new': () => import('../pages/product-form.page.js'),
  '#/record':       () => import('../pages/record-sale.page.js'),
  '#/scanner':      () => import('../pages/scanner.page.js'),
  '#/transactions': () => import('../pages/transactions.page.js'),
  '#/settings':     () => import('../pages/settings.page.js'),
};

export async function navigate(hash) {
  // Guard: redirect to login if not authenticated
  if (!isLoggedIn() && hash !== '#/login') {
    window.location.hash = '#/login';
    return;
  }

  const loader = routes[hash] || routes['#/dashboard'];
  const page = await loader();

  const container = document.getElementById('app');
  container.innerHTML = '';          // Clear current page
  await page.render(container);      // Render new page
}

// Listen for hash changes
window.addEventListener('hashchange', () => navigate(window.location.hash));

// On app start
navigate(window.location.hash || '#/dashboard');
```

### Dynamic imports
Notice `() => import('../pages/...')` — this is **code splitting**. Each page's JS is only downloaded when first needed, keeping initial load tiny.

---

## 11. Component Architecture (Without React)

Each component is a function that:
1. Takes data as arguments
2. Returns HTML string OR modifies the DOM

### Pattern: Render function

```js
// js/components/toast.js

let toastContainer = null;

function getContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

export function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;  // CSS classes: toast--success, toast--error
  toast.textContent = message;
  
  getContainer().appendChild(toast);
  
  // Auto-remove after 3 seconds
  setTimeout(() => toast.remove(), 3000);
}

// Usage anywhere:
// showToast('Sale recorded!', 'success');
// showToast('Product not found', 'error');
// showToast('Saved offline', 'warning');
```

### Pattern: Page module

```js
// js/pages/products.page.js

import { getProducts } from '../api/products.api.js';
import { showToast } from '../components/toast.js';
import { formatCurrency } from '../utils/format.js';

export async function render(container) {
  // 1. Render skeleton HTML immediately
  container.innerHTML = `
    <div class="page-header">
      <h1>Products</h1>
      <button id="btn-add-product" class="btn btn--primary">+ Add Product</button>
    </div>
    <input id="search-input" class="form-input" placeholder="Search products..." />
    <div id="product-list" class="card-list">
      <div class="skeleton-list"></div>
    </div>
  `;

  // 2. Fetch data
  const products = await getProducts().catch(() => []);

  // 3. Render data
  document.getElementById('product-list').innerHTML = products.map(p => `
    <div class="product-card" data-id="${p.id}">
      <div class="product-card__name">${p.name}</div>
      <div class="product-card__sku">${p.sku}</div>
      <div class="product-card__stock ${stockClass(p.currentQty)}">
        ${p.currentQty} ${p.unit}
      </div>
      <div class="product-card__price">${formatCurrency(p.sellPrice)}</div>
    </div>
  `).join('');

  // 4. Attach event listeners
  document.getElementById('btn-add-product').addEventListener('click', () => {
    window.location.hash = '#/products/new';
  });

  document.getElementById('search-input').addEventListener('input', (e) => {
    filterProducts(e.target.value);
  });
}

function stockClass(qty) {
  if (qty <= 0) return 'stock--empty';
  if (qty <= 5) return 'stock--low';
  return 'stock--ok';
}
```

---

## 12. Build & Dev Setup

Since we're using vanilla HTML/CSS/JS with ES Modules, we don't strictly need a build tool. But we use **Vite** as a dev server for:
- Hot reload in development
- Proxy `/api` requests to backend (avoids CORS in dev)
- Bundle + minify for production

> ⚠️ Vite is a dev tool only — the OUTPUT is still plain HTML/CSS/JS. The university restriction is about the output, which is still raw code. Vite is just a helper.

**Alternative without Vite:** Use the `Live Server` VS Code extension and set `CORS_ORIGIN=*` in backend `.env`.

### `vite.config.js`
```js
export default {
  server: {
    proxy: {
      '/api': 'http://localhost:5000'  // Forward /api/* → backend in dev
    }
  }
}
```

### Dev workflow
```bash
cd frontend
npm run dev         # Opens http://localhost:5173
# Backend must be running at :5000
```

### Production (Docker)
The `Dockerfile` builds the static files with Vite then serves them via Nginx:
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN npm ci && npm run build      # Outputs to /app/dist

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
```

---

## 13. What to Build First

Follow this exact order. Don't jump ahead.

### Phase 1: Foundation
- [ ] `index.html` — single HTML file, loads app.js
- [ ] `css/base.css` — CSS variables, reset, typography
- [ ] `css/components.css` — buttons, cards, forms, badges
- [ ] `css/layout.css` — bottom nav, page container
- [ ] `js/config/constants.js` — API_BASE_URL
- [ ] `js/utils/format.js` — formatCurrency, formatDate
- [ ] `js/utils/uuid.js` — UUID v4 generator
- [ ] `js/api/client.js` — base fetch wrapper
- [ ] `js/store/auth.store.js` — auth state module
- [ ] `js/router/router.js` — hash router

### Phase 2: Authentication
- [ ] Login page UI + form
- [ ] Connect to `POST /auth/login`
- [ ] Store JWT, redirect to dashboard
- [ ] Logout button in nav
- [ ] Auth guard in router

### Phase 3: Products
- [ ] Products page — list with stock
- [ ] Add product form
- [ ] Edit product form
- [ ] Product detail

### Phase 4: Transactions
- [ ] Record sale (OUT) form
- [ ] Record stock-in (IN) form
- [ ] Transaction list page

### Phase 5: Dashboard
- [ ] Stat cards
- [ ] 7-day chart (canvas)
- [ ] Expiry alerts
- [ ] Low stock alerts

### Phase 6: Offline (IndexedDB + Sync)
- [ ] `js/db/idb.js` — open IndexedDB
- [ ] Product caching in IndexedDB
- [ ] Transaction sync queue
- [ ] Sync manager (online event)

### Phase 7: PWA
- [ ] `manifest.json`
- [ ] `sw.js` — Service Worker (cache-first for shell, network-first for API)
- [ ] Register service worker in `app.js`

### Phase 8: Barcode Scanner
- [ ] Scanner page with camera feed
- [ ] `BarcodeDetector` integration
- [ ] Auto-fill sale form on scan

### Phase 9: Admin Features
- [ ] Settings page (user management)
- [ ] Admin-only route guards

---

## 14. UI/UX Guidelines

### Design tokens (CSS variables)
```css
/* css/base.css */
:root {
  /* Colors — dark mode default */
  --color-bg-primary:   #0f172a;   /* deep navy — main background */
  --color-bg-surface:   #1e293b;   /* slate — cards, modals */
  --color-bg-elevated:  #334155;   /* lighter slate — inputs, hover */
  --color-accent:       #6366f1;   /* indigo — primary buttons, links */
  --color-accent-hover: #4f46e5;
  --color-success:      #22c55e;   /* green */
  --color-warning:      #f59e0b;   /* amber */
  --color-danger:       #ef4444;   /* red */
  --color-text-primary: #f1f5f9;
  --color-text-muted:   #94a3b8;
  --color-border:       #334155;

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;

  /* Typography */
  --font-sans: 'Inter', system-ui, sans-serif;
  --text-sm:   14px;
  --text-base: 16px;
  --text-lg:   18px;
  --text-xl:   20px;
  --text-2xl:  24px;

  /* Borders */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;

  /* Bottom nav height (mobile safe area) */
  --bottom-nav-height: 64px;
}
```

### Mobile-first rules
- Touch targets minimum **48px tall** (easy tap on small screens)
- Bottom navigation bar (like a native app) — not sidebar
- Font size minimum `16px` (prevents mobile browsers from zooming in on input focus)
- Avoid horizontal scroll
- Show skeleton loaders (not spinners) while data loads

### Stock badge colors
```
🔴 Out of stock  (qty ≤ 0)
🟡 Low stock     (qty > 0 and qty ≤ low_stock_threshold)
🟢 OK            (qty > threshold, expiry > 30 days or none)
🟠 Expiring soon (expiry within 7 days)
⚫ Expired       (expiry date passed)
```
