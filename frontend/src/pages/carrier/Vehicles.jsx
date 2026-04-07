import { useEffect, useState } from 'react';
import { carrierAPI } from '../../services';
import { formatDateTime, cn } from '../../utils/helpers';
import { Truck, Plus, Edit, Trash2, Fuel, Gauge, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

const Vehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [formData, setFormData] = useState({
    vehicleNumber: '',
    vehicleType: 'truck',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    capacity: { weight: '', weightUnit: 'kg' },
    registrationNumber: '',
    registrationExpiry: '',
    insuranceNumber: '',
    insuranceExpiry: ''
  });

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    setLoading(true);
    try {
      const response = await carrierAPI.getVehicles();
      setVehicles(response.data.vehicles);
    } catch (error) {
      toast.error('Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingVehicle) {
        await carrierAPI.updateVehicle(editingVehicle._id, formData);
        toast.success('Vehicle updated successfully!');
      } else {
        await carrierAPI.addVehicle(formData);
        toast.success('Vehicle added successfully!');
      }
      setShowModal(false);
      setEditingVehicle(null);
      resetForm();
      loadVehicles();
    } catch (error) {
      toast.error(error.message || 'Failed to save vehicle');
    }
  };

  const handleEdit = (vehicle) => {
    setEditingVehicle(vehicle);
    setFormData(vehicle);
    setShowModal(true);
  };

  const handleDelete = async (vehicleId) => {
    if (!confirm('Are you sure you want to delete this vehicle?')) return;

    try {
      await carrierAPI.deleteVehicle(vehicleId);
      toast.success('Vehicle deleted successfully!');
      loadVehicles();
    } catch (error) {
      toast.error(error.message || 'Failed to delete vehicle');
    }
  };

  const resetForm = () => {
    setFormData({
      vehicleNumber: '',
      vehicleType: 'truck',
      brand: '',
      model: '',
      year: new Date().getFullYear(),
      capacity: { weight: '', weightUnit: 'kg' },
      registrationNumber: '',
      registrationExpiry: '',
      insuranceNumber: '',
      insuranceExpiry: ''
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      available: 'bg-green-100 text-green-800',
      in_use: 'bg-blue-100 text-blue-800',
      maintenance: 'bg-yellow-100 text-yellow-800',
      inactive: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Vehicles</h1>
          <p className="text-gray-600">Manage your fleet of vehicles</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
            setEditingVehicle(null);
          }}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
        >
          <Plus size={20} className="mr-2" />
          Add Vehicle
        </button>
      </div>

      {/* Vehicles Grid */}
      {vehicles.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Truck className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No vehicles yet</h3>
          <p className="mt-2 text-gray-500">Add your first vehicle to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((vehicle) => (
            <div key={vehicle._id} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="p-2 bg-primary-100 rounded-lg mr-3">
                    <Truck className="text-primary-600" size={24} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{vehicle.vehicleNumber}</p>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(vehicle.currentStatus)}`}>
                      {vehicle.currentStatus.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleEdit(vehicle)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(vehicle._id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center text-gray-600">
                  <p>{vehicle.brand} {vehicle.model} ({vehicle.year})</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <Gauge size={16} className="text-gray-400" />
                    <span className="text-gray-900 font-medium">{vehicle.capacity.weight} {vehicle.capacity.weightUnit}</span>
                  </div>
                  {vehicle.fuelType && (
                    <div className="flex items-center space-x-1">
                      <Fuel size={16} className="text-gray-400" />
                      <span className="text-gray-900 capitalize">{vehicle.fuelType}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-4 pt-2 border-t">
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Reg. Exp.</p>
                    <p className="text-gray-900">{formatDateTime(vehicle.registrationExpiry)}</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Ins. Exp.</p>
                    <p className="text-gray-900">{formatDateTime(vehicle.insuranceExpiry)}</p>
                  </div>
                </div>
              </div>

              {vehicle.assignedDriver && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-gray-500">Assigned Driver</p>
                  <p className="text-sm text-gray-900">{vehicle.assignedDriver.name}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Number *</label>
                  <input
                    type="text"
                    value={formData.vehicleNumber}
                    onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value.toUpperCase() })}
                    placeholder="MH01AB1234"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Type *</label>
                  <select
                    value={formData.vehicleType}
                    onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white"
                    required
                  >
                    <option value="truck">Truck</option>
                    <option value="trailer">Trailer</option>
                    <option value="van">Van</option>
                    <option value="container_truck">Container Truck</option>
                    <option value="pickup">Pickup</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Brand *</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="Tata"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Model *</label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    placeholder="407"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Year *</label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                    min="1990"
                    max={new Date().getFullYear() + 1}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Capacity (kg) *</label>
                  <input
                    type="number"
                    value={formData.capacity.weight}
                    onChange={(e) => setFormData({ ...formData, capacity: { ...formData.capacity, weight: e.target.value } })}
                    placeholder="5000"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Registration Number *</label>
                  <input
                    type="text"
                    value={formData.registrationNumber}
                    onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                    placeholder="Reg-12345"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Registration Expiry *</label>
                  <input
                    type="date"
                    value={formData.registrationExpiry}
                    onChange={(e) => setFormData({ ...formData, registrationExpiry: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Insurance Number *</label>
                  <input
                    type="text"
                    value={formData.insuranceNumber}
                    onChange={(e) => setFormData({ ...formData, insuranceNumber: e.target.value })}
                    placeholder="INS-12345"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Insurance Expiry *</label>
                  <input
                    type="date"
                    value={formData.insuranceExpiry}
                    onChange={(e) => setFormData({ ...formData, insuranceExpiry: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                >
                  {editingVehicle ? 'Update' : 'Add'} Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vehicles;