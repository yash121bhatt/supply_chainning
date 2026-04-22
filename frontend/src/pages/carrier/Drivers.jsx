import { useEffect, useState } from 'react';
import { carrierAPI } from '../../services';
import { formatDateTime } from '../../utils/helpers';
import toast from 'react-hot-toast';
import { Users, Plus, Phone, Mail, CheckCircle, XCircle, RefreshCw, Search, Loader2 } from 'lucide-react';

const CarrierDrivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [inviting, setInviting] = useState(false);
  const [resendingId, setResendingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    licenseNumber: '',
    licenseExpiry: ''
  });

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    setLoading(true);
    try {
      const response = await carrierAPI.getDrivers();
      setDrivers(response.data.drivers);
    } catch (error) {
      toast.error(error.message || 'Failed to load drivers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setInviting(true);
    try {
      await carrierAPI.inviteDriver(formData);
      toast.success(`${formData.name} has been invited successfully! They will receive an email to set their password.`);
      setShowModal(false);
      setFormData({ name: '', email: '', phone: '', licenseNumber: '', licenseExpiry: '' });
      loadDrivers();
    } catch (error) {
      toast.error(error.message || 'Failed to invite driver');
    } finally {
      setInviting(false);
    }
  };

  const handleResendInvite = async (driverId, driverName) => {
    setResendingId(driverId);
    try {
      await carrierAPI.resendDriverInvite(driverId);
      toast.success(`Invitation resent to ${driverName}!`);
    } catch (error) {
      toast.error(error.message || 'Failed to resend invitation');
    } finally {
      setResendingId(null);
    }
  };

  const filteredDrivers = drivers.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.email.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (driver) => {
    if (driver.isActive && driver.emailVerified) {
      return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Active</span>;
    }
    if (driver.isInvited && !driver.isActive) {
      return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Pending Activation</span>;
    }
    return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">Inactive</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Drivers</h1>
          <p className="text-gray-600">Manage drivers assigned to your company</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
        >
          <Plus size={18} className="mr-2" />
          Invite Driver
        </button>
      </div>

      {/* Search */}
      <div className="relative w-full md:w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search drivers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
        />
      </div>

      {/* Drivers List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : filteredDrivers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No drivers yet</h3>
          <p className="mt-2 text-gray-500">Invite your first driver to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDrivers.map(driver => (
            <div key={driver._id} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                    <Users className="text-primary-600" size={22} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{driver.name}</p>
                    {getStatusBadge(driver)}
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center text-gray-600">
                  <Mail size={14} className="mr-2 text-gray-400" />
                  <span className="truncate">{driver.email}</span>
                </div>
                {driver.phone && (
                  <div className="flex items-center text-gray-600">
                    <Phone size={14} className="mr-2 text-gray-400" />
                    <span>{driver.phone}</span>
                  </div>
                )}
                {driver.driverDetails?.licenseNumber && (
                  <div className="flex items-center text-gray-600">
                    <CheckCircle size={14} className="mr-2 text-gray-400" />
                    <span>DL: {driver.driverDetails.licenseNumber}</span>
                  </div>
                )}
                {driver.driverDetails?.licenseExpiry && (
                  <div className="flex items-center text-gray-600">
                    <XCircle size={14} className="mr-2 text-gray-400" />
                    <span>Expiry: {formatDateTime(driver.driverDetails.licenseExpiry)}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t flex items-center justify-between">
                <p className="text-xs text-gray-500">Joined {formatDateTime(driver.createdAt)}</p>
                {driver.isInvited && !driver.emailVerified && (
                  <button
                    onClick={() => handleResendInvite(driver._id, driver.name)}
                    disabled={resendingId === driver._id}
                    className="flex items-center px-2 py-1 text-xs font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded transition"
                  >
                    {resendingId === driver._id ? (
                      <Loader2 size={12} className="animate-spin mr-1" />
                    ) : (
                      <RefreshCw size={12} className="mr-1" />
                    )}
                    Resend Invite
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Invite Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Invite New Driver</h2>
              <p className="text-sm text-gray-600 mt-1">An invitation email will be sent to the driver with a link to set their password.</p>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {[
                { name: 'name', label: 'Full Name', type: 'text', ph: 'John Doe', required: true },
                { name: 'email', label: 'Email', type: 'email', ph: 'driver@example.com', required: true },
                { name: 'phone', label: 'Phone', type: 'tel', ph: '+91 98765 43210', required: true },
                { name: 'licenseNumber', label: 'License Number', type: 'text', ph: 'DL-123456789', required: true },
                { name: 'licenseExpiry', label: 'License Expiry', type: 'date', required: true }
              ].map(f => (
                <div key={f.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{f.label}</label>
                  <input
                    type={f.type}
                    name={f.name}
                    value={formData[f.name]}
                    onChange={(e) => setFormData(prev => ({ ...prev, [f.name]: e.target.value }))}
                    placeholder={f.ph || ''}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    required={f.required}
                  />
                </div>
              ))}

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setFormData({ name: '', email: '', phone: '', licenseNumber: '', licenseExpiry: '' }); }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  disabled={inviting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 flex items-center"
                >
                  {inviting && <Loader2 size={16} className="animate-spin mr-2" />}
                  Send Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CarrierDrivers;
