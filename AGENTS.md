# AGENTS.md - Supply Chain Platform

Monorepo (npm workspaces): backend + frontend. Four role-based portals: admin, shipper, carrier, driver.

## Commands

```bash
npm run dev                    # Backend (5000) + frontend (5173)
cd backend && npm run dev      # Backend only (nodemon)
cd backend && npm test         # Jest with coverage
cd backend && npm test -- --testNamePattern="pattern"  # Single test
cd backend && npm run create-admin  # Creates admin@supplychain.com / admin123
cd frontend && npm run lint    # ESLint (max-warnings: 100)
cd frontend && npm run build   # Production build → dist/
```

## Architecture

| Layer | Location |
|-------|----------|
| Backend entry | `backend/server.js` (default port: 5000) |
| Constants/enums | `backend/config/constants.js` (USER_ROLES, SHIPMENT_STATUS, etc.) |
| Controllers | `backend/controllers/` (uses asyncHandler wrapper) |
| Models | `backend/models/` |
| Frontend router | `frontend/src/App.jsx` (React Router v7) |
| Auth state | `frontend/src/context/AuthContext.jsx` (Zustand + persist) |
| API client | `frontend/src/services/api.js` (axios with interceptors) |
| Real-time | Socket.io on backend server |

**Note**: `backend/src/` is unused/legacy—ignore it.

## Key Patterns

### Backend: asyncHandler wrapper
```javascript
exports.handler = asyncHandler(async (req, res, next) => {
  if (!data) return next(new AppError('Not found', 404));
  res.status(200).json({ success: true, data: { item } });
});
```

### Backend: Error handling
- Use `AppError`: `next(new AppError('message', statusCode))`
- Always return after `next()`: `return next(new AppError(...))`

### Frontend: Axios interceptor unwraps responses
```javascript
// API returns response.data directly
const { shipments } = await api.get('/shipments');
// Controller sends { success: true, data: { shipments } }
```

### Frontend: Nested routes (React Router v7)
```jsx
<Route path="/shipper" element={<Layout />}>
  <Route index element={<Navigate to="/shipper/dashboard" replace />} />
  <Route path="dashboard" element={<ShipperDashboard />} />
</Route>
```
Use `<Layout><Outlet /></Layout>` pattern. Do NOT nest `<Routes>` inside `<Routes>`.

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

## Environment

Copy `.env.example` to `.env`. Required: `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRE`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `GOOGLE_MAPS_API_KEY`, `CLIENT_URL`, `AWS_*`, `SMTP_*`, `REDIS_URL`, `PORT`.
