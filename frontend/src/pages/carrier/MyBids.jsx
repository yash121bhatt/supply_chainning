import { useState, useEffect } from 'react';
import { useAuthStore } from '../../context/AuthContext';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { IndianRupee, Clock, CheckCircle, XCircle, MessageCircle } from 'lucide-react';

const MyBids = () => {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const { user } = useAuthStore();

  useEffect(() => {
    fetchBids();
  }, [filter]);

  const fetchBids = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? { status: filter } : {};
      const data = await api.get('/bids/my-bids', { params });
      setBids(data.bids || []);
    } catch (error) {
      toast.error('Failed to fetch bids');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (bidId) => {
    try {
      await api.put(`/bids/${bidId}/withdraw`);
      toast.success('Bid withdrawn successfully');
      fetchBids();
    } catch (error) {
      toast.error(error.message || 'Failed to withdraw bid');
    }
  };

  const handleRespondToCounter = async (bidId, accept) => {
    try {
      await api.put(`/bids/${bidId}/respond-counter`, { accept });
      toast.success(accept ? 'Counter offer accepted' : 'Counter offer rejected');
      fetchBids();
    } catch (error) {
      toast.error(error.message || 'Failed to respond');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      countered: 'bg-blue-100 text-blue-800',
      withdrawn: 'bg-gray-100 text-gray-800'
    };
    return styles[status] || styles.pending;
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: <Clock className="w-4 h-4" />,
      accepted: <CheckCircle className="w-4 h-4" />,
      rejected: <XCircle className="w-4 h-4" />,
      countered: <MessageCircle className="w-4 h-4" />
    };
    return icons[status];
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">My Bids</h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="all">All Bids</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
          <option value="countered">Countered</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : bids.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">No bids found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bids.map((bid) => (
            <div key={bid._id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {bid.shipment?.shipmentNumber || 'Shipment'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Placed on {format(new Date(bid.createdAt), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(bid.status)}`}>
                  {getStatusIcon(bid.status)}
                  {bid.status}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Your Bid</p>
                  <p className="text-xl font-bold text-green-600">₹{bid.amount}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Shipper's Quote</p>
                  <p className="text-xl font-semibold text-gray-900">
                    ₹{bid.shipment?.pricing?.quotedPrice}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Valid Until</p>
                  <p className="text-sm text-gray-900">
                    {format(new Date(bid.validUntil), 'MMM dd, yyyy')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Pickup</p>
                  <p className="text-sm text-gray-900">
                    {bid.shipment?.pickupLocation?.city}
                  </p>
                </div>
              </div>

              {bid.notes && (
                <div className="mb-4 p-3 bg-gray-50 rounded">
                  <p className="text-sm text-gray-600">{bid.notes}</p>
                </div>
              )}

              {bid.bidHistory && bid.bidHistory.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Bid History</p>
                  <div className="space-y-2">
                    {bid.bidHistory.map((history, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                          {history.action?.replace('_', ' ')}
                        </span>
                        <span>₹{history.previousAmount} → ₹{history.newAmount}</span>
                        {history.notes && <span className="text-gray-500">({history.notes})</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t">
                {bid.status === 'pending' && (
                  <button
                    onClick={() => handleWithdraw(bid._id)}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Withdraw Bid
                  </button>
                )}
                {bid.status === 'countered' && (
                  <>
                    <button
                      onClick={() => handleRespondToCounter(bid._id, true)}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      Accept Counter Offer
                    </button>
                    <button
                      onClick={() => handleRespondToCounter(bid._id, false)}
                      className="px-4 py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50"
                    >
                      Reject Counter Offer
                    </button>
                  </>
                )}
                {bid.status === 'accepted' && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Congratulations! Your bid was accepted.</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyBids;
