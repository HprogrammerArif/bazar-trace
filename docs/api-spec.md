# Bazar-Trace — API specification

All endpoints under `/api/v1`. Successful responses follow:

```json
{ "success": true, "data": <payload> }
```

Failures follow:

```json
{ "success": false, "error": { "code": "BAD_REQUEST", "message": "...", "details": {...} } }
```

Error codes: `BAD_REQUEST`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`,
`CONFLICT`, `INTERNAL_ERROR`.

## Auth

### `POST /auth/login`
Public.
```json
// request
{ "email": "admin@bazar-trace.local", "password": "..." }

// response
{ "token": "eyJ...", "user": { "id": 1, "fullName": "Bazar Admin", "email": "...", "role": "ADMIN" } }
```

### `POST /auth/register`
ADMIN only.
```json
// request
{ "fullName": "Karim", "email": "k@shop.com", "password": "...", "role": "STAFF" }
```

### `GET /auth/me`
Any authenticated user.

### `PATCH /auth/password`
Any authenticated user.
```json
// request
{ "oldPassword": "...", "newPassword": "..." }

// response
{ "message": "Password changed successfully" }
```

## Products

### `GET /products?search=&limit=&offset=`
### `GET /products/:id`
### `GET /products/barcode/:barcode`
### `POST /products`
```json
{ "sku": "RICE-50", "barcode": "8901234567890", "name": "Miniket Rice", "category": "Grain",
  "unit": "kg", "costPrice": 70, "sellPrice": 80, "expiryDate": "2026-12-31", "lowStockThreshold": 5 }
```
### `PATCH /products/:id` — partial update
### `DELETE /products/:id` — ADMIN only, soft delete

## Transactions

### `POST /transactions`
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

`clientTxnId` is the **idempotency key** — replaying the same one returns the
existing transaction with `201` semantically equivalent to the first call.

### `GET /transactions?type=OUT&productId=12&from=&to=&limit=&offset=`

## Analytics

### `GET /analytics/dashboard`
```json
{
  "counts": { "activeProducts": 42, "lowStock": 3, "expiringSoon": 2, "expired": 0 },
  "sales":  [{ "day": "2026-04-19", "revenue": 1200, "units": 18 }, ...],
  "expiring": [{ "id": 12, "name": "Milk 1L", "expiryDate": "..." }],
  "lowStock": [{ "productId": 8, "name": "Sugar 1kg", "stock": 2 }]
}
```

### `GET /analytics/profit-loss?from=&to=`
Any authenticated user.
```json
// response
{
  "revenue": 15000,
  "cost": 10500,
  "profit": 4500,
  "marginPercent": 30
}
```
