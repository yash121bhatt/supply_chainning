import { useEffect, useState } from 'react';
import useAuthStore from '../../context/AuthContext';
import { authAPI } from '../../services';
import { User, Shield, Mail, Phone, Save, Building } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminProfile = () => {
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({
    name: '',
    phone: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({ name: user.name || '', phone: user.phone || '' });
      setLoading(false);
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await authAPI.updateProfile(formData);
      toast.success('Profile updated');
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
          <h1 className="text-2xl font-bold text-gray-900">Admin Profile</h1>
          <p className="text-gray-600">Manage your account</p>
        </div>
      </div>

      {/* Role Banner */}
      <div className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl p-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-white bg-opacity-20 rounded-lg">
            <Shield size={32} />
          </div>
          <div>
            <h2 className="text-xl font-bold">Administrator</h2>
            <p className="text-red-100">Full platform access and management capabilities</p>
          </div>
        </div>
      </div>

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
              onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(f => ({ ...f, phone: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
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

      {/* Account Status */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Shield className="text-red-600 mr-2" size={20} />
          Account Status
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Status</p>
            <span className="inline-block px-3 py-1 text-sm font-medium rounded-full mt-1 bg-green-100 text-green-800">Active</span>
          </div>
          <div>
            <p className="text-sm text-gray-600">Email Verified</p>
            <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full mt-1 ${
              user?.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}>{user?.isVerified ? 'Verified' : 'Not Verified'}</span>
          </div>
          {user?.companyDetails?.companyName && (
            <div className="col-span-2">
              <p className="text-sm text-gray-600"><Building size={14} className="inline mr-1" /> Company</p>
              <p className="text-gray-900 mt-1">{user.companyDetails.companyName}</p>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition flex items-center disabled:opacity-50"
        >
          <Save size={18} className="mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

export default AdminProfile;
