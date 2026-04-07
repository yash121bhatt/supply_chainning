import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { shipmentAPI } from '../services';
import { formatDateTime, getShipmentStatusColor, getShipmentStatusLabel } from '../utils/helpers';
import toast from 'react-hot-toast';
import { Search, MapPin, Package, Calendar, Truck, ArrowLeft } from 'lucide-react';

const Tracking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [shipmentNumber, setShipmentNumber] = useState(id || '');
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!shipmentNumber.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const response = await shipmentAPI.track(shipmentNumber);
      setTrackingData(response.data.shipment);
    } catch {
      toast.error('Shipment not found. Check the tracking number.');
      setTrackingData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft size={18} className="mr-1" /> Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Track Shipment</h1>
        <p className="text-gray-600">Enter your shipment tracking number</p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={shipmentNumber}
              onChange={(e) => setShipmentNumber(e.target.value)}
              placeholder="SHP2026123456"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Track'}
          </button>
        </div>
      </form>

      {searched && !loading && trackingData && (
        <div className="space-y-6">
          {/* Status */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Package className="text-primary-600" size={24} />
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{trackingData.shipmentNumber}</h2>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getShipmentStatusColor(trackingData.status)}`}>
                    {getShipmentStatusLabel(trackingData.status)}
                  </span>
                </div>
              </div>
            </div>

            {/* Route */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1 flex items-center"><MapPin size={14} className="mr-1" /> Pickup</p>
                <p className="font-medium text-gray-900">{trackingData.pickupLocation?.city || 'N/A'}</p>
                <p className="text-sm text-gray-500">{trackingData.pickupLocation?.state || ''}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1 flex items-center"><MapPin size={14} className="mr-1" /> Delivery</p>
                <p className="font-medium text-gray-900">{trackingData.deliveryLocation?.city || 'N/A'}</p>
                <p className="text-sm text-gray-500">{trackingData.deliveryLocation?.state || ''}</p>
              </div>
            </div>

            {/* Schedule */}
            <div className="grid grid-cols-2 gap-6 mt-4 pt-4 border-t">
              <div>
                <p className="text-sm text-gray-600 mb-1 flex items-center"><Calendar size={14} className="mr-1" /> Pickup Date</p>
                <p className="font-medium">{formatDateTime(trackingData.pickupDate)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1 flex items-center"><Calendar size={14} className="mr-1" /> Estimated Arrival</p>
                <p className="font-medium">{trackingData.estimatedArrival ? formatDateTime(trackingData.estimatedArrival) : 'TBD'}</p>
              </div>
            </div>
          </div>

          {/* Driver & Vehicle */}
          {(trackingData.driver || trackingData.vehicle) && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Truck className="text-primary-600 mr-2" size={20} />
                Delivery Crew
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {trackingData.driver && (
                  <div>
                    <p className="text-sm text-gray-600">Driver</p>
                    <p className="font-medium text-gray-900">{trackingData.driver.name}</p>
                    <p className="text-sm text-gray-500">{trackingData.driver.phone}</p>
                  </div>
                )}
                {trackingData.vehicle && (
                  <div>
                    <p className="text-sm text-gray-600">Vehicle</p>
                    <p className="font-medium text-gray-900">{trackingData.vehicle.vehicleNumber}</p>
                    <p className="text-sm text-gray-500">{trackingData.vehicle.vehicleType}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Status Timeline */}
          {trackingData.statusHistory && trackingData.statusHistory.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Journey Timeline</h2>
              <div className="space-y-4">
                {trackingData.statusHistory.map((history, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className={`flex-shrink-0 w-3 h-3 mt-2 rounded-full ${
                      index === trackingData.statusHistory.length - 1 ? 'bg-primary-600' : 'bg-gray-300'
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900">{getShipmentStatusLabel(history.status)}</p>
                        <p className="text-sm text-gray-500">{formatDateTime(history.timestamp)}</p>
                      </div>
                      {history.location && (
                        <p className="text-sm text-gray-500 mt-1">{history.location.city}{history.location.state ? `, ${history.location.state}` : ''}</p>
                      )}
                      {history.notes && <p className="text-sm text-gray-600 mt-1">{history.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {searched && !loading && !trackingData && (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-500">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No results found</h3>
          <p className="mt-2">Please check the tracking number and try again.</p>
        </div>
      )}
    </div>
  );
};

export default Tracking;
