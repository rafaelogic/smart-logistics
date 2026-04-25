# Smart Logistics API

Node.js/TypeScript REST API for warehouse inventory, stock transfers, and capacity/type enforcement.

## Stack

- Node.js 20+
- TypeScript
- Express
- PostgreSQL
- JWT authentication
- Zod validation
- Vitest + pg-mem tests
- Swagger UI / OpenAPI

## Setup

```bash
npm install
cp .env.example .env
# Edit DATABASE_URL, JWT_SECRET, AUTH_USERNAME, and AUTH_PASSWORD in .env
npm run migrate
npm run seed
npm run dev
```

The API starts on `http://localhost:3000` by default for local development.

Hosted API:

```txt
https://smart-logistics-api-nrfd.onrender.com
```

Optional seed data is available in `seed.sql`. Run `npm run seed` after migrations to create 10 warehouses, 30 items, and 30 inventory item rows per warehouse.

Useful URLs:

- Health: `GET https://smart-logistics-api-nrfd.onrender.com/health`
- Swagger UI: `https://smart-logistics-api-nrfd.onrender.com/docs`
- OpenAPI JSON: `GET https://smart-logistics-api-nrfd.onrender.com/openapi.json`

The repository also includes a static OpenAPI submission artifact at `docs/openapi.json`.

Protected endpoints require `Authorization: Bearer <access-token>`. Public endpoints are `/health`, `/docs`, `/openapi.json`, and `/auth/token`.

Required environment variables:

- `DATABASE_URL`
- `DATABASE_SSL` optional, set to `true` when using Render's external PostgreSQL URL
- `JWT_SECRET`
- `AUTH_USERNAME`
- `AUTH_PASSWORD`
- `PORT` optional, defaults to `3000`
- `JWT_EXPIRES_IN` optional, defaults to `1h`

## Tests

```bash
npm test
```

The test suite covers transfer success, insufficient destination capacity, incompatible cold/standard storage, insufficient source stock, validation failures, and cold item add prevention.

## Database Model

- `warehouses`: name, location, `max_capacity`, type (`STANDARD` or `COLD`), and `deleted_at` for soft deletes.
- `items`: name, unique SKU, storage requirement (`STANDARD` or `COLD`), and `deleted_at`.
- `inventory`: join table tracking quantity per `(warehouse_id, item_id)`.

SKU format is enforced at both API and database level: `^[A-Z]{3}-\d{5}-[A-Z]$`.

## Business Rules

- Warehouse, item, and inventory endpoints are protected by JWT auth.
- Cold items cannot be added or transferred into standard warehouses.
- Adds/transfers fail if the destination warehouse capacity would be exceeded.
- Transfers run inside a serializable transaction and lock source/destination warehouse rows in stable sorted order to reduce deadlock risk and prevent race-condition overfills.
- Transfers move inventory by item resolved from the submitted SKU, preventing ghost stock or cross-SKU movement.
- Warehouses can only be soft-deleted when empty.
- Reports are paginated with `warehousePage` and `warehousesPerPage` for warehouses, plus `warehouseItemPage` and `warehouseItemsPerPage` for each warehouse item list. Both page-size fields max out at 100.

## Error Format

All errors use the same shape:

```json
{
  "error": "INSUFFICIENT_CAPACITY",
  "message": "Destination warehouse does not have enough remaining capacity.",
  "code": 422
}
```

## API Examples

Get a JWT:

```bash
curl -X POST https://smart-logistics-api-nrfd.onrender.com/auth/token \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"change-me"}'
```

Use the returned `accessToken` as a Bearer token for warehouse, item, and inventory endpoints.

Create a warehouse:

```bash
curl -X POST https://smart-logistics-api-nrfd.onrender.com/warehouses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access-token>" \
  -d '{"name":"Cold Manila","location":"Manila","maxCapacity":100,"type":"COLD"}'
```

Create an item:

```bash
curl -X POST https://smart-logistics-api-nrfd.onrender.com/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access-token>" \
  -d '{"name":"Ice Cream","sku":"ICE-12345-C","storageRequirement":"COLD"}'
```

Add inventory:

```bash
curl -X POST https://smart-logistics-api-nrfd.onrender.com/inventory/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access-token>" \
  -d '{"warehouseId":"<warehouse-id>","sku":"ICE-12345-C","quantity":25}'
```

Transfer inventory:

```bash
curl -X POST https://smart-logistics-api-nrfd.onrender.com/inventory/transfer \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access-token>" \
  -d '{"fromWarehouseId":"<source-id>","toWarehouseId":"<destination-id>","sku":"ICE-12345-C","quantity":5}'
```

Inventory report:

```bash
curl "https://smart-logistics-api-nrfd.onrender.com/inventory/report?warehousePage=1&warehousesPerPage=50&warehouseItemPage=1&warehouseItemsPerPage=50" \
  -H "Authorization: Bearer <access-token>"
```

Delete an empty warehouse:

```bash
curl -X DELETE https://smart-logistics-api-nrfd.onrender.com/warehouses/<warehouse-id> \
  -H "Authorization: Bearer <access-token>"
```

## Deployment Notes

For Render, Railway, Fly.io, or Heroku:

1. Provision a PostgreSQL database.
2. Set `DATABASE_URL`, `DATABASE_SSL=true`, `PORT`, `NODE_ENV=production`, `JWT_SECRET`, `AUTH_USERNAME`, and `AUTH_PASSWORD`.
3. Use `npm ci --include=dev && npm run build` as the build command.
4. Use `npm run migrate:prod && npm start` as the start command, or run `npm run migrate:prod` once before `npm start`.

For Render specifically, `render.yaml` is included with the correct build and start commands.
