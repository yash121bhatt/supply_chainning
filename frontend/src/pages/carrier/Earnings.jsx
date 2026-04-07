import { useEffect, useState } from 'react';
import { carrierAPI } from '../../services';
import { formatCurrency } from '../../utils/helpers';
import toast from 'react-hot-toast';
import { DollarSign, TrendingUp, BarChart3, Calendar } from 'lucide-react';

const CarrierEarnings = () => {
  const [monthlyData, setMonthlyData] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalShipments, setTotalShipments] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

  useEffect(() => {
    fetchEarnings();
  }, [dateRange]);

  const fetchEarnings = async () => {
    setLoading(true);
    try {
      const params = {};
      if (dateRange.startDate) params.startDate = dateRange.startDate;
      if (dateRange.endDate) params.endDate = dateRange.endDate;
      const response = await carrierAPI.getEarnings(params);
      setMonthlyData(response.data.monthly);
      setTotal(response.data.total);
      setTotalShipments(response.data.totalShipments);
    } catch {
      toast.error('Failed to load earnings data');
    } finally {
      setLoading(false);
    }
  };

  const getMonthName = (month) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month - 1] || '';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Earnings Report</h1>
        <p className="text-gray-600">View your revenue and delivery statistics</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col md:flex-row items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <div className="flex items-center">
              <Calendar size={16} className="text-gray-400 mr-2" />
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
          <button
            onClick={() => setDateRange({ startDate: '', endDate: '' })}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Earnings</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(total)}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <DollarSign className="text-green-600" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Delivered Shipments</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{totalShipments}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <BarChart3 className="text-blue-600" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg per Shipment</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{totalShipments > 0 ? formatCurrency(total / totalShipments) : '-'}</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <TrendingUp className="text-yellow-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Breakdown */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Monthly Breakdown</h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : monthlyData.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No earnings data found for the selected period.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Period</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Shipments</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {monthlyData.map(row => (
                  <tr key={`${row._id.year}-${row._id.month}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {getMonthName(row._id.month)} {row._id.year}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-600">{row.count}</td>
                    <td className="px-6 py-4 text-right font-semibold text-green-600">{formatCurrency(row.total)}</td>
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

export default CarrierEarnings;
