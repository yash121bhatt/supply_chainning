import { useState } from 'react';
import { authAPI } from '../services';
import useAuthStore from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Lock } from 'lucide-react';

const ChangePassword = () => {
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) return toast.error('Passwords do not match');
    if (formData.newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      await authAPI.changePassword({ currentPassword: formData.currentPassword, newPassword: formData.newPassword });
      toast.success('Password changed successfully');
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch {
      toast.error('Current password is incorrect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Change Password</h1>
        <p className="text-gray-600">Update your account password</p>
      </div>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mr-3">
              <Lock className="text-primary-600" size={20} />
            </div>
            <div>
              <p className="font-medium text-gray-900 capitalize">{user?.role}</p>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
          </div>
        </div>
        {[
          { key: 'currentPassword', label: 'Current Password' },
          { key: 'newPassword', label: 'New Password' },
          { key: 'confirmPassword', label: 'Confirm New Password' }
        ].map(field => (
          <div key={field.key}>
            <label className="block text-sm font-medium text-gray-700 mb-2">{field.label}</label>
            <input
              type="password"
              value={formData[field.key]}
              onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              required
              minLength={6}
            />
          </div>
        ))}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 transition disabled:opacity-50"
        >
          {loading ? 'Changing...' : 'Change Password'}
        </button>
      </form>
    </div>
  );
};

export default ChangePassword;
