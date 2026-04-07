const { validationResult } = require('express-validator');
const asyncHandler = require('../utils/asyncHandler');

// Validate request
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

// Async validation wrapper
exports.validateAsync = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));
    return exports.validate(req, res, next);
  };
};