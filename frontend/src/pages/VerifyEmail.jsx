import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { Mail, Shield, ChevronLeft, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const VerifyEmail = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(Array(6).fill(''));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [maxAttempts, setMaxAttempts] = useState(5);
  const [countdown, setCountdown] = useState(0);

  // If user arrives here directly, check for session email
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        if (user?.email && user?.emailVerified) {
          toast.success('Email already verified!');
          navigate('/', { replace: true });
        }
        if (user?.email) setEmail(user.email);
      } catch (e) { /* ignore */ }
    }
  }, [navigate]);

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, countdown]);

  const handleOtpChange = (index, value) => {
    if (!/^[0-9]?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next field
    if (value && index < 5) {
      const next = document.getElementById(`otp-${index + 1}`);
      next?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      const digitArray = pasted.split('');
      setOtp(digitArray);
      // Focus last input
      document.getElementById('otp-5')?.focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) {
      toast.error('Please enter the full 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      // Use raw axios to get full response
      const { default: axios } = await import('axios');
      const res = await axios.post(`${import.meta.env.VITE_API_URL || '/api'}/auth/verify-email`, {
        email,
        otp: code,
      }, {
        headers: { 'Content-Type': 'application/json' },
      });
      toast.success(res.data?.message || 'Email verified successfully!');
      navigate('/login');
    } catch (error) {
      const msg = error.response?.data?.message || 'Verification failed';
      toast.error(msg);
      setOtp(Array(6).fill(''));
      document.getElementById('otp-0')?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) {
      toast.error(`Please wait ${countdown}s before requesting a new OTP`);
      return;
    }

    if (attempts >= maxAttempts) {
      toast.error('Maximum resend limit reached. Please contact support.');
      return;
    }

    setResending(true);
    try {
      const { default: axios } = await import('axios');
      const res = await axios.post(`${import.meta.env.VITE_API_URL || '/api'}/auth/resend-otp`, {
        email,
      }, {
        headers: { 'Content-Type': 'application/json' },
      });
      toast.success(res.data?.message || 'OTP resent!');
      setAttempts((p) => p + 1);
      setMaxAttempts(res.data?.data?.maxAttempts || 5);
      setCountdown(60);
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to resend OTP';
      toast.error(msg);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/register" className="text-gray-600 hover:text-primary-600 text-sm inline-flex items-center gap-1 mb-4">
            <ChevronLeft size={16} /> Back to registration
          </Link>
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-2xl mb-4">
            <Mail className="text-primary-600" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Verify Your Email</h1>
          <p className="text-gray-600 mt-2">
            We sent a 6-digit code to <span className="font-medium text-gray-800">{email || 'your email'}</span>
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleVerify} className="space-y-6">
            {email ? (
              <p className="text-sm text-gray-500 text-center">
                Enter email if not showing:
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  placeholder="your@email.com"
                />
              </p>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  required
                />
              </div>
            )}

            {/* OTP Digits Grid */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                <Shield size={16} className="inline mr-1" /> Enter 6-Digit Code
              </label>
              <div className="flex justify-center gap-2" onPaste={handlePaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => {
                      // Backspace goes to previous
                      if (e.key === 'Backspace' && !digit && i > 0) {
                        document.getElementById(`otp-${i - 1}`)?.focus();
                      }
                    }}
                    className="w-12 h-14 text-center text-xl font-bold border-2 border-gray-300 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
                    autoComplete="off"
                  />
                ))}
              </div>
              <p className="text-xs text-gray-400 text-center mt-2">Valid for 10 minutes</p>
            </div>

            {/* Verify Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 focus:ring-4 focus:ring-primary-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>

            {/* Resend */}
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">
                Didn't receive a code?{' '}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending || countdown > 0 || attempts >= maxAttempts}
                  className="text-primary-600 hover:text-primary-700 font-medium inline-flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw size={14} className={resending ? 'animate-spin' : ''} />
                  {resending ? 'Sending...' : countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
                </button>
              </p>
              {attempts > 0 && (
                <p className="text-xs text-gray-400">
                  Attempt {attempts}/{maxAttempts}
                </p>
              )}
            </div>

            <div className="pt-2 text-center">
              <Link to="/login" className="text-sm text-gray-500 hover:text-primary-600 transition">
                Back to Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
