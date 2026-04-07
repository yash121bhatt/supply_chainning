import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './context/AuthContext';
import Layout from './components/Layout';

import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ChangePassword from './pages/ChangePassword';
import Tracking from './pages/Tracking';

import ShipperDashboard from './pages/shipper/Dashboard';
import ShipperShipments from './pages/shipper/Shipments';
import CreateShipment from './pages/shipper/CreateShipment';
import ShipperProfile from './pages/shipper/Profile';

import CarrierDashboard from './pages/carrier/Dashboard';
import CarrierShipments from './pages/carrier/AvailableShipments';
import CarrierVehicles from './pages/carrier/Vehicles';
import CarrierProfile from './pages/carrier/Profile';
import CarrierDrivers from './pages/carrier/Drivers';
import CarrierEarnings from './pages/carrier/Earnings';

import DriverDashboard from './pages/driver/Dashboard';
import DriverShipments from './pages/driver/ActiveShipments';
import DriverProfile from './pages/driver/Profile';
import DriverEarnings from './pages/driver/Earnings';
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminShipments from './pages/admin/Shipments';
import AdminProfile from './pages/admin/Profile';
import ShipmentDetail from './pages/shipper/ShipmentDetail';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const RoleRedirect = () => {
  const { user } = useAuthStore();

  const roleRoutes = {
    shipper: '/shipper/dashboard',
    carrier: '/carrier/dashboard',
    driver: '/driver/dashboard',
    admin: '/admin/dashboard'
  };

  return <Navigate to={roleRoutes[user?.role] || '/shipper/dashboard'} replace />;
};

function App() {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Public Tracking */}
      <Route path="/tracking" element={<Tracking />} />
      <Route path="/tracking/:id" element={<Tracking />} />

      {/* Shipper Routes */}
      <Route
        path="/shipper"
        element={
          <ProtectedRoute allowedRoles={['shipper']}>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/shipper/dashboard" replace />} />
        <Route path="dashboard" element={<ShipperDashboard />} />
        <Route path="shipments" element={<ShipperShipments />} />
        <Route path="shipments/create" element={<CreateShipment />} />
        <Route path="shipments/:id" element={<ShipmentDetail />} />
        <Route path="profile" element={<ShipperProfile />} />
      </Route>

      {/* Carrier Routes */}
      <Route
        path="/carrier"
        element={
          <ProtectedRoute allowedRoles={['carrier']}>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/carrier/dashboard" replace />} />
        <Route path="dashboard" element={<CarrierDashboard />} />
        <Route path="shipments" element={<CarrierShipments />} />
        <Route path="vehicles" element={<CarrierVehicles />} />
        <Route path="drivers" element={<CarrierDrivers />} />
        <Route path="earnings" element={<CarrierEarnings />} />
        <Route path="profile" element={<CarrierProfile />} />
      </Route>

      {/* Driver Routes */}
      <Route
        path="/driver"
        element={
          <ProtectedRoute allowedRoles={['driver']}>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/driver/dashboard" replace />} />
        <Route path="dashboard" element={<DriverDashboard />} />
        <Route path="shipments" element={<DriverShipments />} />
        <Route path="earnings" element={<DriverEarnings />} />
        <Route path="profile" element={<DriverProfile />} />
      </Route>

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="shipments" element={<AdminShipments />} />
        <Route path="shipments/:id" element={<ShipmentDetail />} />
        <Route path="profile" element={<AdminProfile />} />
      </Route>

      {/* Default Route */}
      <Route path="/" element={<RoleRedirect />} />

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
