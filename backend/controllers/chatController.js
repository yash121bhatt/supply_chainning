const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/errorHandler').AppError;
const Chat = require('../models/Chat');
const Shipment = require('../models/Shipment');
const Notification = require('../models/Notification');

exports.getOrCreateChat = asyncHandler(async (req, res, next) => {
  const { shipmentId } = req.body;
  const userId = req.user._id;
  const userRole = req.user.role;

  const shipment = await Shipment.findById(shipmentId);
  if (!shipment) {
    return next(new AppError('Shipment not found', 404));
  }

  const isAuthorized = [
    shipment.shipper?.toString(),
    shipment.carrier?.toString(),
    shipment.driver?.toString()
  ].includes(userId.toString());

  if (!isAuthorized && userRole !== 'admin') {
    return next(new AppError('You are not authorized to access this chat', 403));
  }

  let chat = await Chat.findOne({ shipment: shipmentId, isActive: true })
    .populate('participants.user', 'name email avatar role');

  if (!chat) {
    const participants = [{ user: shipment.shipper, role: 'shipper' }];
    if (shipment.carrier) participants.push({ user: shipment.carrier, role: 'carrier' });
    if (shipment.driver) participants.push({ user: shipment.driver, role: 'driver' });

    chat = new Chat({
      shipment: shipmentId,
      participants
    });
    await chat.save();
    await chat.populate('participants.user', 'name email avatar role');
  }

  res.status(200).json({
    success: true,
    data: { chat }
  });
});

exports.getMessages = asyncHandler(async (req, res, next) => {
  const { chatId } = req.params;
  const { page = 1, limit = 50 } = req.query;
  const userId = req.user._id;

  const chat = await Chat.findById(chatId);
  if (!chat) {
    return next(new AppError('Chat not found', 404));
  }

  const isParticipant = chat.participants.some(p => p.user.toString() === userId.toString());
  if (!isParticipant && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to view this chat', 403));
  }

  const messages = chat.messages
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice((page - 1) * limit, page * limit);

  const total = chat.messages.length;

  res.status(200).json({
    success: true,
    data: {
      messages: messages.reverse(),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

exports.sendMessage = asyncHandler(async (req, res, next) => {
  const { chatId } = req.params;
  const { message, messageType = 'text', attachmentUrl } = req.body;
  const userId = req.user._id;

  const chat = await Chat.findById(chatId);
  if (!chat) {
    return next(new AppError('Chat not found', 404));
  }

  const participant = chat.participants.find(p => p.user.toString() === userId.toString());
  if (!participant && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to send messages in this chat', 403));
  }

  const newMessage = {
    sender: userId,
    message,
    messageType,
    attachmentUrl,
    readBy: [{ user: userId, readAt: new Date() }]
  };

  chat.messages.push(newMessage);
  chat.lastMessage = {
    message: messageType === 'text' ? message : `[${messageType}]`,
    sender: userId,
    createdAt: new Date()
  };
  await chat.save();

  const savedMessage = chat.messages[chat.messages.length - 1];

  const recipientIds = chat.participants
    .filter(p => p.user.toString() !== userId.toString())
    .map(p => p.user);

  if (recipientIds.length > 0) {
    await Notification.create({
      recipient: recipientIds[0],
      type: 'chat_message',
      title: 'New Message',
      message: `You have a new message in shipment chat`,
      shipment: chat.shipment,
      data: { chatId: chat._id }
    });
  }

  res.status(201).json({
    success: true,
    message: 'Message sent',
    data: { message: savedMessage }
  });
});

exports.markAsRead = asyncHandler(async (req, res, next) => {
  const { chatId } = req.params;
  const userId = req.user._id;

  const chat = await Chat.findById(chatId);
  if (!chat) {
    return next(new AppError('Chat not found', 404));
  }

  const participant = chat.participants.find(p => p.user.toString() === userId.toString());
  if (!participant) {
    return next(new AppError('You are not a participant in this chat', 403));
  }

  chat.messages.forEach(msg => {
    if (!msg.readBy.some(rb => rb.user.toString() === userId.toString())) {
      msg.readBy.push({ user: userId, readAt: new Date() });
    }
  });

  participant.readAt = new Date();
  await chat.save();

  res.status(200).json({
    success: true,
    message: 'Messages marked as read'
  });
});

exports.getMyChats = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;

  const chats = await Chat.find({
    'participants.user': userId,
    isActive: true
  })
    .populate('shipment', 'shipmentNumber status')
    .populate('participants.user', 'name avatar role')
    .sort({ updatedAt: -1 });

  res.status(200).json({
    success: true,
    data: { chats }
  });
});
