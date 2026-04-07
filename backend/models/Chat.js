const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  shipment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shipment',
    required: true
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: String, // 'shipper', 'carrier', 'driver'
    readAt: { type: Date, default: null }
  }],
  messages: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: {
      type: String,
      required: true
    },
    messageType: {
      type: String,
      enum: ['text', 'image', 'document', 'location'],
      default: 'text'
    },
    attachmentUrl: String,
    isRead: {
      type: Boolean,
      default: false
    },
    readBy: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      readAt: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now }
  }],
  lastMessage: {
    message: String,
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: { type: Date, default: Date.now }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

chatSchema.index({ shipment: 1 });
chatSchema.index({ participants: 1 });
chatSchema.index({ 'messages.createdAt': -1 });

module.exports = mongoose.model('Chat', chatSchema);