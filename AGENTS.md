# AGENTS.md - Supply Chain Platform

Monorepo (npm workspaces): backend + frontend. Four role-based portals: admin, shipper, carrier, driver.

## Commands

```bash
npm run dev                         # Backend (5000) + frontend (5173)
cd backend && npm run dev           # Backend only
cd backend && npm test             # Jest + coverage (requires MONGODB_URI)
cd backend && npm run create-admin # Creates admin@supplychain.com / admin123
cd frontend && npm run lint        # ESLint (fails at 100+ warnings)
cd frontend && npm run build       # Production → dist/
```

## Env Setup
```bash
cp .env.example .env  # Edit with credentials
```

## Architecture

| Layer | Location |
|-------|----------|
| Backend entry | `backend/server.js` (port 5000, Socket.io attached) |
| Constants/enums | `backend/config/constants.js` |
| Controllers | `backend/controllers/` (asyncHandler wrapper) |
| Routes | `backend/routes/` (auth, shipments, carriers, drivers, bids, admin, payments, notifications, chat, users, directory) |
| Models | `backend/models/` (User, Shipment, Vehicle, Bid, Chat, Notification, Transaction) |
| Test files | `backend/tests/*.test.js` |
| Frontend entry | `frontend/src/App.jsx` (React Router v7) |
| Auth state | `frontend/src/context/AuthContext.jsx` (Zustand + persist) |
| API client | `frontend/src/services/api.js` (axios, response unwrapped via interceptor) |

Note: `backend/src/` is a duplicate directory structure (controllers/routes/services/models) that is not referenced by server.js or any route file.

## Key Patterns

### Backend: asyncHandler + error handling
```javascript
exports.handler = asyncHandler(async (req, res, next) => {
  if (!data) return next(new AppError('Not found', 404));
  res.status(200).json({ success: true, data: { item } });
});
```

### Frontend: API response unwrapping
```javascript
// api.js interceptor returns response.data directly
const { shipments } = await api.get('/shipments');
// Controller: { success: true, data: { shipments } }

// FormData works automatically - Content-Type header auto-removed
const formData = new FormData();
formData.append('file', file);
await api.post('/upload', formData);
```

### Frontend: Nested routes (React Router v7)
```jsx
<Route path="/shipper" element={<Layout />}>
  <Route index element={<Navigate to="/shipper/dashboard" replace />} />
  <Route path="dashboard" element={<ShipperDashboard />} />
</Route>
```
Use `<Layout><Outlet /></Layout>`. Do NOT nest `<Routes>` inside `<Routes>`.

### Role-based access
- Roles: `admin`, `shipper`, `carrier`, `driver`
- Backend: `router.use(protect); router.delete('/:id', authorize('admin'), controller.delete);`
- Frontend: `<ProtectedRoute allowedRoles={['admin']}><Page /></ProtectedRoute>`

## Testing

```javascript
const request = require('supertest');
const app = require('../server');

describe('Auth', () => {
  it('should login', async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ email: 'test@test.com', password: 'password' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
```