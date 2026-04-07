import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services';
import toast from 'react-hot-toast';
import { User, Building, Mail, Phone, MapPin, Save, RefreshCw } from 'lucide-react';

const ShipperProfile = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    companyDetails: {
      companyName: '',
      gstNumber: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'India'
      }
    }
  });
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await authAPI.getMe();
      const u = response.data.user;
      setUser(u);
      setFormData({
        name: u.name || '',
        phone: u.phone || '',
        companyDetails: {
          companyName: u.companyDetails?.companyName || '',
          gstNumber: u.companyDetails?.gstNumber || '',
          address: {
            street: u.companyDetails?.address?.street || '',
            city: u.companyDetails?.address?.city || '',
            state: u.companyDetails?.address?.state || '',
            zipCode: u.companyDetails?.address?.zipCode || '',
            country: u.companyDetails?.address?.country || 'India'
          }
        }
      });
    } catch {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (section, field, value) => {
    if (section) {
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleAddressChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      companyDetails: {
        ...prev.companyDetails,
        address: { ...prev.companyDetails.address, [field]: value }
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await authAPI.updateProfile(formData);
      toast.success('Profile updated successfully');
      loadProfile();
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shipper Profile</h1>
          <p className="text-gray-600">Manage your account and company details</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadProfile} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Info */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <User className="text-primary-600 mr-2" size={20} />
            Personal Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange(null, 'name', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange(null, 'phone', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail size={14} className="inline mr-1" /> Email
              </label>
              <p className="text-gray-900 py-2">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Company Details */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Building className="text-primary-600 mr-2" size={20} />
            Company Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
              <input
                type="text"
                value={formData.companyDetails.companyName}
                onChange={(e) => handleChange('companyDetails', 'companyName', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">GST Number</label>
              <input
                type="text"
                value={formData.companyDetails.gstNumber}
                onChange={(e) => handleChange('companyDetails', 'gstNumber', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin size={14} className="inline mr-1" /> Street Address
              </label>
              <input
                type="text"
                value={formData.companyDetails.address.street}
                onChange={(e) => handleAddressChange('street', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
              <input
                type="text"
                value={formData.companyDetails.address.city}
                onChange={(e) => handleAddressChange('city', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
              <input
                type="text"
                value={formData.companyDetails.address.state}
                onChange={(e) => handleAddressChange('state', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</label>
              <input
                type="text"
                value={formData.companyDetails.address.zipCode}
                onChange={(e) => handleAddressChange('zipCode', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
              <input
                type="text"
                value={formData.companyDetails.address.country}
                onChange={(e) => handleAddressChange('country', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Account Info */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Status</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full mt-1 ${
                user?.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>{user?.isActive ? 'Active' : 'Inactive'}</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Email Verified</p>
              <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full mt-1 ${
                user?.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>{user?.isVerified ? 'Verified' : 'Not Verified'}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={18} className="mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ShipperProfile;
