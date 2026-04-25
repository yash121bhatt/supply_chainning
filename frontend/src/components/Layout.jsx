import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../context/AuthContext';
import { authAPI } from '../services';
import { LogOut, User, Menu, X, LayoutDashboard, Package, Truck, MapPin, Users, DollarSign, Shield, BarChart3 } from 'lucide-react';
import { useState } from 'react';
import HeaderProfile from './HeaderProfile';

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNavItems = () => {
    switch (user?.role) {
      case 'shipper':
        return [
          { label: 'Dashboard', path: '/shipper/dashboard', icon: LayoutDashboard },
          { label: 'My Shipments', path: '/shipper/shipments', icon: Package },
          { label: 'Create Shipment', path: '/shipper/shipments/create', icon: Truck },
          { label: 'Profile', path: '/shipper/profile', icon: User }
        ];
      case 'carrier':
        return [
          { label: 'Dashboard', path: '/carrier/dashboard', icon: LayoutDashboard },
          { label: 'Available Loads', path: '/carrier/shipments', icon: Package },
          { label: 'My Shipments', path: '/carrier/my-shipments', icon: Truck },
          { label: 'My Vehicles', path: '/carrier/vehicles', icon: Truck },
          { label: 'My Drivers', path: '/carrier/drivers', icon: Users },
          { label: 'Earnings', path: '/carrier/earnings', icon: DollarSign }
        ];
      case 'driver':
        return [
          { label: 'Dashboard', path: '/driver/dashboard', icon: LayoutDashboard },
          { label: 'Active Shipments', path: '/driver/shipments', icon: Package },
          { label: 'Earnings', path: '/driver/earnings', icon: DollarSign },
          { label: 'Profile', path: '/driver/profile', icon: User }
        ];
      case 'admin':
        return [
          { label: 'Dashboard', path: '/admin/dashboard', icon: BarChart3 },
          { label: 'Users', path: '/admin/users', icon: Users },
          { label: 'Shipments', path: '/admin/shipments', icon: Package },
          { label: 'Profile', path: '/admin/profile', icon: User }
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();
  const getPageTitle = () => {
    const matches = navItems.filter(item => location.pathname.startsWith(item.path));
    const bestMatch = matches.sort((a, b) => b.path.length - a.path.length)[0];
    return bestMatch?.label || 'Dashboard';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-4 border-b">
            <h1 className="text-xl font-bold text-primary-600">SupplyChain</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
          </div>

          {/* User Info */}
          <div className="p-4 border-b">
            <div className="flex items-center space-x-3">
{user?.avatar ? (
                  <img
                    src={user.avatar}
                  alt={user?.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <User className="text-primary-600" size={18} />
                </div>
              )}
              <div>
                <p className="font-medium text-gray-900">{user?.name}</p>
                <p className="text-sm text-gray-500 capitalize">{user?.role}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white border-b px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-600 hover:text-gray-900"
            >
              <Menu size={24} />
            </button>
            <h2 className="text-lg font-semibold text-gray-900">{getPageTitle()}</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/tracking')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              title="Track Shipment"
            >
              <MapPin size={20} />
            </button>
            <HeaderProfile />
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;