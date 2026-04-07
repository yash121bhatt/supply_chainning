# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI-enabled supply chain management platform connecting **Admins**, **Shippers**, **Carriers**, and **Drivers** for logistics operations. Monorepo with npm workspaces.

## Project Structure

```
supply-chain/
├── backend/                    # Express.js API server
│   ├── config/                 # DB connection, constants (enums)
│   ├── controllers/            # Route handlers (auth, user, shipment, carrier, driver, admin)
│   ├── middleware/             # JWT auth, request validation
│   ├── models/                 # Mongoose schemas (User, Shipment, Vehicle, Chat, Notification, Transaction)
│   ├── routes/                 # Express route definitions (auth, users, shipments, carriers, drivers, admin)
│   ├── scripts/                # Utility scripts (create-admin.js)
│   ├── utils/                  # JWT helpers, error handlers, async wrappers
│   ├── server.js               # Entry point — sets up Express, MongoDB, Socket.io
│   └── socketHandlers.js       # Real-time event handlers
├── frontend/                   # React + Vite SPA
│   └── src/
│       ├── App.jsx             # Router with role-based protected routes (admin/shipper/carrier/driver)
│       ├── components/Layout   # Main layout shell with role-scoped sidebar
│       ├── context/AuthContext # Zustand store for auth state
│       ├── pages/              # Role-scoped pages (admin/, shipper/, carrier/, driver/)
│       ├── services/           # Axios-based API clients + adminUserAPI
│       └── utils/              # Helper utilities
└── .env.example                # Required env vars
```

## Key Architecture

- **Four role-based portals**: admin, shipper, carrier, driver — each with their own dashboard and pages, enforced by `ProtectedRoute` in `App.jsx`
- **Role routing**: `RoleRedirect` component sends authenticated users to their role-specific dashboard
- **Nested routes**: Uses `<Layout />` with `<Outlet />` pattern — parent `<Route path="/role">` wraps child routes via `<Outlet />`. Do NOT nest `<Routes>` inside `<Routes>`.
- **Backend uses `asyncHandler` wrapper** pattern for controllers to avoid try/catch repetition
- **Socket.io** is set up on the HTTP server for real-time features (tracking, notifications)
- **State management**: Zustand for frontend auth, express-session/JWT for backend auth
- **Constants file** (`backend/config/constants.js`) defines all enums: `USER_ROLES`, `SHIPMENT_STATUS`, `SHIPMENT_TYPES`, `VEHICLE_TYPES`, `PAYMENT_STATUS`, `NOTIFICATION_TYPES`
- **Axios interceptor** in `frontend/src/services/api.js` returns `response.data` directly, so API responses are unwrapped one level. Controller response format: `{ success: true, data: { shipments, pagination } }` → frontend receives `{ success: true, data: { shipments } }`.
- **Response format**: Controllers send `data: shipment` (flat) for single resources, `data: { shipments }` for collections. Frontend uses fallback pattern: `res.data?.shipments || res.shipments || []`.

## Common Commands

### Install dependencies
```bash
npm install            # Installs all workspaces
```

### Development
```bash
npm run dev            # Start both backend (port 5000) and frontend (port 5173)
npm run dev:backend    # Backend only (nodemon)
npm run dev:frontend   # Frontend only (vite)
```

### Build
```bash
cd frontend && npm run build   # Vite production build → dist/
cd frontend && npm run preview # Preview built assets
```

### Admin User Creation
```bash
cd backend && npm run create-admin
# Uses MONGODB_URI from .env, creates admin@supplychain.com / admin123
# Or pass custom details: npm run create-admin -- "Name" "email@test.com" "password"
```

### Backend API routes

**Auth**: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`, `PUT /api/auth/profile`, `PUT /api/auth/change-password`

**Shipper**: `POST /api/shipments`, `GET /api/shipments/my-shipments`, `PUT /api/shipments/:id`, `DELETE /api/shipments/:id`

**Carrier**: `GET /api/shipments/available/list`, `PUT /api/shipments/:id/accept`, `PUT /api/shipments/:id/reject`, `PUT /api/shipments/:id/assign-driver`, `GET /api/carriers/vehicles`, `POST /api/carriers/vehicles`, `GET /api/carriers/dashboard`, `GET /api/carriers/earnings`, `GET /api/carriers/drivers`

**Driver**: `PUT /api/shipments/:id/status`, `PUT /api/shipments/:id/location`, `POST /api/shipments/:id/pod`, `GET /api/drivers/dashboard`, `GET /api/drivers/active-shipments`, `GET /api/drivers/profile`, `GET /api/drivers/earnings`

**Admin**: `GET /api/admin/dashboard`, `GET /api/admin/shipments`, `GET /api/admin/shipments/stats`, `PUT /api/admin/shipments/:id`, `PUT /api/admin/shipments/:id/cancel`, `GET /api/users` (manage users), `PUT /api/users/:id/status`, `PUT /api/users/:id/verify`, `DELETE /api/users/:id`, `GET /api/users/stats`

### Testing / Linting
```bash
cd backend && npm test     # Jest + coverage
cd frontend && npm run lint # ESLint
```

## Environment Variables

Copy `.env.example` to `.env`. Key vars: `MONGODB_URI`, `JWT_SECRET`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `GOOGLE_MAPS_API_KEY`, `CLIENT_URL`, AWS S3 credentials, `REDIS_URL`, `PORT`.

## Tech Stack

- **Backend**: Express.js, Mongoose, JWT, Socket.io, Multer, Helmet, rate-limiting, Redis
- **Frontend**: React 19, Vite 6, React Router v7, Zustand 5, Tailwind CSS, react-hook-form + Zod, Lucide icons, date-fns
- **Integrations**: Razorpay (payments), Google Maps (tracking), Nodemailer (email), AWS S3 (uploads)