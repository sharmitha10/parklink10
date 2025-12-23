import axios from 'axios';
import { getAuthToken } from './auth';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 10000, // 10 second timeout
});

// Single request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with a status code outside 2xx
      console.error('API Error:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
    } else if (error.request) {
      // Request was made but no response received
      console.error('No response received:', error.request);
    } else {
      // Error in request setup
      console.error('Request setup error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Parking API
export const parkingAPI = {
  getAll: (params) => api.get('/parking', { params }),
  getById: (id) => api.get(`/parking/${id}`),
  create: (data) => api.post('/parking', data),
  update: (id, data) => api.put(`/parking/${id}`, data),
  delete: (id) => api.delete(`/parking/${id}`),
  getMySlots: () => api.get('/parking/my/slots'),
};

// Booking API
export const bookingAPI = {
  create: (data) => api.post('/bookings', data),
  getMyBookings: () => api.get('/bookings/my'),
  getById: (id) => api.get(`/bookings/${id}`),
  cancel: (id) => api.put(`/bookings/${id}/cancel`),
  complete: (id) => api.put(`/bookings/${id}/complete`),
  getAnalytics: (params = {}) => api.get('/bookings/analytics', { params }),
};

// Admin API
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: () => api.get('/admin/users'),
  getBookings: () => api.get('/admin/bookings'),
  getSlotBookings: (slotId) => api.get(`/admin/slots/${slotId}/bookings`),
};

// User API
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
};

export default api;