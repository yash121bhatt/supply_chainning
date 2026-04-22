import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { carrierAPI, shipmentAPI } from '../../services';
import { formatCurrency, formatDateTime } from '../../utils/helpers';
import { Package, Truck, DollarSign, TrendingUp, Users, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import ShipperDirectory from '../../components/ShipperDirectory';
import ProfileModal from '../../components/ProfileModal';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalShipments: 0,
    activeShipments: 0,
    completedShipments: 0,
    totalVehicles: 0,
    availableVehicles: 0,
    monthlyRevenue: 0
  });
  const [recentShipments, setRecentShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await carrierAPI.getDashboard();
      setStats(response.data.stats);
      setRecentShipments(response.data.recentShipments || []);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      label: 'Total Shipments',
      value: stats.totalShipments,
      icon: Package,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50'
    },
    {
      label: 'Active Shipments',
      value: stats.activeShipments,
      icon: Truck,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50'
    },
    {
      label: 'Completed',
      value: stats.completedShipments,
      icon: Package,
      color: 'bg-green-500',
      bgColor: 'bg-green-50'
    },
    {
      label: 'Available Vehicles',
      value: stats.availableVehicles,
      icon: Truck,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50'
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
            <h1 className="text-2xl font-bold text-gray-900">Carrier Dashboard</h1>
            <p className="text-gray-600">Overview of your logistics operations</p>
          </div>
          <Link
            to="/carrier/shipments"
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            <Package size={20} className="mr-2" />
            Available Loads
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-50 rounded-lg mr-4">
                <DollarSign className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Monthly Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.monthlyRevenue)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-50 rounded-lg mr-4">
                <TrendingUp className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Vehicles</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalVehicles}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6 border-b flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Shipments</h2>
            <Link to="/carrier/shipments" className="text-primary-600 hover:text-primary-700 text-sm">
              View All
            </Link>
          </div>
          {recentShipments.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No shipments yet</h3>
              <p className="mt-2 text-gray-500">Accept your first shipment to get started.</p>
            </div>
          ) : (
            <div className="divide-y">
              {recentShipments.map((shipment) => (
                <Link
                  key={shipment._id}
                  to={`/carrier/dashboard`}
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
                        <span className="flex items-center">
                          <MapPin size={14} className="mr-1" />
                          {shipment.pickupLocation.city}
                        </span>
                        <span>→</span>
                        <span className="flex items-center">
                          <MapPin size={14} className="mr-1" />
                          {shipment.deliveryLocation.city}
                        </span>
                      </div>
                      {shipment.driver && (
                        <p className="mt-2 text-sm text-gray-500">
                          Driver: {shipment.driver.name}
                        </p>
                      )}
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
        </div>
      </div>

      <div className="w-96 flex-shrink-0">
        <ShipperDirectory onViewProfile={setSelectedProfile} />
      </div>

      {selectedProfile && (
        <ProfileModal
          profile={selectedProfile}
          type="shipper"
          onClose={() => setSelectedProfile(null)}
        />
      )}
    </div>
  );
};

export default Dashboard;