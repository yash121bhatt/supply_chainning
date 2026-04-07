import axios from 'axios';
import useAuthStore from '../context/AuthContext.jsx';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response) {
      // Handle specific error codes
      if (error.response.status === 401) {
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }

      return Promise.reject({
        message: error.response.data?.message || 'An error occurred',
        status: error.response.status,
        data: error.response.data
      });
    }

    if (error.request) {
      return Promise.reject({
        message: 'No response from server',
        status: 0
      });
    }

    return Promise.reject({
      message: error.message || 'An error occurred',
      status: 0
    });
  }
);

export default api;