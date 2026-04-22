import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../context/AuthContext';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { MapPin, Calendar, Truck, Package, Check, X } from 'lucide-react';

const DriverAssignment = ({ shipment, onUpdate, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [showAccept, setShowAccept] = useState(false);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const handleAccept = async () => {
    setLoading(true);
    try {
      await api.put(`/shipments/${shipment._id}/status`, { 
        status: 'picked_up',
        notes: 'Driver accepted the shipment assignment'
      });
      toast.success('Shipment accepted!');
      onUpdate?.();
      onClose?.();
    } catch (error) {
      toast.error(error.message || 'Failed to accept shipment');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!confirm('Are you sure you want to reject this assignment?')) return;
    
    setLoading(true);
    try {
      await api.put(`/shipments/${shipment._id}/status`, {
        status: 'assigned',
        notes: 'Driver rejected the shipment assignment'
      });
      toast.success('Assignment rejected');
      onUpdate?.();
      onClose?.();
    } catch (error) {
      toast.error(error.message || 'Failed to reject assignment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">New Shipment Assignment</h3>
            <p className="text-sm text-gray-500">{shipment.shipmentNumber}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-sm">
              ⚠️ You have been assigned to this shipment. Please review the details and accept or reject.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Pickup Location</p>
                  <p className="font-medium text-gray-900">
                    {shipment.pickupLocation?.address}
                  </p>
                  <p className="text-sm text-gray-600">
                    {shipment.pickupLocation?.city}, {shipment.pickupLocation?.state}
                  </p>
                  <p className="text-sm text-blue-600 font-medium mt-1">
                    {format(new Date(shipment.pickupDate), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Delivery Location</p>
                  <p className="font-medium text-gray-900">
                    {shipment.deliveryLocation?.address}
                  </p>
                  <p className="text-sm text-gray-600">
                    {shipment.deliveryLocation?.city}, {shipment.deliveryLocation?.state}
                  </p>
                  <p className="text-sm text-blue-600 font-medium mt-1">
                    {format(new Date(shipment.deliveryDate), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{shipment.goodsDetails?.description}</p>
                  <p className="text-sm text-gray-500">
                    {shipment.goodsDetails?.weight} {shipment.goodsDetails?.weightUnit}
                  </p>
                </div>
              </div>

              {shipment.vehicle && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <Truck className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{shipment.vehicle.vehicleNumber}</p>
                    <p className="text-sm text-gray-500">
                      {shipment.vehicle.brand} {shipment.vehicle.model}
                    </p>
                  </div>
                </div>
              )}

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">Carrier</p>
                <p className="font-medium text-gray-900">{shipment.carrier?.name}</p>
                <p className="text-sm text-gray-500">{shipment.carrier?.phone}</p>
              </div>
            </div>
          </div>

          {shipment.goodsDetails?.specialInstructions && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-sm font-medium text-orange-800 mb-1">Special Instructions</p>
              <p className="text-sm text-orange-700">{shipment.goodsDetails.specialInstructions}</p>
            </div>
          )}

          {shipment.goodsDetails?.isFragile && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 inline-flex items-center gap-2">
              <span className="text-red-600">⚠️</span>
              <span className="text-sm font-medium text-red-800">Fragile - Handle with care</span>
            </div>
          )}

          {shipment.goodsDetails?.isHazardous && (
            <div className="bg-red-100 border border-red-300 rounded-lg p-3 inline-flex items-center gap-2">
              <span className="text-red-700">☠️</span>
              <span className="text-sm font-medium text-red-800">Hazardous Material</span>
            </div>
          )}
        </div>

        <div className="border-t px-6 py-4 flex gap-4">
          <button
            onClick={handleReject}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
            Reject
          </button>
          <button
            onClick={handleAccept}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            <Check className="w-5 h-5" />
            Accept & Start
          </button>
        </div>
      </div>
    </div>
  );
};

export default DriverAssignment;
