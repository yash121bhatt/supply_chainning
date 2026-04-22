import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { shipmentAPI } from '../../services';
import { formatCurrency, formatDateTime } from '../../utils/helpers';
import { Package, TrendingUp, Clock, CheckCircle, Plus, ArrowRight, Truck } from 'lucide-react';
import toast from 'react-hot-toast';
import CarrierDirectory from '../../components/CarrierDirectory';
import ProfileModal from '../../components/ProfileModal';

const Dashboard = () => {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inTransit: 0,
    delivered: 0,
    totalSpent: 0
  });
  const [recentShipments, setRecentShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [recentRes, allRes] = await Promise.all([
        shipmentAPI.getMyShipments({ limit: 10 }),
        shipmentAPI.getMyShipments({ limit: 1000 })
      ]);
      const shipments = recentRes.data?.shipments || recentRes.shipments || [];
      const allShipments = allRes.data?.shipments || allRes.shipments || [];

      // Calculate stats from ALL shipments
      const totalSpent = allShipments
        .filter(s => s.status === 'delivered')
        .reduce((sum, s) => sum + (s.pricing.acceptedPrice || s.pricing.quotedPrice), 0);

      setStats({
        total: shipments.length,
        pending: shipments.filter(s => s.status === 'pending').length,
        inTransit: shipments.filter(s => ['assigned', 'picked_up', 'in_transit'].includes(s.status)).length,
        delivered: shipments.filter(s => s.status === 'delivered').length,
        totalSpent
      });
      setRecentShipments(shipments);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      label: 'Total Shipments',
      value: stats.total,
      icon: Package,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50'
    },
    {
      label: 'Pending',
      value: stats.pending,
      icon: Clock,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50'
    },
    {
      label: 'In Transit',
      value: stats.inTransit,
      icon: Truck,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50'
    },
    {
      label: 'Delivered',
      value: stats.delivered,
      icon: CheckCircle,
      color: 'bg-green-500',
      bgColor: 'bg-green-50'
    }
  ];

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      assigned: 'bg-blue-100 text-blue-800',
      picked_up: 'bg-purple-100 text-purple-800',
      in_transit: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="flex gap-6">
      <div className="flex-1 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Welcome back! Here's your shipment overview.</p>
          </div>
          <Link
            to="/shipper/shipments/create"
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            <Plus size={20} className="mr-2" />
            New Shipment
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 ${stat.bgColor} rounded-lg`}>
                    <Icon className={stat.color} size={24} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-50 rounded-lg mr-4">
              <TrendingUp className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalSpent)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Recent Shipments</h2>
          </div>
          {recentShipments.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No shipments yet</h3>
              <p className="mt-2 text-gray-500">Get started by creating your first shipment.</p>
              <Link
                to="/shipper/shipments/create"
                className="mt-4 inline-flex items-center text-primary-600 hover:text-primary-700"
              >
                Create Shipment <ArrowRight size={16} className="ml-1" />
              </Link>
            </div>
          ) : (
            <div className="divide-y">
              {recentShipments.map((shipment) => (
                <Link
                  key={shipment._id}
                  to={`/shipper/shipments/${shipment._id}`}
                  className="block p-6 hover:bg-gray-50 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-primary-600">
                          {shipment.shipmentNumber}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(shipment.status)}`}>
                          {shipment.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                        <span>{shipment.pickupLocation.city}</span>
                        <span>→</span>
                        <span>{shipment.deliveryLocation.city}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {formatCurrency(shipment.pricing.acceptedPrice || shipment.pricing.quotedPrice)}
                      </p>
                      <p className="text-sm text-gray-500">{formatDateTime(shipment.pickupDate)}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
          {recentShipments.length > 0 && (
            <div className="p-4 border-t">
              <Link
                to="/shipper/shipments"
                className="block text-center text-sm text-primary-600 hover:text-primary-700"
              >
                View all shipments →
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="w-96 flex-shrink-0">
        <CarrierDirectory onViewProfile={setSelectedProfile} />
      </div>

      {selectedProfile && (
        <ProfileModal
          profile={selectedProfile}
          type="carrier"
          onClose={() => setSelectedProfile(null)}
        />
      )}
    </div>
  );
};

export default Dashboard;