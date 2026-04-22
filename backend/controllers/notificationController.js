const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/errorHandler').AppError;
const Notification = require('../models/Notification');

exports.getNotifications = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const { page = 1, limit = 20, unreadOnly } = req.query;

  const query = { recipient: userId };
  if (unreadOnly === 'true') {
    query.isRead = false;
  }

  const notifications = await Notification.find(query)
    .populate('sender', 'name avatar')
    .populate('shipment', 'shipmentNumber')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Notification.countDocuments(query);
  const unreadCount = await Notification.countDocuments({ recipient: userId, isRead: false });

  res.status(200).json({
    success: true,
    data: {
      notifications,
      unreadCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

exports.markAsRead = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user._id;

  const notification = await Notification.findOne({ _id: id, recipient: userId });
  if (!notification) {
    return next(new AppError('Notification not found', 404));
  }

  notification.isRead = true;
  notification.readAt = new Date();
  await notification.save();

  res.status(200).json({
    success: true,
    message: 'Notification marked as read',
    data: { notification }
  });
});

exports.markAllAsRead = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;

  await Notification.updateMany(
    { recipient: userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );

  res.status(200).json({
    success: true,
    message: 'All notifications marked as read'
  });
});

exports.deleteNotification = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user._id;

  const notification = await Notification.findOneAndDelete({ _id: id, recipient: userId });
  if (!notification) {
    return next(new AppError('Notification not found', 404));
  }

  res.status(200).json({
    success: true,
    message: 'Notification deleted'
  });
});

exports.deleteAllNotifications = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;

  await Notification.deleteMany({ recipient: userId });

  res.status(200).json({
    success: true,
    message: 'All notifications deleted'
  });
});

exports.getUnreadCount = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;

  const count = await Notification.countDocuments({ recipient: userId, isRead: false });

  res.status(200).json({
    success: true,
    data: { unreadCount: count }
  });
});
