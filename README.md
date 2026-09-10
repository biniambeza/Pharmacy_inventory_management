# Pharmacy Inventory & Sales (MERN)

Full-stack pharmacy system: inventory with FEFO batches, POS, suppliers/purchase orders, reports, and role-based access (Admin, Pharmacist, Cashier).

## Prerequisites

- Node.js 18+
- MongoDB 6+ (local) or Docker

## Quick start

```bash
# MongoDB (required)
# Use a local MongoDB server, or set server/.env MONGODB_URI to a reachable Atlas URI.
# With Docker Desktop installed:
docker compose up -d

# Install
npm run install:all

# Seed sample users, medicines, batches, suppliers
npm run seed

# Run API (port 5000) + Vite (port 5173)
npm run dev
```

Open http://localhost:5173

| Email | Role | Password |
|---|---|---|
| admin@pharmacy.com | Admin | Password123! |
| pharmacist@pharmacy.com | Pharmacist | Password123! |
| cashier@pharmacy.com | Cashier | Password123! |

Configure `server/.env` (see `server/.env.example`). The Vite dev server proxies `/api` to the Express app.

The API exits when MongoDB is unavailable instead of falling back to an in-memory database. Check `http://localhost:5000/api/health` after starting the server; it should report `database: "connected"`.

## Roles

- **Admin** — users, inventory, POs, reports, POS
- **Pharmacist** — inventory, receive stock, approve Rx sales, reports, POS
- **Cashier** — POS and own sales history. Prescription items checkout as `pending_approval` until a pharmacist/admin approves (then stock is deducted)

## Notable API routes

- `POST /api/auth/login` · `POST /api/auth/register` · `GET /api/auth/me`
- `GET|POST|PUT|DELETE /api/medicines`
- `GET|POST /api/batches`
- `POST /api/sales` · `POST /api/sales/:id/approve` · `GET /api/sales/:id/invoice`
- `GET|POST /api/suppliers` · `POST /api/purchase-orders` · `POST /api/purchase-orders/:id/receive`
- `GET /api/reports/sales?range=daily|weekly|monthly`
- `GET /api/reports/dashboard`
