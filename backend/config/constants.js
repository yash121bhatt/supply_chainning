// User roles
const USER_ROLES = {
  ADMIN: 'admin',
  SHIPPER: 'shipper',
  CARRIER: 'carrier',
  DRIVER: 'driver'
};

// Shipment statuses
const SHIPMENT_STATUS = {
  PENDING: 'pending',
  ASSIGNED: 'assigned',
  PICKED_UP: 'picked_up',
  IN_TRANSIT: 'in_transit',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
};

// Shipment types
const SHIPMENT_TYPES = {
  FULL_TRUCKLOAD: 'full_truckload',
  LESS_THAN_TRUCKLOAD: 'less_than_truckload',
  PARTIAL_TRUCKLOAD: 'partial_truckload',
  CONTAINER: 'container'
};

// Vehicle types
const VEHICLE_TYPES = {
  TRUCK: 'truck',
  TRAILER: 'trailer',
  VAN: 'van',
  CONTAINER_TRUCK: 'container_truck',
  PICKUP: 'pickup'
};

// Document types
const DOCUMENT_TYPES = {
  ID_PROOF: 'id_proof',
  DRIVING_LICENSE: 'driving_license',
  VEHICLE_REGISTRATION: 'vehicle_registration',
  INSURANCE: 'insurance',
  TAX_CLEARANCE: 'tax_clearance',
  OTHER: 'other'
};

// Payment statuses
const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded'
};

// Notification types
const NOTIFICATION_TYPES = {
  SHIPMENT_ASSIGNED: 'shipment_assigned',
  SHIPMENT_PICKED_UP: 'shipment_picked_up',
  SHIPMENT_DELIVERED: 'shipment_delivered',
  PAYMENT_RECEIVED: 'payment_received',
  NEW_BID: 'new_bid',
  SYSTEM: 'system'
};

module.exports = {
  USER_ROLES,
  SHIPMENT_STATUS,
  SHIPMENT_TYPES,
  VEHICLE_TYPES,
  DOCUMENT_TYPES,
  PAYMENT_STATUS,
  NOTIFICATION_TYPES
};