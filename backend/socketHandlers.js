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

    // Handle client disconnect
    socket.on('disconnect', () => {
      console.log(`❌ Socket disconnected: ${socket.id}`);
    });
  });

  // Helper to emit a shipment status change
  const emitShipmentStatus = (shipment) => {
    // Emit to the shipper, carrier and driver rooms if they exist
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

  // Helper to emit location updates (driver only)
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

  // Helper to broadcast a newly created shipment to carriers looking for work
  const broadcastNewShipment = (shipment) => {
    // All carriers listen to this generic room
    io.to('carriers').emit('newShipmentAvailable', {
      shipmentId: shipment._id,
      pickupLocation: shipment.pickupLocation,
      deliveryLocation: shipment.deliveryLocation,
      shipmentNumber: shipment.shipmentNumber,
      createdAt: new Date()
    });
  };

  // Expose helpers for controllers to call
  return {
    emitShipmentStatus,
    emitLocationUpdate,
    broadcastNewShipment
  };
};
