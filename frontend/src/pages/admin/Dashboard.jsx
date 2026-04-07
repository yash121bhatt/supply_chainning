import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services';
import { formatCurrency, formatDateTime, getShipmentStatusColor, getShipmentStatusLabel } from '../../utils/helpers';
import { Package, Users, TrendingUp, Clock, CheckCircle, ArrowRight, Truck } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalShippers: 0,
    totalCarriers: 0,
    totalDrivers: 0,
    totalShipments: 0,
    pendingShipments: 0,
    activeShipments: 0,
    deliveredShipments: 0,
    totalRevenue: 0,
    inactiveUsers: 0
  });
  const [recentShipments, setRecentShipments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await adminAPI.getDashboard();
      setStats(res.data.stats);
      setRecentShipments(res.data.recentShipments || []);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'bg-blue-500', bgColor: 'bg-blue-50', subtitle: `${stats.totalShippers} shippers` },
    { label: 'Total Shipments', value: stats.totalShipments, icon: Package, color: 'bg-purple-500', bgColor: 'bg-purple-50' },
    { label: 'Pending', value: stats.pendingShipments, icon: Clock, color: 'bg-yellow-500', bgColor: 'bg-yellow-50' },
    { label: 'In Transit', value: stats.activeShipments, icon: Truck, color: 'bg-indigo-500', bgColor: 'bg-indigo-50' },
    { label: 'Delivered', value: stats.deliveredShipments, icon: CheckCircle, color: 'bg-green-500', bgColor: 'bg-green-50' },
    { label: 'Total Revenue', value: formatCurrency(stats.totalRevenue || 0), icon: TrendingUp, color: 'bg-emerald-500', bgColor: 'bg-emerald-50' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">Platform overview and management</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  {stat.subtitle && <p className="text-xs text-gray-400 mt-1">{stat.subtitle}</p>}
                </div>
                <div className={`p-3 ${stat.bgColor} rounded-lg`}>
                  <Icon className={stat.color} size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Shipments */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Recent Shipments</h2>
          <Link to="/admin/shipments" className="text-primary-600 hover:text-primary-700 text-sm">
            View All
          </Link>
        </div>
        {recentShipments.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4">No shipments yet</p>
          </div>
        ) : (
          <div className="divide-y">
            {recentShipments.map((shipment) => (
              <Link
                key={shipment._id}
                to={`/admin/shipments/${shipment._id}`}
                className="block p-6 hover:bg-gray-50 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-primary-600">
                        {shipment.shipmentNumber}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getShipmentStatusColor(shipment.status)}`}>
                        {getShipmentStatusLabel(shipment.status)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center space-x-4 text-sm text-gray-600">
                      <span>{shipment.pickupLocation.city}</span>
                      <span>→</span>
                      <span>{shipment.deliveryLocation.city}</span>
                    </div>
                    <p className="mt-1 text-xs text-gray-400">
                      Shipper: {shipment.shipper?.name || 'N/A'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      {formatCurrency(shipment.pricing?.acceptedPrice || shipment.pricing?.quotedPrice)}
                    </p>
                    <p className="text-xs text-gray-500">{formatDateTime(shipment.pickupDate)}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
