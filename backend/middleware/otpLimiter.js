const AppError = require('../utils/errorHandler').AppError;

const otpAttemptStore = new Map();

const MAX_OTP_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 min window

const otpLimiter = (req, res, next) => {
  const { email } = req.body;
  if (!email) return next();

  const now = Date.now();
  const record = otpAttemptStore.get(email);

  if (!record || now - record.start > WINDOW_MS) {
    otpAttemptStore.set(email, { count: 1, start: now });
    req.otpLimiterRemaining = MAX_OTP_ATTEMPTS - 1;
    return next();
  }

  record.count += 1;

  if (record.count > MAX_OTP_ATTEMPTS) {
    const retryAfter = Math.ceil((record.start + WINDOW_MS - now) / 1000 / 60);
    return next(new AppError(`Too many OTP requests. Please try again in ${retryAfter} minutes`, 429));
  }

  req.otpLimiterRemaining = MAX_OTP_ATTEMPTS - record.count;
  return next();
};

module.exports = { otpLimiter, otpAttemptStore };
