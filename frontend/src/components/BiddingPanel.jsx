import { useState } from 'react';
import useAuthStore from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-hot-toast';

const BiddingPanel = ({ shipment, onBidPlaced, onClose }) => {
  const [bidAmount, setBidAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [proposedPickupDate, setProposedPickupDate] = useState('');
  const [proposedDeliveryDate, setProposedDeliveryDate] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!bidAmount || parseFloat(bidAmount) <= 0) {
      toast.error('Please enter a valid bid amount');
      return;
    }

    setLoading(true);
    try {
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + 7);

      await api.post('/bids', {
        shipmentId: shipment._id,
        amount: parseFloat(bidAmount),
        notes,
        proposedPickupDate: proposedPickupDate || undefined,
        proposedDeliveryDate: proposedDeliveryDate || undefined,
        validUntil: validUntil.toISOString()
      });

      toast.success('Bid placed successfully!');
      onBidPlaced?.();
      onClose?.();
    } catch (error) {
      toast.error(error.message || 'Failed to place bid');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
      <h3 className="text-lg font-semibold mb-4">Place Your Bid</h3>
      <div className="mb-4 p-3 bg-gray-50 rounded">
        <p className="text-sm text-gray-600">Shipment: {shipment.shipmentNumber}</p>
        <p className="text-sm text-gray-600">Quoted Price: ₹{shipment.pricing?.quotedPrice}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Your Bid Amount (₹)</label>
          <input
            type="number"
            value={bidAmount}
            onChange={(e) => setBidAmount(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Enter your bid amount"
            min="1"
            step="0.01"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Proposed Pickup Date</label>
            <input
              type="date"
              value={proposedPickupDate}
              onChange={(e) => setProposedPickupDate(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Proposed Delivery Date</label>
            <input
              type="date"
              value={proposedDeliveryDate}
              onChange={(e) => setProposedDeliveryDate(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Add any notes or comments about your bid..."
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Placing Bid...' : 'Place Bid'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default BiddingPanel;
