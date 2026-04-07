import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { shipmentAPI } from '../../services';
import { formatCurrency } from '../../utils/helpers';
import { Package, MapPin, Calendar, DollarSign, Truck, Save, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const CreateShipment = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    pickupLocation: {
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'India'
    },
    deliveryLocation: {
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'India'
    },
    pickupDate: '',
    deliveryDate: '',
    goodsDetails: {
      description: '',
      weight: '',
      weightUnit: 'kg',
      dimensions: {
        length: '',
        width: '',
        height: '',
        unit: 'cm'
      },
      quantity: 1,
      value: '',
      specialInstructions: '',
      isFragile: false,
      isHazardous: false
    },
    pricing: {
      quotedPrice: ''
    },
    shipmentType: 'full_truckload'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        pickupDate: new Date(formData.pickupDate).toISOString(),
        deliveryDate: new Date(formData.deliveryDate).toISOString(),
        goodsDetails: {
          ...formData.goodsDetails,
          weight: parseFloat(formData.goodsDetails.weight),
          value: parseFloat(formData.goodsDetails.value),
          dimensions: {
            ...formData.goodsDetails.dimensions,
            length: parseFloat(formData.goodsDetails.dimensions.length) || null,
            width: parseFloat(formData.goodsDetails.dimensions.width) || null,
            height: parseFloat(formData.goodsDetails.dimensions.height) || null
          }
        },
        pricing: {
          quotedPrice: parseFloat(formData.pricing.quotedPrice)
        }
      };

      await shipmentAPI.create(payload);
      toast.success('Shipment created successfully!');
      navigate('/shipper/shipments');
    } catch (error) {
      toast.error(error.message || 'Failed to create shipment');
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

  const handleGoodsChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      goodsDetails: {
        ...prev.goodsDetails,
        [field]: value
      }
    }));
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center">
        <button
          onClick={() => navigate('/shipper/shipments')}
          className="mr-4 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create New Shipment</h1>
          <p className="text-gray-600">Fill in the details to create a new shipment</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Locations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pickup Location */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <MapPin className="text-primary-600 mr-2" size={20} />
              Pickup Location
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  value={formData.pickupLocation.address}
                  onChange={(e) => handleChange('pickupLocation', 'address', e.target.value)}
                  placeholder="Street address"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <input
                    type="text"
                    value={formData.pickupLocation.city}
                    onChange={(e) => handleChange('pickupLocation', 'city', e.target.value)}
                    placeholder="City"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                  <input
                    type="text"
                    value={formData.pickupLocation.state}
                    onChange={(e) => handleChange('pickupLocation', 'state', e.target.value)}
                    placeholder="State"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</label>
                <input
                  type="text"
                  value={formData.pickupLocation.zipCode}
                  onChange={(e) => handleChange('pickupLocation', 'zipCode', e.target.value)}
                  placeholder="123456"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* Delivery Location */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <MapPin className="text-red-600 mr-2" size={20} />
              Delivery Location
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  value={formData.deliveryLocation.address}
                  onChange={(e) => handleChange('deliveryLocation', 'address', e.target.value)}
                  placeholder="Street address"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <input
                    type="text"
                    value={formData.deliveryLocation.city}
                    onChange={(e) => handleChange('deliveryLocation', 'city', e.target.value)}
                    placeholder="City"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                  <input
                    type="text"
                    value={formData.deliveryLocation.state}
                    onChange={(e) => handleChange('deliveryLocation', 'state', e.target.value)}
                    placeholder="State"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</label>
                <input
                  type="text"
                  value={formData.deliveryLocation.zipCode}
                  onChange={(e) => handleChange('deliveryLocation', 'zipCode', e.target.value)}
                  placeholder="123456"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Calendar className="text-primary-600 mr-2" size={20} />
            Schedule
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pickup Date</label>
              <input
                type="date"
                value={formData.pickupDate}
                onChange={(e) => handleChange(null, 'pickupDate', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Date</label>
              <input
                type="date"
                value={formData.deliveryDate}
                onChange={(e) => handleChange(null, 'deliveryDate', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                required
              />
            </div>
          </div>
        </div>

        {/* Goods Details */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Package className="text-primary-600 mr-2" size={20} />
            Goods Details
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.goodsDetails.description}
                onChange={(e) => handleGoodsChange( 'description', e.target.value)}
                placeholder="Describe the goods to be shipped"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg)</label>
                <input
                  type="number"
                  value={formData.goodsDetails.weight}
                  onChange={(e) => handleGoodsChange( 'weight', e.target.value)}
                  placeholder="1000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Goods Value (₹)</label>
                <input
                  type="number"
                  value={formData.goodsDetails.value}
                  onChange={(e) => handleGoodsChange( 'value', e.target.value)}
                  placeholder="50000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Special Instructions</label>
              <textarea
                value={formData.goodsDetails.specialInstructions}
                onChange={(e) => handleGoodsChange( 'specialInstructions', e.target.value)}
                placeholder="Any special handling instructions"
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
            <div className="flex items-center space-x-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.goodsDetails.isFragile}
                  onChange={(e) => handleGoodsChange( 'isFragile', e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">Fragile</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.goodsDetails.isHazardous}
                  onChange={(e) => handleGoodsChange( 'isHazardous', e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">Hazardous</span>
              </label>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <DollarSign className="text-primary-600 mr-2" size={20} />
            Pricing
          </h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Quoted Price (₹)</label>
            <input
              type="number"
              value={formData.pricing.quotedPrice}
              onChange={(e) => handleChange('pricing', 'quotedPrice', e.target.value)}
              placeholder="10000"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              required
            />
            {formData.pricing.quotedPrice && (
              <p className="mt-2 text-sm text-gray-600">
                Quoted Price: {formatCurrency(parseFloat(formData.pricing.quotedPrice))}
              </p>
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/shipper/shipments')}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={20} className="mr-2" />
            {loading ? 'Creating...' : 'Create Shipment'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateShipment;