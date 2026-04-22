import { useState } from 'react';
import { useAuthStore } from '../../context/AuthContext';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { Loader } from 'lucide-react';

const PaymentModal = ({ shipment, onSuccess, onClose }) => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(window.Razorpay);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(window.Razorpay);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    setLoading(true);
    try {
      const orderData = await api.post('/payments/create', { shipmentId: shipment._id });
      const { orderId, amount, key } = orderData;

      const razorpay = await loadRazorpay();
      setRazorpayLoaded(true);

      const options = {
        key: key || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: amount * 100,
        currency: 'INR',
        name: 'Supply Chain',
        description: `Payment for ${shipment.shipmentNumber}`,
        order_id: orderId,
        prefill: {
          name: user?.name,
          email: user?.email,
          contact: user?.phone
        },
        handler: async (response) => {
          try {
            await api.post('/payments/verify', {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              transactionId: orderData.transactionId
            });
            toast.success('Payment successful!');
            onSuccess?.();
            onClose?.();
          } catch (error) {
            toast.error('Payment verification failed');
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          }
        },
        theme: {
          color: '#3b82f6'
        }
      };

      const rzp = new razorpay(options);
      rzp.on('payment.failed', (response) => {
        toast.error(`Payment failed: ${response.error.description}`);
        setLoading(false);
      });

      rzp.open();
    } catch (error) {
      toast.error(error.message || 'Failed to initiate payment');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Make Payment</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">Shipment</span>
            <span className="font-medium">{shipment.shipmentNumber}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">Amount</span>
            <span className="text-2xl font-bold text-green-600">
              ₹{shipment.pricing?.acceptedPrice || shipment.pricing?.quotedPrice}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Platform Fee (5%)</span>
            <span className="text-sm text-gray-500">
              ₹{((shipment.pricing?.acceptedPrice || shipment.pricing?.quotedPrice) * 0.05).toFixed(2)}
            </span>
          </div>
        </div>

        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Payment Methods</h4>
          <div className="grid grid-cols-3 gap-2">
            <div className="border rounded-lg p-2 text-center bg-blue-50 border-blue-200">
              <span className="text-xs text-blue-600">UPI</span>
            </div>
            <div className="border rounded-lg p-2 text-center">
              <span className="text-xs text-gray-600">Card</span>
            </div>
            <div className="border rounded-lg p-2 text-center">
              <span className="text-xs text-gray-600">Netbanking</span>
            </div>
          </div>
        </div>

        <button
          onClick={handlePayment}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && <Loader className="w-5 h-5 animate-spin" />}
          {loading ? 'Processing...' : 'Pay Now'}
        </button>

        <p className="text-xs text-gray-500 text-center mt-4">
          By proceeding, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default PaymentModal;
