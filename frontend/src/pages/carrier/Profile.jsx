import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, carrierAPI } from '../../services';
import { formatCurrency, formatDateTime } from '../../utils/helpers';
import toast from 'react-hot-toast';
import { User, Building, Mail, Phone, MapPin, Save, Truck, Users, RefreshCw, DollarSign, Plus } from 'lucide-react';

const CarrierProfile = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    carrierDetails: {
      companyName: '',
      gstNumber: '',
      panNumber: '',
      businessLicense: '',
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
        carrierDetails: {
          companyName: u.carrierDetails?.companyName || '',
          gstNumber: u.carrierDetails?.gstNumber || '',
          panNumber: u.carrierDetails?.panNumber || '',
          businessLicense: u.carrierDetails?.businessLicense || '',
          address: {
            street: u.carrierDetails?.address?.street || '',
            city: u.carrierDetails?.address?.city || '',
            state: u.carrierDetails?.address?.state || '',
            zipCode: u.carrierDetails?.address?.zipCode || '',
            country: u.carrierDetails?.address?.country || 'India'
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
      carrierDetails: {
        ...prev.carrierDetails,
        address: { ...prev.carrierDetails.address, [field]: value }
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
          <h1 className="text-2xl font-bold text-gray-900">Carrier Profile</h1>
          <p className="text-gray-600">Manage your account and carrier details</p>
        </div>
        <button onClick={loadProfile} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
          <RefreshCw size={18} />
        </button>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <p className="text-gray-900 py-2">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Carrier Details */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Building className="text-primary-600 mr-2" size={20} />
            Carrier Company Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
              <input
                type="text"
                value={formData.carrierDetails.companyName}
                onChange={(e) => handleChange('carrierDetails', 'companyName', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">GST Number</label>
              <input
                type="text"
                value={formData.carrierDetails.gstNumber}
                onChange={(e) => handleChange('carrierDetails', 'gstNumber', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">PAN Number</label>
              <input
                type="text"
                value={formData.carrierDetails.panNumber}
                onChange={(e) => handleChange('carrierDetails', 'panNumber', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Business License</label>
              <input
                type="text"
                value={formData.carrierDetails.businessLicense}
                onChange={(e) => handleChange('carrierDetails', 'businessLicense', e.target.value)}
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
                value={formData.carrierDetails.address.street}
                onChange={(e) => handleAddressChange('street', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
              <input
                type="text"
                value={formData.carrierDetails.address.city}
                onChange={(e) => handleAddressChange('city', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
              <input
                type="text"
                value={formData.carrierDetails.address.state}
                onChange={(e) => handleAddressChange('state', e.target.value)}
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
              <p className="text-sm text-gray-600">Verified</p>
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
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition flex items-center disabled:opacity-50"
          >
            <Save size={18} className="mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CarrierProfile;
