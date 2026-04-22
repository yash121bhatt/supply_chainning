// Socket.io event handlers for the Supply Chain platform
// This module is loaded in server.js with `require('./socketHandlers')(io)`
// It registers connection listeners and provides helper functions to emit
// real‑time events related to shipments.

module.exports = (io) => {
  // When a client connects
  io.on('connection', (socket) => {
    console.log(`✅ Socket connected: ${socket.id}`);

    // Join rooms based on user role or user ID for targeted notifications
    socket.on('joinRoom', (room) => {
      socket.join(room);
      console.log(`🔊 Socket ${socket.id} joined room ${room}`);
    });

    // Join user's personal notification room
    socket.on('joinUserRoom', (userId) => {
      socket.join(`user_${userId}`);
      console.log(`🔊 Socket ${socket.id} joined user room ${userId}`);
    });

    // Handle typing indicator for chat
    socket.on('typing', ({ chatId, userId }) => {
      socket.to(`chat_${chatId}`).emit('userTyping', { userId });
    });

    // Handle stop typing
    socket.on('stopTyping', ({ chatId }) => {
      socket.to(`chat_${chatId}`).emit('userStoppedTyping');
    });

    // Handle chat message
    socket.on('sendMessage', ({ chatId, message }) => {
      socket.to(`chat_${chatId}`).emit('newMessage', message);
    });

    // Handle client disconnect
    socket.on('disconnect', () => {
      console.log(`❌ Socket disconnected: ${socket.id}`);
    });
  });

  // Helper to emit a shipment status change
  const emitShipmentStatus = (shipment) => {
    const rooms = [];
    if (shipment.shipper) rooms.push(`user_${shipment.shipper}`);
    if (shipment.carrier) rooms.push(`user_${shipment.carrier}`);
    if (shipment.driver) rooms.push(`user_${shipment.driver}`);
    rooms.forEach((room) => {
      io.to(room).emit('shipmentStatusChanged', {
        shipmentId: shipment._id,
        status: shipment.status,
        updatedAt: new Date()
      });
    });
  };

  // Helper to emit location updates
  const emitLocationUpdate = (shipment) => {
    const rooms = [];
    if (shipment.shipper) rooms.push(`user_${shipment.shipper}`);
    if (shipment.carrier) rooms.push(`user_${shipment.carrier}`);
    if (shipment.driver) rooms.push(`user_${shipment.driver}`);
    rooms.forEach((room) => {
      io.to(room).emit('shipmentLocationUpdated', {
        shipmentId: shipment._id,
        location: shipment.currentLocation,
        updatedAt: new Date()
      });
    });
  };

  // Helper to broadcast a newly created shipment to carriers
  const broadcastNewShipment = (shipment) => {
    io.to('carriers').emit('newShipmentAvailable', {
      shipmentId: shipment._id,
      pickupLocation: shipment.pickupLocation,
      deliveryLocation: shipment.deliveryLocation,
      shipmentNumber: shipment.shipmentNumber,
      pricing: shipment.pricing,
      createdAt: new Date()
    });
  };

  // Helper to emit new bid notification
  const emitNewBid = (bid, shipperId) => {
    io.to(`user_${shipperId}`).emit('newBidReceived', {
      bidId: bid._id,
      shipmentId: bid.shipment,
      amount: bid.amount,
      carrierName: bid.carrier?.name,
      createdAt: new Date()
    });
  };

  // Helper to emit bid status update
  const emitBidUpdate = (bid, userId) => {
    io.to(`user_${userId}`).emit('bidStatusUpdated', {
      bidId: bid._id,
      status: bid.status,
      amount: bid.amount,
      updatedAt: new Date()
    });
  };

  // Helper to emit payment notification
  const emitPaymentNotification = (userId, paymentData) => {
    io.to(`user_${userId}`).emit('paymentNotification', {
      ...paymentData,
      updatedAt: new Date()
    });
  };

  // Helper to emit new notification
  const emitNotification = (userId, notification) => {
    io.to(`user_${userId}`).emit('newNotification', {
      ...notification,
      createdAt: new Date()
    });
  };

  // Expose helpers for controllers to call
  return {
    emitShipmentStatus,
    emitLocationUpdate,
    broadcastNewShipment,
    emitNewBid,
    emitBidUpdate,
    emitPaymentNotification,
    emitNotification
  };
};
