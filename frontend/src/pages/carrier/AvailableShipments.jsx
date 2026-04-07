import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { shipmentAPI } from '../../services';
import { formatCurrency, formatDate, getShipmentStatusColor, getShipmentStatusLabel } from '../../utils/helpers';
import { Package, MapPin, Weight, Calendar, DollarSign, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';

const AvailableShipments = () => {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    pickupLocation: '',
    deliveryLocation: '',
    shipmentType: ''
  });

  useEffect(() => {
    loadShipments();
  }, [filters]);

  const loadShipments = async () => {
    setLoading(true);
    try {
      const response = await shipmentAPI.getAvailable(filters);
      setShipments(response.data.shipments);
    } catch (error) {
      toast.error('Failed to load available shipments');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (shipmentId) => {
    const price = prompt('Enter accepted price:');
    if (!price) return;

    try {
      await shipmentAPI.accept(shipmentId, { acceptedPrice: parseFloat(price) });
      toast.success('Shipment accepted successfully!');
      loadShipments();
    } catch (error) {
      toast.error(error.message || 'Failed to accept shipment');
    }
  };

  const handleReject = async (shipmentId) => {
    if (!confirm('Are you sure you want to reject this shipment?')) return;

    try {
      await shipmentAPI.reject(shipmentId, { reason: 'Not interested' });
      toast.success('Shipment rejected');
      loadShipments();
    } catch (error) {
      toast.error('Failed to reject shipment');
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
        <h1 className="text-2xl font-bold text-gray-900">Available Shipments</h1>
        <p className="text-gray-600">Browse and accept shipments that match your fleet</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Pickup Location</label>
            <input
              type="text"
              value={filters.pickupLocation}
              onChange={(e) => setFilters({ ...filters, pickupLocation: e.target.value })}
              placeholder="City name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Location</label>
            <input
              type="text"
              value={filters.deliveryLocation}
              onChange={(e) => setFilters({ ...filters, deliveryLocation: e.target.value })}
              placeholder="City name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Shipment Type</label>
            <select
              value={filters.shipmentType}
              onChange={(e) => setFilters({ ...filters, shipmentType: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white"
            >
              <option value="">All Types</option>
              <option value="full_truckload">Full Truckload</option>
              <option value="less_than_truckload">Less Than Truckload</option>
              <option value="partial_truckload">Partial Truckload</option>
              <option value="container">Container</option>
            </select>
          </div>
        </div>
      </div>

      {/* Shipments Grid */}
      {shipments.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No shipments found</h3>
          <p className="mt-2 text-gray-500">
            {filters.pickupLocation || filters.deliveryLocation || filters.shipmentType
              ? 'Try adjusting your filters'
              : 'Check back later for new shipment opportunities.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {shipments.map((shipment) => (
            <div key={shipment._id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              {/* Card Header */}
              <div className="p-6 border-b">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-primary-600">{shipment.shipmentNumber}</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getShipmentStatusColor(shipment.status)}`}>
                    {getShipmentStatusLabel(shipment.status)}
                  </span>
                </div>
                <p className="font-medium text-gray-900">{shipment.goodsDetails.description}</p>
              </div>

              {/* Card Body */}
              <div className="p-6 space-y-4">
                {/* Route */}
                <div className="flex items-start space-x-3">
                  <MapPin className="text-primary-600 flex-shrink-0 mt-0.5" size={18} />
                  <div className="text-sm">
                    <p className="text-gray-900">{shipment.pickupLocation.city}</p>
                    <p className="text-gray-500">↓</p>
                    <p className="text-gray-900">{shipment.deliveryLocation.city}</p>
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Weight className="text-gray-400" size={16} />
                    <div>
                      <p className="text-xs text-gray-600">Weight</p>
                      <p className="text-sm font-medium text-gray-900">{shipment.goodsDetails.weight} kg</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="text-gray-400" size={16} />
                    <div>
                      <p className="text-xs text-gray-600">Pickup</p>
                      <p className="text-sm font-medium text-gray-900">{formatDate(shipment.pickupDate)}</p>
                    </div>
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div>
                    <p className="text-sm text-gray-600">Quoted Price</p>
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(shipment.pricing.quotedPrice)}</p>
                  </div>
                </div>
              </div>

              {/* Card Actions */}
              <div className="p-4 bg-gray-50 flex space-x-2">
                <button
                  onClick={() => handleAccept(shipment._id)}
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                >
                  <Check size={18} className="mr-2" />
                  Accept
                </button>
                <button
                  onClick={() => handleReject(shipment._id)}
                  className="flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AvailableShipments;