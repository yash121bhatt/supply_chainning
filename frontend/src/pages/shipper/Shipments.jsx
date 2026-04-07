import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { shipmentAPI } from '../../services';
import { formatCurrency, formatDate, getShipmentStatusColor, getShipmentStatusLabel } from '../../utils/helpers';
import { Package, Filter, Search, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const Shipments = () => {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    search: ''
  });

  useEffect(() => {
    loadShipments();
  }, [filters]);

  const loadShipments = async () => {
    setLoading(true);
    try {
      const res = await shipmentAPI.getMyShipments(filters);
      const shipments = res.data?.shipments || res.shipments || [];
      setShipments(shipments);
    } catch (error) {
      toast.error('Failed to load shipments');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Shipments</h1>
          <p className="text-gray-600">Manage and track all your shipments</p>
        </div>
        <Link
          to="/shipper/shipments/create"
          className="inline-flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
        >
          <Package size={20} className="mr-2" />
          New Shipment
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by shipment number..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="text-gray-400" size={20} />
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="assigned">Assigned</option>
              <option value="in_transit">In Transit</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Shipments List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {shipments.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No shipments found</h3>
            <p className="mt-2 text-gray-500">
              {filters.status || filters.search
                ? 'Try adjusting your filters'
                : 'Get started by creating your first shipment.'}
            </p>
            <Link
              to="/shipper/shipments/create"
              className="mt-4 inline-flex items-center text-primary-600 hover:text-primary-700"
            >
              Create Shipment <ArrowRight size={16} className="ml-1" />
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Shipment
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Route
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Pickup Date
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {shipments.map((shipment) => (
                  <tr key={shipment._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-primary-600">{shipment.shipmentNumber}</p>
                        {shipment.carrier && (
                          <p className="text-sm text-gray-600">{shipment.carrier.name}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p>{shipment.pickupLocation.city}</p>
                        <p className="text-gray-500">↓</p>
                        <p>{shipment.deliveryLocation.city}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getShipmentStatusColor(shipment.status)}`}>
                        {getShipmentStatusLabel(shipment.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(shipment.pickupDate)}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900">
                      {formatCurrency(shipment.pricing.acceptedPrice || shipment.pricing.quotedPrice)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/shipper/shipments/${shipment._id}`}
                        className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Shipments;