import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { driverAPI, shipmentAPI } from '../../services';
import { formatCurrency, formatDate, getShipmentStatusColor, getShipmentStatusLabel } from '../../utils/helpers';
import { Package, MapPin, Phone, Navigation } from 'lucide-react';
import toast from 'react-hot-toast';

const ActiveShipments = () => {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadShipments();
  }, []);

  const loadShipments = async () => {
    setLoading(true);
    try {
      const response = await driverAPI.getActiveShipments();
      setShipments(response.data.shipments);
    } catch (error) {
      toast.error('Failed to load active shipments');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (shipmentId, newStatus) => {
    try {
      await shipmentAPI.updateStatus(shipmentId, { status: newStatus });
      toast.success(`Shipment ${newStatus.replace('_', ' ')}!`);
      loadShipments();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const openNavigation = (pickup, delivery) => {
    const pickupAddr = `${pickup.address}, ${pickup.city}, ${pickup.state}`;
    const deliveryAddr = `${delivery.address}, ${delivery.city}, ${delivery.state}`;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(pickupAddr)}&destination=${encodeURIComponent(deliveryAddr)}`;
    window.open(url, '_blank');
  };

  const getActionButtons = (shipment) => {
    switch (shipment.status) {
      case 'assigned':
        return (
          <button
            onClick={() => handleStatusUpdate(shipment._id, 'picked_up')}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium"
          >
            Mark Picked Up
          </button>
        );
      case 'picked_up':
        return (
          <button
            onClick={() => handleStatusUpdate(shipment._id, 'in_transit')}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium"
          >
            Start Transit
          </button>
        );
      case 'in_transit':
        return (
          <button
            onClick={() => handleStatusUpdate(shipment._id, 'delivered')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
          >
            Mark Delivered
          </button>
        );
      default:
        return null;
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
        <h1 className="text-2xl font-bold text-gray-900">Active Shipments</h1>
        <p className="text-gray-600">Manage and track your assigned shipments</p>
      </div>

      {/* Shipments List */}
      {shipments.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No active shipments</h3>
          <p className="mt-2 text-gray-500">You don't have any active shipments at the moment.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {shipments.map((shipment) => (
            <div key={shipment._id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              {/* Header */}
              <div className="p-6 border-b bg-gradient-to-r from-primary-500 to-primary-600">
                <div className="flex items-center justify-between text-white">
                  <div>
                    <p className="text-sm opacity-80">{shipment.shipmentNumber}</p>
                    <h3 className="text-xl font-bold mt-1">{shipment.goodsDetails.description}</h3>
                  </div>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getShipmentStatusColor(shipment.status)} bg-opacity-20 text-white`}>
                    {getShipmentStatusLabel(shipment.status)}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Route */}
                <div className="flex items-start space-x-4 mb-6">
                  <div className="flex-1">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <div className="w-2 h-2 bg-green-600 rounded-full" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">PICKUP</p>
                        <p className="font-medium text-gray-900">{shipment.pickupLocation.address}</p>
                        <p className="text-sm text-gray-600">{shipment.pickupLocation.city}, {shipment.pickupLocation.state}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-center py-2">
                    <div className="h-8 w-0.5 bg-gray-200" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <div className="w-2 h-2 bg-red-600 rounded-full" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">DELIVERY</p>
                        <p className="font-medium text-gray-900">{shipment.deliveryLocation.address}</p>
                        <p className="text-sm text-gray-600">{shipment.deliveryLocation.city}, {shipment.deliveryLocation.state}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <Package className="text-gray-400 mb-1" size={16} />
                    <p className="text-xs text-gray-600">Weight</p>
                    <p className="font-semibold text-gray-900">{shipment.goodsDetails.weight} kg</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <MapPin className="text-gray-400 mb-1" size={16} />
                    <p className="text-xs text-gray-600">Distance</p>
                    <p className="font-semibold text-gray-900">~{shipment.distance || 'N/A'} km</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <Package className="text-gray-400 mb-1" size={16} />
                    <p className="text-xs text-gray-600">Earnings</p>
                    <p className="font-semibold text-gray-900">{formatCurrency((shipment.pricing.acceptedPrice || shipment.pricing.quotedPrice) * 0.7)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <Package className="text-gray-400 mb-1" size={16} />
                    <p className="text-xs text-gray-600">Pickup Date</p>
                    <p className="font-semibold text-gray-900">{formatDate(shipment.pickupDate)}</p>
                  </div>
                </div>

                {/* Shipper & Vehicle Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-xs text-blue-600 mb-2">SHIPPER</p>
                    <p className="font-semibold text-blue-900">{shipment.shipper.name}</p>
                    <a href={`tel:${shipment.shipper.phone}`} className="text-sm text-blue-700 hover:text-blue-800 flex items-center mt-1">
                      <Phone size={14} className="mr-1" />
                      {shipment.shipper.phone}
                    </a>
                  </div>
                  {shipment.vehicle && (
                    <div className="bg-purple-50 rounded-lg p-4">
                      <p className="text-xs text-purple-600 mb-2">VEHICLE</p>
                      <p className="font-semibold text-purple-900">{shipment.vehicle.vehicleNumber}</p>
                      <p className="text-sm text-purple-700">{shipment.vehicle.brand} {shipment.vehicle.model}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                  {getActionButtons(shipment)}
                  <button
                    onClick={() => openNavigation(shipment.pickupLocation, shipment.deliveryLocation)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium flex items-center"
                  >
                    <Navigation size={16} className="mr-2" />
                    Open Navigation
                  </button>
                  {shipment.carrier?.phone && (
                    <a
                      href={`tel:${shipment.carrier.phone}`}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium flex items-center"
                    >
                      <Phone size={16} className="mr-2" />
                      Call Carrier
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActiveShipments;