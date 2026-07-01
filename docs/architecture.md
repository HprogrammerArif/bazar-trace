# Bazar-Trace — Architecture

## Goals

- **Offline-first.** A shop on flaky 2G must keep selling. Writes go to IndexedDB
  first, then drain to the API when reachable.
- **Mobile-first.** Bottom navigation, tap targets, no large libraries.
- **Clean Architecture on the backend.** Routes → Controllers → Services →
  Repositories. The repository layer is the only place that imports `oracledb`.

## Components

```
┌─────────────────┐  HTTPS  ┌─────────────────┐  oracledb pool  ┌──────────────┐
│ React PWA       │ ───────▶│ Express API     │ ──────────────▶ │ Oracle DB    │
│ + Service Worker│         │ (modules/*)     │                  │ (USERS,      │
│ + IndexedDB     │ ◀─────  │ JWT, Zod, Winston│                 │  PRODUCTS,   │
└─────────────────┘  JSON   └─────────────────┘                  │  TRANSACTIONS│
                                                                  └──────────────┘
```

## Backend layers

| Layer       | Folder                       | Imports allowed                  |
|-------------|------------------------------|----------------------------------|
| Routes      | `modules/<x>/<x>.routes.js`  | controllers, middlewares         |
| Controller  | `modules/<x>/<x>.controller.js` | services, response helpers     |
| Service     | `modules/<x>/<x>.service.js` | repositories, AppError, constants|
| Repository  | `modules/<x>/<x>.repository.js` | `config/database.js`, oracledb |

The compiler does not enforce these — code review does. Treat them as a contract.

## Offline data flow

Online sale:

```
UI ─▶ recordTransaction() ─▶ POST /api/v1/transactions ─▶ DB
                       (success) ─▶ React Query invalidates cached views
```

Offline sale:

```
UI ─▶ recordTransaction() ─▶ IndexedDB (optimistic row, _pending: true)
                          ─▶ sync_queue.enqueue({ payload with clientTxnId })
                          ─▶ Toast: "Saved offline"
```

Sync drain (on `online` event):

```
For each queued mutation (FIFO):
  POST it (clientTxnId travels with the body)
  ├─ 2xx → remove from queue, replace optimistic row with server row
  ├─ 409 → mark conflict, refresh local cache (server wins)
  ├─ 4xx → mark failed, surface to user
  └─ 5xx / network → leave in queue, retry later
```

## Data model

```
USERS  (id PK, email UNIQUE, password_hash, role, is_active)
   │
   │ creates             records
   ▼                     ▼
PRODUCTS               TRANSACTIONS
   │ (id, sku, barcode,    (id, client_txn_id UNIQUE, product_id FK, user_id FK,
   │  expiry_date, ...)     txn_type IN/OUT, quantity, unit_price, occurred_at)
   └────────────────────▲
                        │
                v_product_stock VIEW
                derives current_qty from SUM(IN) - SUM(OUT)
```

**Why no `stock_qty` column?** Two staff devices selling the last unit at the
same time would race a counter. Computing stock from the immutable transactions
log eliminates the race entirely.

## Trade-offs explicitly accepted

| Decision                           | Trade-off accepted                        |
|------------------------------------|--------------------------------------------|
| Stock derived from view            | Slightly slower reads vs. perfect correctness |
| Single JWT (no refresh token)      | Simpler; user re-logs every 12h            |
| `client_txn_id` UNIQUE             | One extra index, one error path; in return: idempotent retries |
| Zustand-less (Context for auth)    | Auth state changes once per session — Context is fine |
| No materialized view (yet)         | Phase 8 can add one if dashboards get slow |
