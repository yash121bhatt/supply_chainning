import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../services';
import toast from 'react-hot-toast';
import { Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

const SetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tokenValid, setTokenValid] = useState(null);
  const [driverInfo, setDriverInfo] = useState(null);

  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      setLoading(false);
      return;
    }

    const validateToken = async () => {
      try {
        const response = await authAPI.validateInviteToken(token);
        setTokenValid(true);
        setDriverInfo({ email: response.data.email, name: response.data.name });
      } catch {
        setTokenValid(false);
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, [token]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      return toast.error('Passwords do not match');
    }

    if (formData.password.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }

    setSubmitting(true);
    try {
      await authAPI.setPassword({
        token,
        password: formData.password
      });

      toast.success('Password set successfully! Please login with your credentials.');
      navigate('/login');
    } catch (error) {
      toast.error(error.message || 'Failed to set password. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-primary-600 mx-auto" />
          <p className="mt-4 text-gray-600">Validating invitation...</p>
        </div>
      </div>
    );
  }

  if (!token || tokenValid === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="text-red-600" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid or Expired Link</h1>
            <p className="text-gray-600 mb-6">
              {token
                ? 'This invitation link has expired or is invalid. Please contact your carrier to resend the invitation.'
                : 'No invitation token provided. Please use the link from your email.'}
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 transition"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl mb-4">
            <Lock className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Set Your Password</h1>
          <p className="text-gray-600 mt-2">
            Welcome{driverInfo?.name ? `, ${driverInfo.name}` : ''}! Please set your password to activate your driver account.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {driverInfo && (
            <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center">
                <CheckCircle className="text-green-600 mr-2" size={20} />
                <span className="text-green-800 font-medium">Invitation verified</span>
              </div>
              <p className="text-green-700 text-sm mt-1">{driverInfo.email}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                minLength={6}
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 transition disabled:opacity-50 flex items-center justify-center"
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  Setting Password...
                </>
              ) : (
                'Set Password & Activate Account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Password must be at least 6 characters long</p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button onClick={() => navigate('/login')} className="text-sm text-gray-500 hover:text-gray-700">
            Already have an account? Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default SetPassword;
