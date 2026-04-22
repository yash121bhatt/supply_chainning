import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { shipmentAPI } from '../../services';
import { formatCurrency, formatDateTime, getShipmentStatusColor, getShipmentStatusLabel } from '../../utils/helpers';
import { Package, MapPin, Calendar, DollarSign, Truck, User, ArrowLeft, Clock, FileText, Star, MessageCircle, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import ChatPanel from '../../components/ChatPanel';
import api from '../../services/api';
import useAuthStore from '../../context/AuthContext';

const ShipmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [shipment, setShipment] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [counterAmount, setCounterAmount] = useState('');
  const [selectedBid, setSelectedBid] = useState(null);

  useEffect(() => {
    loadShipment();
  }, [id]);

  const loadShipment = async () => {
    setLoading(true);
    try {
      const res = await shipmentAPI.getById(id);
      setShipment(res.data?.shipment || res.shipment || res.data);
      await loadBids();
    } catch (error) {
      toast.error('Failed to load shipment details');
      navigate('/shipper/shipments');
    } finally {
      setLoading(false);
    }
  };

  const loadBids = async () => {
    try {
      const data = await api.get(`/bids/shipment/${id}`);
      setBids(data.bids || []);
    } catch (error) {
      console.error('Failed to load bids:', error);
    }
  };

  const handleAcceptBid = async (bidId) => {
    try {
      await api.put(`/bids/${bidId}/accept`);
      toast.success('Bid accepted successfully');
      loadShipment();
      loadBids();
    } catch (error) {
      toast.error(error.message || 'Failed to accept bid');
    }
  };

  const handleRejectBid = async (bidId) => {
    try {
      await api.put(`/bids/${bidId}/reject`);
      toast.success('Bid rejected');
      loadBids();
    } catch (error) {
      toast.error(error.message || 'Failed to reject bid');
    }
  };

  const openCounterModal = (bid) => {
    setSelectedBid(bid);
    setCounterAmount(bid.amount.toString());
  };

  const handleCounterOffer = async () => {
    if (!selectedBid || !counterAmount) return;
    try {
      await api.put(`/bids/${selectedBid._id}/counter`, {
        counterAmount: parseFloat(counterAmount)
      });
      toast.success('Counter offer sent');
      setSelectedBid(null);
      loadBids();
    } catch (error) {
      toast.error(error.message || 'Failed to send counter offer');
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this shipment?')) return;

    try {
      await shipmentAPI.cancel(id);
      toast.success('Shipment cancelled successfully');
      loadShipment();
    } catch (error) {
      toast.error(error.message || 'Failed to cancel shipment');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!shipment) {
    return null;
  }

  const canCancel = ['pending', 'assigned'].includes(shipment.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center">
        <button
          onClick={() => navigate('/shipper/shipments')}
          className="mr-4 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{shipment.shipmentNumber}</h1>
          <p className="text-gray-600">Shipment Details</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={() => setShowChat(true)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <MessageCircle size={18} />
            Chat
          </button>
          <span className={`px-3 py-1 text-sm font-medium rounded-full ${getShipmentStatusColor(shipment.status)}`}>
            {getShipmentStatusLabel(shipment.status)}
          </span>
        </div>
      </div>

      {/* Status Timeline */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Clock className="text-primary-600 mr-2" size={20} />
          Status History
        </h2>
        <div className="space-y-4">
          {shipment.statusHistory.map((history, index) => (
            <div key={index} className="flex items-start space-x-4">
              <div className={`flex-shrink-0 w-3 h-3 mt-1.5 rounded-full ${
                index === shipment.statusHistory.length - 1 ? 'bg-primary-600' : 'bg-gray-300'
              }`} />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-gray-900">{getShipmentStatusLabel(history.status)}</p>
                  <p className="text-sm text-gray-500">{formatDateTime(history.timestamp)}</p>
                </div>
                {history.notes && (
                  <p className="text-sm text-gray-600 mt-1">{history.notes}</p>
                )}
                {history.location && (
                  <p className="text-sm text-gray-500 mt-1">{history.location.city}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Route */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <MapPin className="text-primary-600 mr-2" size={20} />
            Route
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Pickup</p>
              <p className="font-medium text-gray-900">{shipment.pickupLocation.address}</p>
              <p className="text-sm text-gray-600">{shipment.pickupLocation.city}, {shipment.pickupLocation.state} - {shipment.pickupLocation.zipCode}</p>
            </div>
            <div className="border-t pt-4">
              <p className="text-sm text-gray-600 mb-1">Delivery</p>
              <p className="font-medium text-gray-900">{shipment.deliveryLocation.address}</p>
              <p className="text-sm text-gray-600">{shipment.deliveryLocation.city}, {shipment.deliveryLocation.state} - {shipment.deliveryLocation.zipCode}</p>
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Calendar className="text-primary-600 mr-2" size={20} />
            Schedule
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Pickup Date</p>
              <p className="font-medium text-gray-900">{formatDateTime(shipment.pickupDate)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Delivery Date</p>
              <p className="font-medium text-gray-900">{formatDateTime(shipment.deliveryDate)}</p>
            </div>
            {shipment.estimatedArrival && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Estimated Arrival</p>
                <p className="font-medium text-gray-900">{formatDateTime(shipment.estimatedArrival)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Goods */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Package className="text-primary-600 mr-2" size={20} />
            Goods Details
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600 mb-1">Description</p>
              <p className="text-gray-900">{shipment.goodsDetails.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Weight</p>
                <p className="font-medium text-gray-900">{shipment.goodsDetails.weight} {shipment.goodsDetails.weightUnit}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Value</p>
                <p className="font-medium text-gray-900">{formatCurrency(shipment.goodsDetails.value)}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {shipment.goodsDetails.isFragile && (
                <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Fragile</span>
              )}
              {shipment.goodsDetails.isHazardous && (
                <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Hazardous</span>
              )}
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <DollarSign className="text-primary-600 mr-2" size={20} />
            Pricing
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600 mb-1">Quoted Price</p>
              <p className="font-medium text-gray-900">{formatCurrency(shipment.pricing.quotedPrice)}</p>
            </div>
            {shipment.pricing.acceptedPrice && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Accepted Price</p>
                <p className="font-medium text-primary-600">{formatCurrency(shipment.pricing.acceptedPrice)}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Assigned Carrier & Driver */}
      {(shipment.carrier || shipment.driver) && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <User className="text-primary-600 mr-2" size={20} />
            Assigned Team
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {shipment.carrier && (
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Truck className="text-primary-600" size={24} />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{shipment.carrier.name}</p>
                  {shipment.carrier.carrierDetails?.companyName && (
                    <p className="text-sm text-gray-600">{shipment.carrier.carrierDetails.companyName}</p>
                  )}
                  <p className="text-sm text-gray-500">{shipment.carrier.phone}</p>
                </div>
              </div>
            )}
            {shipment.driver && (
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="text-green-600" size={24} />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{shipment.driver.name}</p>
                  <p className="text-sm text-gray-600">Driver</p>
                  <p className="text-sm text-gray-500">{shipment.driver.phone}</p>
                </div>
              </div>
            )}
            {shipment.vehicle && (
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Truck className="text-purple-600" size={24} />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{shipment.vehicle.vehicleNumber}</p>
                  <p className="text-sm text-gray-600">{shipment.vehicle.brand} {shipment.vehicle.model}</p>
                  <p className="text-sm text-gray-500">Capacity: {shipment.vehicle.capacity.weight} kg</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Proof of Delivery */}
      {shipment.proofOfDelivery && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FileText className="text-primary-600 mr-2" size={20} />
            Proof of Delivery
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {shipment.proofOfDelivery.deliveryImage && (
              <div>
                <p className="text-sm text-gray-600 mb-2">Delivery Photo</p>
                <img
                  src={shipment.proofOfDelivery.deliveryImage}
                  alt="Proof of delivery"
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
            )}
            {shipment.proofOfDelivery.signatureImage && (
              <div>
                <p className="text-sm text-gray-600 mb-2">Signature</p>
                <img
                  src={shipment.proofOfDelivery.signatureImage}
                  alt="Receiver signature"
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600 mb-1">Received By</p>
              <p className="font-medium text-gray-900">{shipment.proofOfDelivery.receivedBy || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Delivered At</p>
              <p className="font-medium text-gray-900">{formatDateTime(shipment.proofOfDelivery.deliveredAt)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Bids Section (for shipper with pending shipments) */}
      {user?.role === 'shipper' && bids.length > 0 && shipment.status === 'pending' && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            Bids Received ({bids.length})
          </h2>
          <div className="space-y-4">
            {bids.map((bid) => (
              <div key={bid._id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium text-gray-900">{bid.carrier?.name || 'Carrier'}</p>
                    <p className="text-sm text-gray-500">{bid.carrier?.carrierDetails?.companyName || ''}</p>
                  </div>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    bid.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    bid.status === 'countered' ? 'bg-blue-100 text-blue-800' :
                    bid.status === 'accepted' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {bid.status}
                  </span>
                </div>
                <div className="text-lg font-bold text-green-600 mb-2">₹{bid.amount}</div>
                {bid.notes && <p className="text-sm text-gray-600 mb-3">{bid.notes}</p>}
                <div className="flex gap-2">
                  {bid.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleAcceptBid(bid._id)}
                        className="flex-1 bg-green-600 text-white py-2 rounded text-sm hover:bg-green-700"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => openCounterModal(bid)}
                        className="flex-1 bg-blue-600 text-white py-2 rounded text-sm hover:bg-blue-700"
                      >
                        Counter
                      </button>
                      <button
                        onClick={() => handleRejectBid(bid._id)}
                        className="flex-1 border border-gray-300 py-2 rounded text-sm hover:bg-gray-50"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {bid.status === 'countered' && (
                    <span className="text-sm text-blue-600">Awaiting carrier response...</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end space-x-4">
        {user?.role === 'shipper' && shipment.status === 'assigned' && shipment.payment?.status !== 'completed' && (
          <button
            onClick={() => navigate(`/shipper/payments/${id}`)}
            className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            <CreditCard size={18} />
            Pay Now
          </button>
        )}
        {canCancel && (
          <button
            onClick={handleCancel}
            className="px-6 py-3 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition"
          >
            Cancel Shipment
          </button>
        )}
      </div>

      {showChat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <ChatPanel
            shipmentId={shipment._id}
            onClose={() => setShowChat(false)}
          />
        </div>
      )}

      {selectedBid && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Counter Offer</h3>
            <p className="text-sm text-gray-600 mb-4">Current bid: ₹{selectedBid.amount}</p>
            <input
              type="number"
              value={counterAmount}
              onChange={(e) => setCounterAmount(e.target.value)}
              placeholder="Enter counter amount"
              className="w-full rounded-md border border-gray-300 px-3 py-2 mb-4 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <div className="flex gap-3">
              <button
                onClick={handleCounterOffer}
                className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
              >
                Send Counter
              </button>
              <button
                onClick={() => setSelectedBid(null)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShipmentDetail;