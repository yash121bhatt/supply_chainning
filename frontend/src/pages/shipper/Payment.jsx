import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { shipmentAPI, paymentAPI } from '../../services';
import { formatCurrency, formatDateTime } from '../../utils/helpers';
import { ArrowLeft, CreditCard, CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const Payment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('pending');

  useEffect(() => {
    loadShipment();
  }, [id]);

  const loadShipment = async () => {
    setLoading(true);
    try {
      const res = await shipmentAPI.getById(id);
      const shipmentData = res.data?.shipment || res.shipment || res.data;
      setShipment(shipmentData);
      setPaymentStatus(shipmentData.payment?.status || 'pending');
    } catch (error) {
      toast.error('Failed to load shipment details');
      navigate('/shipper/shipments');
    } finally {
      setLoading(false);
    }
  };

  const initiatePayment = async () => {
    setProcessing(true);
    try {
      const res = await paymentAPI.createPayment(id);
      setPaymentData(res.data);
      
      if (window.Razorpay) {
        openRazorpayCheckout(res.data);
      } else {
        toast.error('Razorpay SDK not loaded');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to initiate payment');
    } finally {
      setProcessing(false);
    }
  };

  const openRazorpayCheckout = (paymentInfo) => {
    const options = {
      key: paymentInfo.key,
      amount: paymentInfo.amount * 100,
      currency: paymentInfo.currency || 'INR',
      name: 'Supply Chain Payment',
      description: `Payment for Shipment ${shipment.shipmentNumber}`,
      order_id: paymentInfo.orderId,
      handler: async (response) => {
        try {
          await verifyPayment(response);
        } catch (error) {
          toast.error('Payment verification failed');
        }
      },
      prefill: {
        name: shipment.shipper?.name || 'Customer',
        email: shipment.shipper?.email || ''
      },
      theme: {
        color: '#4F46E5'
      }
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();
    
    razorpay.on('payment.failed', (response) => {
      toast.error('Payment failed: ' + response.error.description);
    });
  };

  const verifyPayment = async (response) => {
    setProcessing(true);
    try {
      await paymentAPI.verifyPayment({
        razorpayOrderId: response.razorpay_order_id,
        razorpayPaymentId: response.razorpay_payment_id,
        razorpaySignature: response.razorpay_signature,
        transactionId: paymentData.transactionId
      });
      toast.success('Payment successful!');
      setPaymentStatus('completed');
      loadShipment();
    } catch (error) {
      toast.error(error.message || 'Payment verification failed');
    } finally {
      setProcessing(false);
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

  const amount = shipment.pricing.acceptedPrice || shipment.pricing.quotedPrice;
  const commissionAmount = amount * 0.05;
  const carrierPayout = amount - commissionAmount;

  const statusConfig = {
    pending: { color: 'text-yellow-600', bg: 'bg-yellow-100', icon: Clock, label: 'Payment Pending' },
    processing: { color: 'text-blue-600', bg: 'bg-blue-100', icon: Clock, label: 'Processing' },
    completed: { color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle, label: 'Payment Completed' },
    failed: { color: 'text-red-600', bg: 'bg-red-100', icon: AlertCircle, label: 'Payment Failed' },
    refunded: { color: 'text-gray-600', bg: 'bg-gray-100', icon: CheckCircle, label: 'Refunded' }
  };

  const currentStatus = statusConfig[paymentStatus] || statusConfig.pending;
  const StatusIcon = currentStatus.icon;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center">
        <button
          onClick={() => navigate(`/shipper/shipments/${id}`)}
          className="mr-4 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment</h1>
          <p className="text-gray-600">Shipment {shipment.shipmentNumber}</p>
        </div>
      </div>

      {/* Payment Status Card */}
      <div className={`bg-white rounded-xl shadow-sm p-6 border-l-4 ${
        paymentStatus === 'completed' ? 'border-l-green-500' :
        paymentStatus === 'failed' ? 'border-l-red-500' :
        'border-l-yellow-500'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-full ${currentStatus.bg}`}>
              <StatusIcon className={currentStatus.color} size={24} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{currentStatus.label}</h2>
              {shipment.payment?.paidAt && (
                <p className="text-sm text-gray-500">
                  Paid on {formatDateTime(shipment.payment.paidAt)}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Shipment Summary */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Shipment Summary</h2>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Shipment Number</span>
            <span className="font-medium text-gray-900">{shipment.shipmentNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Route</span>
            <span className="font-medium text-gray-900">
              {shipment.pickupLocation?.city} → {shipment.deliveryLocation?.city}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Status</span>
            <span className="font-medium text-gray-900">{shipment.status}</span>
          </div>
        </div>
      </div>

      {/* Payment Breakdown */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Breakdown</h2>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Base Price</span>
            <span className="font-medium text-gray-900">{formatCurrency(amount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Platform Commission (5%)</span>
            <span className="font-medium text-red-600">-{formatCurrency(commissionAmount)}</span>
          </div>
          <div className="border-t pt-3 flex justify-between">
            <span className="text-gray-600">Carrier Payout</span>
            <span className="font-medium text-gray-900">{formatCurrency(carrierPayout)}</span>
          </div>
          <div className="border-t pt-3 flex justify-between">
            <span className="text-lg font-semibold text-gray-900">Total Amount</span>
            <span className="text-lg font-bold text-primary-600">{formatCurrency(amount)}</span>
          </div>
        </div>
      </div>

      {/* Payment Actions */}
      {paymentStatus === 'pending' && shipment.status === 'assigned' && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="text-center space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <CreditCard className="mx-auto text-blue-600 mb-2" size={32} />
              <p className="text-gray-600">
                Complete your payment securely via Razorpay
              </p>
            </div>
            <button
              onClick={initiatePayment}
              disabled={processing}
              className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard size={20} />
                  Pay {formatCurrency(amount)}
                </>
              )}
            </button>
            <p className="text-xs text-gray-500">
              By clicking pay, you agree to our payment terms
            </p>
          </div>
        </div>
      )}

      {/* Already Paid Info */}
      {paymentStatus === 'completed' && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="text-center space-y-4">
            <CheckCircle className="mx-auto text-green-600" size={48} />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Payment Completed</h3>
              <p className="text-gray-600 mt-1">
                Payment of {formatCurrency(shipment.payment?.amount)} has been processed successfully.
              </p>
              {shipment.payment?.paymentId && (
                <p className="text-sm text-gray-500 mt-2">
                  Transaction ID: {shipment.payment.paymentId}
                </p>
              )}
            </div>
            <button
              onClick={() => navigate('/shipper/transactions')}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              View Transaction History →
            </button>
          </div>
        </div>
      )}

      {/* Payment Not Required */}
      {shipment.status === 'pending' && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="text-center space-y-4">
            <Clock className="mx-auto text-gray-400" size={48} />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Awaiting Carrier Acceptance</h3>
              <p className="text-gray-600 mt-1">
                Payment can be made once a carrier accepts your shipment.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Shipment Status Info */}
      {shipment.status !== 'pending' && shipment.status !== 'assigned' && paymentStatus === 'pending' && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="text-center space-y-4">
            <AlertCircle className="mx-auto text-gray-400" size={48} />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Payment Status</h3>
              <p className="text-gray-600 mt-1">
                This shipment is currently in "{shipment.status}" status. Payment is {shipment.payment?.status || 'pending'}.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payment;
