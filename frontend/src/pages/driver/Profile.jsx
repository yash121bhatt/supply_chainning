import { useEffect, useState } from 'react';
import { driverAPI } from '../../services';
import { formatDateTime } from '../../utils/helpers';
import { User, Truck, Building, Phone, Mail, Calendar, Edit, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const DriverProfile = () => {
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    avatar: '',
    licenseNumber: '',
    licenseExpiry: '',
    aadhaarNumber: ''
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const response = await driverAPI.getProfile();
      setDriver(response.data.driver);
      setFormData({
        name: response.data.driver.name,
        phone: response.data.driver.phone,
        avatar: response.data.driver.avatar || '',
        licenseNumber: response.data.driver.driverDetails?.licenseNumber || '',
        licenseExpiry: response.data.driver.driverDetails?.licenseExpiry?.split('T')[0] || '',
        aadhaarNumber: response.data.driver.driverDetails?.aadhaarNumber || ''
      });
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await driverAPI.updateProfile(formData);
      toast.success('Profile updated successfully!');
      setEditing(false);
      loadProfile();
    } catch (error) {
      toast.error(error.message || 'Failed to update profile');
    }
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Driver Profile</h1>
          <p className="text-gray-600">Manage your profile and driving information</p>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            <Edit size={20} className="mr-2" />
            Edit Profile
          </button>
        )}
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-primary-500 to-primary-600">
          <div className="flex items-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
              <User className="text-primary-600" size={40} />
            </div>
            <div className="ml-6 text-white">
              <h2 className="text-2xl font-bold">{driver?.name}</h2>
              <p className="opacity-80">Driver</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <form className="space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="text-primary-600 mr-2" size={20} />
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    />
                  ) : (
                    <p className="text-gray-900">{driver?.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  {editing ? (
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    />
                  ) : (
                    <p className="text-gray-900">{driver?.phone}</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <div className="flex items-center">
                    <Mail className="text-gray-400 mr-2" size={16} />
                    <p className="text-gray-900">{driver?.email}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* License Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Truck className="text-primary-600 mr-2" size={20} />
                License Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">License Number</label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.licenseNumber}
                      onChange={(e) => handleChange('licenseNumber', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    />
                  ) : (
                    <p className="text-gray-900">{driver?.driverDetails?.licenseNumber || 'N/A'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">License Expiry</label>
                  {editing ? (
                    <input
                      type="date"
                      value={formData.licenseExpiry}
                      onChange={(e) => handleChange('licenseExpiry', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    />
                  ) : (
                    <p className="text-gray-900">
                      {driver?.driverDetails?.licenseExpiry
                        ? formatDateTime(driver.driverDetails.licenseExpiry)
                        : 'N/A'}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Aadhaar Number</label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.aadhaarNumber}
                      onChange={(e) => handleChange('aadhaarNumber', e.target.value)}
                      placeholder="1234-5678-9012"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    />
                  ) : (
                    <p className="text-gray-900">
                      {driver?.driverDetails?.aadhaarNumber
                        ? `****-****-${driver.driverDetails.aadhaarNumber.slice(-4)}`
                        : 'N/A'}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Experience</label>
                  <p className="text-gray-900">{driver?.driverDetails?.experience || 0} years</p>
                </div>
              </div>
            </div>

            {/* Carrier Information */}
            {driver?.driverDetails?.assignedCarrier && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Building className="text-primary-600 mr-2" size={20} />
                  Assigned Carrier
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="font-medium text-gray-900">
                    {driver.driverDetails.assignedCarrier.name}
                  </p>
                  <div className="flex items-center mt-2 text-sm text-gray-600">
                    <Phone size={14} className="mr-1" />
                    {driver.driverDetails.assignedCarrier.phone}
                  </div>
                  {driver.driverDetails.assignedCarrier.carrierDetails?.companyName && (
                    <p className="text-sm text-gray-600 mt-1">
                      {driver.driverDetails.assignedCarrier.carrierDetails.companyName}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Account Details */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Account Status</label>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                    driver?.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {driver?.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Joined Date</label>
                  <p className="text-gray-900">{formatDateTime(driver?.createdAt)}</p>
                </div>
              </div>
            </div>

            {/* Save Button */}
            {editing && (
              <div className="flex justify-end space-x-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setFormData({
                      name: driver?.name,
                      phone: driver?.phone,
                      avatar: driver?.avatar || '',
                      licenseNumber: driver?.driverDetails?.licenseNumber || '',
                      licenseExpiry: driver?.driverDetails?.licenseExpiry?.split('T')[0] || '',
                      aadhaarNumber: driver?.driverDetails?.aadhaarNumber || ''
                    });
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition flex items-center"
                >
                  <Save size={20} className="mr-2" />
                  Save Changes
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default DriverProfile;