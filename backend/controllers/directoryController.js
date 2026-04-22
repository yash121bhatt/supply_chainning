const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/errorHandler').AppError;
const User = require('../models/User');
const { USER_ROLES } = require('../config/constants');

const DIRECTORY_FIELDS = {
  carrier: [
    'name',
    'email',
    'phone',
    'role',
    'avatar',
    'isVerified',
    'isActive',
    'carrierDetails',
    'kycDocuments',
    'createdAt'
  ],
  shipper: [
    'name',
    'email',
    'phone',
    'role',
    'avatar',
    'isVerified',
    'isActive',
    'companyDetails',
    'kycDocuments',
    'createdAt'
  ]
};

const sanitizeUser = (user, role) => {
  const data = {};
  const userObj = user.toObject ? user.toObject() : user;
  
  const fields = DIRECTORY_FIELDS[role] || DIRECTORY_FIELDS.shipper;
  fields.forEach(field => {
    if (userObj[field] !== undefined) {
      data[field] = userObj[field];
    }
  });
  
  return data;
};

exports.getCarriers = asyncHandler(async (req, res, next) => {
  const { 
    page = 1, 
    limit = 20, 
    search,
    status,
    city,
    state,
    equipmentType
  } = req.query;

  const query = { role: USER_ROLES.CARRIER };
  
  if (status === 'active') {
    query.isActive = true;
  } else if (status === 'inactive') {
    query.isActive = false;
  }
  
  if (city) {
    query['carrierDetails.address.city'] = { $regex: city, $options: 'i' };
  }
  
  if (state) {
    query['carrierDetails.address.state'] = { $regex: state, $options: 'i' };
  }
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { 'carrierDetails.companyName': { $regex: search, $options: 'i' } },
      { 'carrierDetails.businessLicense': { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (page - 1) * limit;
  
  const [carriers, total] = await Promise.all([
    User.find(query)
      .select(DIRECTORY_FIELDS.carrier.join(' '))
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    User.countDocuments(query)
  ]);

  const sanitizedCarriers = carriers.map(c => sanitizeUser(c, 'carrier'));

  res.status(200).json({
    success: true,
    data: {
      carriers: sanitizedCarriers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

exports.getShippers = asyncHandler(async (req, res, next) => {
  const { 
    page = 1, 
    limit = 20, 
    search,
    status,
    city,
    state
  } = req.query;

  const query = { role: USER_ROLES.SHIPPER };
  
  if (status === 'active') {
    query.isActive = true;
  } else if (status === 'inactive') {
    query.isActive = false;
  }
  
  if (city) {
    query['companyDetails.address.city'] = { $regex: city, $options: 'i' };
  }
  
  if (state) {
    query['companyDetails.address.state'] = { $regex: state, $options: 'i' };
  }
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { 'companyDetails.companyName': { $regex: search, $options: 'i' } },
      { 'companyDetails.gstNumber': { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (page - 1) * limit;
  
  const [shippers, total] = await Promise.all([
    User.find(query)
      .select(DIRECTORY_FIELDS.shipper.join(' '))
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    User.countDocuments(query)
  ]);

  const sanitizedShippers = shippers.map(s => sanitizeUser(s, 'shipper'));

  res.status(200).json({
    success: true,
    data: {
      shippers: sanitizedShippers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

exports.getCarrierProfile = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const carrier = await User.findOne({ 
    _id: id, 
    role: USER_ROLES.CARRIER 
  });

  if (!carrier) {
    return next(new AppError('Carrier not found', 404));
  }

  res.status(200).json({
    success: true,
    data: {
      carrier: sanitizeUser(carrier, 'carrier')
    }
  });
});

exports.getShipperProfile = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const shipper = await User.findOne({ 
    _id: id, 
    role: USER_ROLES.SHIPPER 
  });

  if (!shipper) {
    return next(new AppError('Shipper not found', 404));
  }

  res.status(200).json({
    success: true,
    data: {
      shipper: sanitizeUser(shipper, 'shipper')
    }
  });
});