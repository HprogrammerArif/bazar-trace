# Bazar-Trace

Mobile-first PWA for inventory & stock management, built for small shop owners
in low-connectivity environments. Final Year Project deliverable.

## Stack

| Layer    | Technology                                        |
|----------|---------------------------------------------------|
| Frontend | html + css + js + service worker + indexedDB  |
| Offline  | IndexedDB + Service Worker + sync queue     |
| Backend  | Node.js (ESM) + Express + Zod + Winston           |
| Database | Oracle 21c+ via `oracledb` (Thin mode)            |
| Auth     | JWT + bcryptjs                                    |

## Repository layout

```
bazar/
├── backend/   # Express API (Clean Architecture: Controller → Service → Repository)
├── frontend/  # React PWA (feature-based folders + offline layer)
├── docs/      # architecture & API specs
└── docker-compose.yml
```

## Local development

### 1. Backend

```bash
cd backend
cp .env.example .env
# At first the API runs without Oracle so you can verify the scaffolding.
npm install
npm run dev
# API will be live at http://localhost:5000/api/v1/health
```

To enable Oracle:

1. Set `ORACLE_ENABLED=true` and credentials in `backend/.env`
2. Run migrations: `npm run db:migrate`
3. Seed the first admin: open SQL*Plus / SQLcl and run `src/db/seeds/seed-admin.sql`
   (default password is `ChangeMe123!` — change it on first login)

### 2. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
# App runs at http://localhost:5173 — Vite proxies /api → backend
```

## Production (Docker Compose)

```bash
docker compose up -d --build
# Backend  → http://localhost:5000
# Frontend → http://localhost:8080
```

The compose file launches Oracle XE 21, the backend, and the frontend together.
First boot of Oracle takes ~5 minutes; subsequent boots are quick.

## API surface (v1)

All routes are prefixed with `/api/v1`. Auth uses `Authorization: Bearer <jwt>`.

| Method | Path                              | Role         | Notes                                  |
|--------|-----------------------------------|--------------|----------------------------------------|
| GET    | `/health`                         | public       | Liveness & DB probe                    |
| POST   | `/auth/login`                     | public       | `{ email, password }`                  |
| POST   | `/auth/register`                  | ADMIN        | Mint a STAFF/ADMIN user                |
| GET    | `/auth/me`                        | any          | Current user                           |
| GET    | `/users`                          | ADMIN        | List users                             |
| PATCH  | `/users/:id`                      | ADMIN        | Update name/role/active                |
| GET    | `/products`                       | any          | List with stock                        |
| GET    | `/products/barcode/:barcode`      | any          | Lookup for scanner                     |
| POST   | `/products`                       | any          | Create                                 |
| PATCH  | `/products/:id`                   | any          | Update                                 |
| DELETE | `/products/:id`                   | ADMIN        | Soft delete                            |
| GET    | `/transactions`                   | any          | Filter by `type`, `productId`, dates   |
| POST   | `/transactions`                   | any          | Idempotent on `clientTxnId`            |
| GET    | `/analytics/dashboard`            | any          | Counts + 7-day sales + expiring/low    |

## Offline behaviour

- The Service Worker (Workbox) caches the app shell and any GET responses.
- Mutations made offline are written into IndexedDB (`sync_queue` store) with
  a UUID `clientTxnId` and replayed on reconnect.
- The server's `transactions.client_txn_id` UNIQUE constraint dedupes replays;
  if the same row reappears the API returns the existing record (idempotent).
- See `docs/architecture.md` for the full data flow.

## Tests

```bash
cd backend && npm test    # Node's built-in test runner
```
