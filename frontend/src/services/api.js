// src/services/api.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://10.117.17.176:5000/api';

const STORAGE_KEYS = {
  access: 'sitego_access_token',
  refresh: 'sitego_refresh_token',
};

const api = axios.create({ baseURL: BASE_URL });

// attach access token from AsyncStorage
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem(STORAGE_KEYS.access);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 401 → try refresh
let isRefreshing = false;
let pending = [];

const processQueue = (error, token = null) => {
  pending.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  pending = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.refresh);
    if (!refreshToken) return Promise.reject(new Error('No refresh token'));

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pending.push({ resolve, reject });
      }).then((newToken) => {
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const res = await axios.post(`${BASE_URL}/auth/refresh`, {
        refreshToken,
      });
      const newAccess = res.data.data.accessToken;
      await AsyncStorage.setItem(STORAGE_KEYS.access, newAccess);
      processQueue(null, newAccess);
      original.headers.Authorization = `Bearer ${newAccess}`;
      return api(original);
    } catch (err) {
      processQueue(err, null);
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.access,
        STORAGE_KEYS.refresh,
      ]);
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  }
);

// APIs

export const authAPI = {
  googleLogin: (idToken) => api.post('/auth/google', { token: idToken }),
};

export const materialsAPI = {
  scan: (payload) => api.post('/materials/scan', payload),
  getLogs: (siteId, params = {}) =>
    api.get(`/materials/logs/${siteId}`, { params }),
};

export const issuesAPI = {
  getMy: (role) => api.get('/issues/my', { params: { role } }),
};

export const workerAPI = {
  getTodayAttendance: () => api.get('/attendance/today'),
  checkIn: (siteId, location) =>
    api.post('/attendance/check-in', { siteId, location }),
  checkOut: (location) => api.post('/attendance/check-out', { location }),
};

// add to adminAPI in src/services/api.js

export const adminAPI = {
  // existing
  getSites: () => api.get('/sites'),
  createSite: (body) => api.post('/sites', body),
  getMaterials: () => api.get('/materials/master'),
  createMaterial: (body) => api.post('/materials/master', body),

  // NEW: users
  getUsers: () => api.get('/users'),
  createUser: (body) => api.post('/users', body),
  updateUser: (id, body) => api.put(`/users/${id}`, body),
  updateUserRole: (id, role) => api.put(`/users/${id}/role`, { role }),
  updateUserStatus: (id, status) => api.put(`/users/${id}/status`, { status }),
  deleteUser: (id) => api.delete(`/users/${id}`),
};

export default api;
