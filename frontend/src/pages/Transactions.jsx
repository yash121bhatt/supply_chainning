import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { paymentAPI } from '../services';
import { formatCurrency, formatDateTime } from '../utils/helpers';
import { ArrowLeft, CreditCard, Search, Filter, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, AlertCircle } from 'lucide-react';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadTransactions();
  }, [pagination.page]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const res = await paymentAPI.getTransactions({ page: pagination.page, limit: pagination.limit });
      setTransactions(res.data?.transactions || res.transactions || []);
      if (res.data?.pagination) {
        setPagination(prev => ({ ...prev, ...res.data.pagination }));
      }
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusConfig = {
    pending: { color: 'text-yellow-600', bg: 'bg-yellow-100', icon: Clock, label: 'Pending' },
    processing: { color: 'text-blue-600', bg: 'bg-blue-100', icon: Clock, label: 'Processing' },
    completed: { color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle, label: 'Completed' },
    failed: { color: 'text-red-600', bg: 'bg-red-100', icon: AlertCircle, label: 'Failed' },
    refunded: { color: 'text-gray-600', bg: 'bg-gray-100', icon: CheckCircle, label: 'Refunded' }
  };

  const filteredTransactions = transactions.filter(tx => {
    if (filter === 'all') return true;
    return tx.status === filter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/shipper/dashboard" className="mr-4 text-gray-600 hover:text-gray-900">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
            <p className="text-gray-600">View your payment history</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search transactions..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={20} className="text-gray-500" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <CreditCard size={48} className="mb-4 text-gray-300" />
            <p>No transactions found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredTransactions.map((tx) => {
              const status = statusConfig[tx.status] || statusConfig.pending;
              const StatusIcon = status.icon;
              const isPayer = tx.payer?._id || tx.payer;

              return (
                <div key={tx._id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        isPayer ? 'bg-red-100' : 'bg-green-100'
                      }`}>
                        {isPayer ? (
                          <ArrowUpRight className="text-red-600" size={20} />
                        ) : (
                          <ArrowDownLeft className="text-green-600" size={20} />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {tx.shipment?.shipmentNumber || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {isPayer ? 'Payment Out' : 'Payment In'} • {formatDateTime(tx.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${
                        isPayer ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {isPayer ? '-' : '+'}{formatCurrency(tx.amount)}
                      </p>
                      <div className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${status.bg}`}>
                        <StatusIcon size={12} className={status.color} />
                        <span className={status.color}>{status.label}</span>
                      </div>
                    </div>
                  </div>
                  {tx.paymentGateway?.paymentId && (
                    <p className="text-xs text-gray-400 mt-2 ml-16">
                      Transaction ID: {tx.paymentGateway.paymentId}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.pages}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;