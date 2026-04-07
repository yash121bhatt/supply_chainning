import { useEffect, useState } from 'react';
import { driverAPI, shipmentAPI } from '../../services';
import { formatCurrency, formatDateTime, getShipmentStatusColor, getShipmentStatusLabel } from '../../utils/helpers';
import { Package, MapPin, Truck, DollarSign, Clock, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalShipments: 0,
    completedShipments: 0,
    monthlyEarnings: 0
  });
  const [activeShipment, setActiveShipment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await driverAPI.getDashboard();
      setStats(response.data.stats);
      setActiveShipment(response.data.activeShipment);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    if (!activeShipment) return;

    try {
      await shipmentAPI.updateStatus(activeShipment._id, { status: newStatus });
      toast.success(`Shipment ${newStatus.replace('_', ' ')}!`);
      loadDashboard();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Driver Dashboard</h1>
        <p className="text-gray-600">Track your shipments and earnings</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Shipments</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalShipments}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Package className="text-blue-600" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.completedShipments}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <CheckCircle className="text-green-600" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Monthly Earnings</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats.monthlyEarnings)}</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <DollarSign className="text-yellow-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Active Shipment */}
      {activeShipment ? (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b bg-gradient-to-r from-primary-500 to-primary-600">
            <div className="flex items-center justify-between text-white">
              <div>
                <p className="text-sm opacity-80">Active Shipment</p>
                <h2 className="text-2xl font-bold mt-1">{activeShipment.shipmentNumber}</h2>
              </div>
              <span className={`px-4 py-2 text-sm font-medium rounded-full ${getShipmentStatusColor(activeShipment.status)} bg-opacity-20 text-white`}>
                {getShipmentStatusLabel(activeShipment.status)}
              </span>
            </div>
          </div>

          <div className="p-6">
            {/* Route */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">Pickup</p>
                <p className="font-semibold text-gray-900">{activeShipment.pickupLocation.address}</p>
                <p className="text-sm text-gray-500">{activeShipment.pickupLocation.city}, {activeShipment.pickupLocation.state}</p>
              </div>
              <div className="px-4">
                <MapPin className="text-primary-600" size={32} />
              </div>
              <div className="flex-1 text-right">
                <p className="text-sm text-gray-600 mb-1">Delivery</p>
                <p className="font-semibold text-gray-900">{activeShipment.deliveryLocation.address}</p>
                <p className="text-sm text-gray-500">{activeShipment.deliveryLocation.city}, {activeShipment.deliveryLocation.state}</p>
              </div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <Package className="text-gray-400 mx-auto mb-2" size={20} />
                <p className="text-xs text-gray-600">Weight</p>
                <p className="font-semibold text-gray-900">{activeShipment.goodsDetails.weight} kg</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <Clock className="text-gray-400 mx-auto mb-2" size={20} />
                <p className="text-xs text-gray-600">Pickup Date</p>
                <p className="font-semibold text-gray-900">{formatDateTime(activeShipment.pickupDate)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <DollarSign className="text-gray-400 mx-auto mb-2" size={20} />
                <p className="text-xs text-gray-600">Earnings</p>
                <p className="font-semibold text-gray-900">{formatCurrency(activeShipment.pricing.acceptedPrice * 0.7)}</p>
              </div>
            </div>

            {/* Shipper Info */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <p className="text-xs text-blue-600 mb-1">Shipper</p>
              <p className="font-semibold text-blue-900">{activeShipment.shipper.name}</p>
              <p className="text-sm text-blue-700">{activeShipment.shipper.phone}</p>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              {activeShipment.status === 'assigned' && (
                <button
                  onClick={() => handleStatusUpdate('picked_up')}
                  className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium"
                >
                  Mark as Picked Up
                </button>
              )}
              {activeShipment.status === 'picked_up' && (
                <button
                  onClick={() => handleStatusUpdate('in_transit')}
                  className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium"
                >
                  Start Transit
                </button>
              )}
              {activeShipment.status === 'in_transit' && (
                <button
                  onClick={() => handleStatusUpdate('delivered')}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                >
                  Mark as Delivered
                </button>
              )}
              {activeShipment.vehicle && (
                <div className="flex items-center px-4 py-2 bg-gray-100 rounded-lg">
                  <Truck className="text-gray-600 mr-2" size={20} />
                  <div>
                    <p className="text-xs text-gray-600">Vehicle</p>
                    <p className="text-sm font-medium text-gray-900">{activeShipment.vehicle.vehicleNumber}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Truck className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No active shipments</h3>
          <p className="mt-2 text-gray-500">Wait for your carrier to assign you a shipment.</p>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Contact Shipper</h3>
          {activeShipment?.shipper && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">{activeShipment.shipper.name}</p>
              <a href={`tel:${activeShipment.shipper.phone}`} className="text-primary-600 hover:text-primary-700 text-sm">
                {activeShipment.shipper.phone}
              </a>
            </div>
          )}
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Contact Carrier</h3>
          {activeShipment?.carrier && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">{activeShipment.carrier.name}</p>
              <a href={`tel:${activeShipment.carrier.phone}`} className="text-primary-600 hover:text-primary-700 text-sm">
                {activeShipment.carrier.phone}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;