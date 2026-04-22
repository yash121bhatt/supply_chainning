import { useState, useEffect } from 'react';
import { directoryAPI } from '../services';
import { Search, MapPin, Phone, Shield, ChevronLeft, ChevronRight, Package } from 'lucide-react';
import toast from 'react-hot-toast';

const ShipperDirectory = ({ onViewProfile }) => {
  const [shippers, setShippers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    loadShippers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, status, page]);

  const loadShippers = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10,
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(status && { status })
      };
      const response = await directoryAPI.getShippers(params);
      setShippers(response.data.shippers || []);
      setPagination(response.data.pagination || { page: 1, limit: 10, total: 0, pages: 1 });
    } catch {
      toast.error('Failed to load shippers');
    } finally {
      setLoading(false);
    }
  };

  const getLocation = (shipper) => {
    const addr = shipper.companyDetails?.address;
    if (!addr) return 'N/A';
    return addr.city && addr.state ? `${addr.city}, ${addr.state}` : addr.city || addr.state || 'N/A';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-full flex flex-col">
      <div className="p-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Shippers Directory</h3>
        
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search shippers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : shippers.length === 0 ? (
          <div className="p-6 text-center">
            <Package className="mx-auto h-10 w-10 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">No shippers found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {shippers.map((shipper) => (
              <div
                key={shipper._id}
                onClick={() => onViewProfile?.(shipper)}
                className="p-4 hover:bg-gray-50 cursor-pointer transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-900 truncate">
                        {shipper.companyDetails?.companyName || shipper.name}
                      </h4>
                      {shipper.isVerified && (
                        <Shield className="w-4 h-4 text-green-500 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {shipper.companyDetails?.gstNumber ? `GST: ${shipper.companyDetails.gstNumber}` : shipper.email}
                    </p>
                    
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center text-xs text-gray-600">
                        <MapPin size={12} className="mr-1 flex-shrink-0" />
                        <span className="truncate">{getLocation(shipper)}</span>
                      </div>
                      <div className="flex items-center text-xs text-gray-600">
                        <Phone size={12} className="mr-1 flex-shrink-0" />
                        <span>{shipper.phone}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1 ml-2">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      shipper.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {shipper.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {pagination.pages > 1 && (
        <div className="p-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-500">
            Page {pagination.page} of {pagination.pages}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={pagination.page === 1}
              className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
              disabled={pagination.page === pagination.pages}
              className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShipperDirectory;