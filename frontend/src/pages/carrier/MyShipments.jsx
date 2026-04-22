import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { shipmentAPI, carrierAPI } from '../../services';
import { formatCurrency, formatDate, getShipmentStatusColor, getShipmentStatusLabel } from '../../utils/helpers';
import { Package, MapPin, Truck, User, Check, Clock, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const AssignDriverModal = ({ shipment, drivers, vehicles, onClose, onAssigned }) => {
  const [loading, setLoading] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');

  const handleAssign = async () => {
    if (!selectedDriver) {
      return toast.error('Please select a driver');
    }

    setLoading(true);
    try {
      await shipmentAPI.assignDriver(shipment._id, {
        driverId: selectedDriver,
        vehicleId: selectedVehicle || undefined
      });
      toast.success('Driver assigned successfully!');
      onAssigned?.();
      onClose?.();
    } catch (error) {
      toast.error(error.message || 'Failed to assign driver');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
        <div className="p-6 border-b flex justify-between items-center">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Assign Driver</h3>
            <p className="text-sm text-gray-500">{shipment.shipmentNumber}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <MapPin className="text-primary-600" size={18} />
              <span className="font-medium">{shipment.pickupLocation?.city}</span>
              <span className="text-gray-400">→</span>
              <span className="font-medium">{shipment.deliveryLocation?.city}</span>
            </div>
            <p className="text-sm text-gray-600">{formatDate(shipment.pickupDate)}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Driver <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedDriver}
              onChange={(e) => setSelectedDriver(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white"
            >
              <option value="">Choose a driver</option>
              {drivers.map((driver) => (
                <option key={driver._id} value={driver._id}>
                  {driver.name} - {driver.phone}
                </option>
              ))}
            </select>
            {drivers.length === 0 && (
              <p className="text-sm text-orange-600 mt-1">
                No drivers available. Please invite drivers first.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Vehicle (Optional)
            </label>
            <select
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white"
            >
              <option value="">Choose a vehicle</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle._id} value={vehicle._id}>
                  {vehicle.vehicleNumber} - {vehicle.brand} {vehicle.model}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-6 border-t flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={loading || !selectedDriver}
            className="flex-1 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Assign Driver'}
          </button>
        </div>
      </div>
    </div>
  );
};

import { X } from 'lucide-react';

const CarrierShipments = () => {
  const [myShipments, setMyShipments] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [driversRes, vehiclesRes] = await Promise.all([
        carrierAPI.getDrivers(),
        carrierAPI.getVehicles()
      ]);
      setDrivers(driversRes.data?.drivers || []);
      setVehicles(vehiclesRes.data?.vehicles || []);

      const response = await shipmentAPI.getMyShipments();
      const shipments = response.data?.shipments || [];
      const assignedShipments = shipments.filter(s => 
        ['assigned', 'picked_up', 'in_transit'].includes(s.status)
      );
      setMyShipments(assignedShipments);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAssignModal = (shipment) => {
    setSelectedShipment(shipment);
    setShowAssignModal(true);
  };

  const handleStatusUpdate = async (shipmentId, newStatus) => {
    try {
      await shipmentAPI.updateStatus(shipmentId, { status: newStatus });
      toast.success('Status updated');
      loadData();
    } catch (error) {
      toast.error(error.message || 'Failed to update status');
    }
  };

  const getNextStatus = (status) => {
    const flow = {
      'assigned': 'picked_up',
      'picked_up': 'in_transit',
      'in_transit': 'delivered'
    };
    return flow[status];
  };

  const getStatusButtonLabel = (status) => {
    const labels = {
      'assigned': 'Mark Picked Up',
      'picked_up': 'Start Transit',
      'in_transit': 'Mark Delivered'
    };
    return labels[status];
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Shipments</h1>
        <p className="text-gray-600">Manage your accepted shipments and assign drivers</p>
      </div>

      {myShipments.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No shipments yet</h3>
          <p className="mt-2 text-gray-500">Accept shipments from the Available Shipments page to get started.</p>
          <Link
            to="/carrier/shipments"
            className="mt-4 inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            Browse Available Shipments
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {myShipments.map((shipment) => (
            <div key={shipment._id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-semibold text-primary-600">{shipment.shipmentNumber}</span>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getShipmentStatusColor(shipment.status)}`}>
                      {getShipmentStatusLabel(shipment.status)}
                    </span>
                  </div>
                  <span className="text-xl font-bold text-gray-900">{formatCurrency(shipment.pricing?.acceptedPrice || shipment.pricing?.quotedPrice)}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <MapPin className="text-green-600 mt-1" size={20} />
                      <div>
                        <p className="text-sm text-gray-500">Pickup</p>
                        <p className="font-medium">{shipment.pickupLocation?.city}, {shipment.pickupLocation?.state}</p>
                        <p className="text-sm text-gray-600">{formatDate(shipment.pickupDate)}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="text-red-600 mt-1" size={20} />
                      <div>
                        <p className="text-sm text-gray-500">Delivery</p>
                        <p className="font-medium">{shipment.deliveryLocation?.city}, {shipment.deliveryLocation?.state}</p>
                        <p className="text-sm text-gray-600">{formatDate(shipment.deliveryDate)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <User className="text-primary-600" size={20} />
                      <div>
                        <p className="text-sm text-gray-500">Driver</p>
                        {shipment.driver ? (
                          <p className="font-medium">{shipment.driver.name}</p>
                        ) : (
                          <span className="text-sm text-orange-600 font-medium">Not Assigned</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Truck className="text-purple-600" size={20} />
                      <div>
                        <p className="text-sm text-gray-500">Vehicle</p>
                        {shipment.vehicle ? (
                          <p className="font-medium">{shipment.vehicle.vehicleNumber}</p>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t flex flex-wrap gap-3">
                  {shipment.driver ? (
                    <>
                      {shipment.status !== 'delivered' && (
                        <button
                          onClick={() => handleStatusUpdate(shipment._id, getNextStatus(shipment.status))}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                        >
                          <Clock size={16} />
                          {getStatusButtonLabel(shipment.status)}
                        </button>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={() => openAssignModal(shipment)}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition flex items-center gap-2"
                    >
                      <User size={16} />
                      Assign Driver
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAssignModal && selectedShipment && (
        <AssignDriverModal
          shipment={selectedShipment}
          drivers={drivers}
          vehicles={vehicles}
          onClose={() => {
            setShowAssignModal(false);
            setSelectedShipment(null);
          }}
          onAssigned={() => {
            loadData();
            setShowAssignModal(false);
            setSelectedShipment(null);
          }}
        />
      )}
    </div>
  );
};

export default CarrierShipments;
