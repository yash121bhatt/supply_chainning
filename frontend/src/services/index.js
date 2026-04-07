import api from './api';

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  uploadAvatar: (formData) => {
    return api.post('/auth/upload-avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  verifyEmail: (data) => api.post('/auth/verify-email', data)
};

// Users API (Admin)
export const usersAPI = {
  getAll: (params) => api.get(`/users`, { params }),
  getStats: () => api.get('/users/stats'),
  getById: (id) => api.get(`/users/${id}`),
  verify: (id, data) => api.put(`/users/${id}/verify`, data),
  updateStatus: (id, data) => api.put(`/users/${id}/status`, data),
  deleteAccount: (id) => api.delete(`/users/${id}`)
};

// Shipment API
export const shipmentAPI = {
  create: (data) => api.post('/shipments', data),
  getMyShipments: (params) => api.get('/shipments/my-shipments', { params }),
  getById: (id) => api.get(`/shipments/${id}`),
  getAvailable: (params) => api.get('/shipments/available/list', { params }),
  accept: (id, data) => api.put(`/shipments/${id}/accept`, data),
  reject: (id, data) => api.put(`/shipments/${id}/reject`, data),
  assignDriver: (id, data) => api.put(`/shipments/${id}/assign-driver`, data),
  update: (id, data) => api.put(`/shipments/${id}`, data),
  updateStatus: (id, data) => api.put(`/shipments/${id}/status`, data),
  updateLocation: (id, data) => api.put(`/shipments/${id}/location`, data),
  uploadPOD: (id, data) => api.post(`/shipments/${id}/pod`, data),
  cancel: (id) => api.delete(`/shipments/${id}`),
  track: (id) => api.get(`/shipments/${id}/tracking`)
};

// Carrier API
export const carrierAPI = {
  getVehicles: (params) => api.get('/carriers/vehicles', { params }),
  addVehicle: (data) => api.post('/carriers/vehicles', data),
  updateVehicle: (id, data) => api.put(`/carriers/vehicles/${id}`, data),
  deleteVehicle: (id) => api.delete(`/carriers/vehicles/${id}`),
  getDashboard: () => api.get('/carriers/dashboard'),
  getEarnings: (params) => api.get('/carriers/earnings', { params }),
  getDrivers: (params) => api.get('/carriers/drivers', { params }),
  inviteDriver: (data) => api.post('/carriers/drivers/invite', data)
};

// Driver API
export const driverAPI = {
  getDashboard: () => api.get('/drivers/dashboard'),
  getActiveShipments: () => api.get('/drivers/active-shipments'),
  getProfile: () => api.get('/drivers/profile'),
  updateProfile: (data) => api.put('/drivers/profile', data),
  getEarnings: (params) => api.get('/drivers/earnings', { params }),
  getShipmentEarnings: (shipmentId) => api.get(`/drivers/earnings/${shipmentId}`),
  updateAvailability: (data) => api.put('/drivers/availability', data)
};

// Chat API
export const chatAPI = {
  getByShipment: (shipmentId) => api.get(`/shipments/${shipmentId}/chat`),
  sendMessage: (shipmentId, message) => api.post(`/shipments/${shipmentId}/chat`, message)
};

// Notification API (via general endpoint if available)
export const notificationAPI = {
  getMy: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.put(`/notifications/${id}/read`)
};

// Admin API
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getShipments: (params) => api.get('/admin/shipments', { params }),
  getShipmentStats: () => api.get('/admin/shipments/stats'),
  updateShipment: (id, data) => api.put(`/admin/shipments/${id}`, data),
  cancelShipment: (id, data) => api.put(`/admin/shipments/${id}/cancel`, data)
};

// Export existing user API functions admin needs
export const adminUserAPI = {
  getAll: (params) => api.get('/users', { params }),
  getStats: () => api.get('/users/stats'),
  updateStatus: (id, data) => api.put(`/users/${id}/status`, data),
  verify: (id, data) => api.put(`/users/${id}/verify`, data),
  deleteUser: (id) => api.delete(`/users/${id}`)
};

export default api;