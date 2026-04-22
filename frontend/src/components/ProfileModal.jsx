import { useState, useEffect } from 'react';
import { directoryAPI } from '../services';
import { 
  X, MapPin, Shield, Calendar, 
  FileText, CheckCircle, Clock
} from 'lucide-react';
import { formatDate } from '../utils/helpers';
import toast from 'react-hot-toast';

const ProfileModal = ({ profile, type, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [fullProfile, setFullProfile] = useState(profile);

  useEffect(() => {
    if (profile?._id && !profile.carrierDetails && !profile.companyDetails) {
      loadFullProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?._id]);

  const loadFullProfile = async () => {
    setLoading(true);
    try {
      let response;
      if (type === 'carrier') {
        response = await directoryAPI.getCarrierProfile(profile._id);
        setFullProfile(response.data.carrier);
      } else {
        response = await directoryAPI.getShipperProfile(profile._id);
        setFullProfile(response.data.shipper);
      }
    } catch {
      toast.error('Failed to load profile details');
    } finally {
      setLoading(false);
    }
  };

  const getLocation = () => {
    const details = type === 'carrier' 
      ? fullProfile?.carrierDetails 
      : fullProfile?.companyDetails;
    const addr = details?.address;
    if (!addr) return 'N/A';
    return addr.street 
      ? `${addr.street}, ${addr.city}, ${addr.state} ${addr.zipCode}, ${addr.country}`
      : addr.city && addr.state 
        ? `${addr.city}, ${addr.state} ${addr.zipCode || ''}`
        : addr.city || addr.state || 'N/A';
  };

  const getCompanyName = () => {
    return type === 'carrier'
      ? fullProfile?.carrierDetails?.companyName
      : fullProfile?.companyDetails?.companyName;
  };

  const getLicenseNumber = () => {
    return type === 'carrier'
      ? fullProfile?.carrierDetails?.businessLicense
      : fullProfile?.companyDetails?.gstNumber;
  };

  const kycDocuments = fullProfile?.kycDocuments || [];

  if (!profile) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900">
            {getCompanyName() || fullProfile?.name}
          </h3>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-medium text-gray-900">
                    {getCompanyName() || fullProfile?.name}
                  </span>
                  {fullProfile?.isVerified && (
                    <Shield className="w-5 h-5 text-green-500" />
                  )}
                </div>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                  fullProfile?.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {fullProfile?.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 uppercase">Contact Person</label>
                    <p className="font-medium text-gray-900">{fullProfile?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase">Email</label>
                    <p className="font-medium text-gray-900 text-sm">{fullProfile?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase">Phone</label>
                    <p className="font-medium text-gray-900">{fullProfile?.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase">
                      {type === 'carrier' ? 'MC/DOT Number' : 'GST Number'}
                    </label>
                    <p className="font-medium text-gray-900">{getLicenseNumber() || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 uppercase flex items-center gap-1">
                  <MapPin size={14} /> Location
                </label>
                <p className="font-medium text-gray-900 mt-1">{getLocation()}</p>
              </div>

              {type === 'carrier' && (
                <div className="grid grid-cols-2 gap-4">
                  {fullProfile?.carrierDetails?.gstNumber && (
                    <div>
                      <label className="text-xs text-gray-500 uppercase">GST Number</label>
                      <p className="font-medium text-gray-900">{fullProfile.carrierDetails.gstNumber}</p>
                    </div>
                  )}
                  {fullProfile?.carrierDetails?.panNumber && (
                    <div>
                      <label className="text-xs text-gray-500 uppercase">PAN Number</label>
                      <p className="font-medium text-gray-900">{fullProfile.carrierDetails.panNumber}</p>
                    </div>
                  )}
                </div>
              )}

              {kycDocuments.length > 0 && (
                <div>
                  <label className="text-xs text-gray-500 uppercase flex items-center gap-1 mb-2">
                    <FileText size={14} /> KYC Documents
                  </label>
                  <div className="space-y-2">
                    {kycDocuments.map((doc, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <FileText size={16} className="text-gray-500" />
                          <span className="text-sm font-medium">{doc.documentType}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {doc.verified ? (
                            <span className="flex items-center text-xs text-green-600">
                              <CheckCircle size={12} className="mr-1" />
                              Verified
                            </span>
                          ) : (
                            <span className="flex items-center text-xs text-yellow-600">
                              <Clock size={12} className="mr-1" />
                              Pending
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar size={14} />
                <span>Member since {formatDate(fullProfile?.createdAt)}</span>
              </div>
            </>
          )}
        </div>

        <div className="p-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;