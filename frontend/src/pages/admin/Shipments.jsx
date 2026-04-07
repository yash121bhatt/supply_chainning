import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services';
import { formatCurrency, formatDate, getShipmentStatusColor, getShipmentStatusLabel } from '../../utils/helpers';
import { Package, Search, Eye, Ban } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminShipments = () => {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    search: '',
    status: ''
  });

  useEffect(() => { loadShipments(); }, [filters, page]);

  const loadShipments = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (filters.status) params.status = filters.status;
      if (filters.search) params.city = filters.search;
      const res = await adminAPI.getShipments(params);
      setShipments(res.data.shipments);
      setTotalPages(res.data.pagination.pages);
    } catch {
      toast.error('Failed to load shipments');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    const reason = prompt('Reason for cancellation (optional):');
    if (reason === null) return;
    try {
      await adminAPI.cancelShipment(id, { reason: reason || 'Cancelled by admin' });
      toast.success('Shipment cancelled');
      loadShipments();
    } catch {
      toast.error('Failed to cancel shipment');
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Shipment Management</h1>
        <p className="text-gray-600">Monitor and manage all shipments</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by city or shipment number..."
              value={filters.search}
              onChange={(e) => { setFilters(f => ({ ...f, search: e.target.value })); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
          <select
            value={filters.status}
            onChange={(e) => { setFilters(f => ({ ...f, status: e.target.value })); setPage(1); }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="assigned">Assigned</option>
            <option value="picked_up">Picked Up</option>
            <option value="in_transit">In Transit</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {shipments.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4">No shipments found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Shipment</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Route</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Shipper</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Carrier</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Price</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {shipments.map(s => (
                  <tr key={s._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-primary-600">{s.shipmentNumber}</span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <p>{s.pickupLocation?.city}</p>
                      <p className="text-gray-500 text-xs">↓ {s.deliveryLocation?.city}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{s.shipper?.name || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{s.carrier?.name || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getShipmentStatusColor(s.status)}`}>
                        {getShipmentStatusLabel(s.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(s.pickupDate)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-right">{formatCurrency(s.pricing?.acceptedPrice || s.pricing?.quotedPrice)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <Link
                          to={`/admin/shipments/${s._id}`}
                          className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </Link>
                        {['pending', 'assigned', 'picked_up', 'in_transit'].includes(s.status) && (
                          <button
                            onClick={() => handleCancel(s._id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                            title="Cancel"
                          >
                            <Ban size={16} />
                          </button>
                        )}
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

export default AdminShipments;
