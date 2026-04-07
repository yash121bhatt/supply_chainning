import { useEffect, useState } from 'react';
import { adminUserAPI } from '../../services';
import { formatDate } from '../../utils/helpers';
import { Users, Search, UserX, UserCheck, Ban, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [filters, setFilters] = useState({
    search: '',
    role: '',
    status: ''
  });

  useEffect(() => { loadUsers(); }, [filters, page]);
  useEffect(() => { loadStats(); }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20, ...filters };
      if (filters.status === 'active') params.status = undefined;
      const res = await adminUserAPI.getAll(params);
      setUsers(res.data.users);
      setTotalPages(res.data.pagination.pages);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await adminUserAPI.getStats();
      setStats(res.data);
    } catch { /* ignore */ }
  };

  const handleStatusToggle = async (id, currentActive) => {
    try {
      await adminUserAPI.updateStatus(id, { isActive: !currentActive });
      toast.success(`User ${!currentActive ? 'activated' : 'deactivated'}`);
      loadUsers();
      loadStats();
    } catch {
      toast.error('Failed to update user status');
    }
  };

  const handleVerifyToggle = async (id, currentVerified) => {
    try {
      await adminUserAPI.verify(id, { isVerified: !currentVerified });
      toast.success(`User ${!currentVerified ? 'verified' : 'unverified'}`);
      loadUsers();
      loadStats();
    } catch {
      toast.error('Failed to update verification');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await adminUserAPI.deleteUser(id);
      toast.success('User deleted');
      loadUsers();
      loadStats();
    } catch {
      toast.error('Failed to delete user');
    }
  };

  const getRoleColor = (role) => {
    const c = { shipper: 'bg-blue-100 text-blue-800', carrier: 'bg-purple-100 text-purple-800', driver: 'bg-green-100 text-green-800', admin: 'bg-red-100 text-red-800' };
    return c[role] || 'bg-gray-100 text-gray-800';
  };

  const filterStatuses = [
    { value: '', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'verified', label: 'Verified' },
    { value: 'unverified', label: 'Unverified' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600">Manage all registered users</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Total', value: stats.totalUsers, color: 'text-blue-600' },
            { label: 'Shippers', value: stats.totalShippers, color: 'text-blue-600' },
            { label: 'Carriers', value: stats.totalCarriers, color: 'text-purple-600' },
            { label: 'Drivers', value: stats.totalDrivers, color: 'text-green-600' },
            { label: 'Admins', value: stats.totalAdmins, color: 'text-red-600' },
            { label: 'Verified', value: stats.verifiedUsers, color: 'text-emerald-600' }
          ].map(item => (
            <div key={item.label} className="bg-white rounded-xl shadow-sm p-4 text-center">
              <p className="text-xs text-gray-500">{item.label}</p>
              <p className={`text-xl font-bold mt-1 ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={filters.search}
              onChange={(e) => { setFilters(f => ({ ...f, search: e.target.value })); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
          <select
            value={filters.role}
            onChange={(e) => { setFilters(f => ({ ...f, role: e.target.value })); setPage(1); }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white"
          >
            <option value="">All Roles</option>
            <option value="shipper">Shipper</option>
            <option value="carrier">Carrier</option>
            <option value="driver">Driver</option>
            <option value="admin">Admin</option>
          </select>
          <select
            value={filters.status}
            onChange={(e) => {
              const val = e.target.value;
              setFilters(f => ({ ...f, status: val, ...(val === 'verified' ? { isVerified: true } : {}), ...(val === 'unverified' ? { isVerified: false } : {}) }));
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white"
          >
            {filterStatuses.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">User</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Verified</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Joined</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map(user => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{user.phone || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {user.isVerified ? (
                        <CheckCircle className="text-green-500" size={16} />
                      ) : (
                        <span className="text-xs text-yellow-600">Pending</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(user.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => handleStatusToggle(user._id, user.isActive)}
                          className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition"
                          title={user.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {user.isActive ? <Ban size={16} /> : <UserCheck size={16} />}
                        </button>
                        <button
                          onClick={() => handleVerifyToggle(user._id, user.isVerified)}
                          className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition"
                          title={user.isVerified ? 'Unverify' : 'Verify'}
                        >
                          <CheckCircle size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(user._id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                          title="Delete"
                        >
                          <UserX size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t">
            <p className="text-sm text-gray-600">Page {page} of {totalPages}</p>
            <div className="flex items-center space-x-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50 hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;
