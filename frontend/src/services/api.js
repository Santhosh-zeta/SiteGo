import axios from 'axios';

const BASE_URL = 'http://10.117.17.176:5000/api';

const STORAGE_KEYS = {
  access: 'sitego_access_token',
  refresh: 'sitego_refresh_token',
};

const api = axios.create({
  baseURL: BASE_URL,
});

// Attach access token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(STORAGE_KEYS.access);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 → try refresh
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

    const refreshToken = localStorage.getItem(STORAGE_KEYS.refresh);
    if (!refreshToken) {
      return Promise.reject(new Error('No refresh token'));
    }

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
      localStorage.setItem(STORAGE_KEYS.access, newAccess);
      processQueue(null, newAccess);
      original.headers.Authorization = `Bearer ${newAccess}`;
      return api(original);
    } catch (err) {
      processQueue(err, null);
      localStorage.removeItem(STORAGE_KEYS.access);
      localStorage.removeItem(STORAGE_KEYS.refresh);
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  }
);

// exported API “services”
export const authAPI = {
  googleLogin: (idToken) =>
    api.post('/auth/google', { token: idToken }),
};

export const materialsAPI = {
  scan: (payload) => api.post('/materials/scan', payload),
  getLogs: (siteId, params = {}) =>
    api.get(`/materials/logs/${siteId}`, { params }),
};

export const issuesAPI = {
  getMy: (role) => api.get('/issues/my', { params: { role } }),
};
// src/services/api.js (add this)
// src/services/api.js

// ... existing imports and axios setup ...

export const workerAPI = {
  getTodayAttendance: () => api.get('/attendance/today'),
  checkIn: (siteId, location) =>
    api.post('/attendance/check-in', { siteId, location }),
  checkOut: (location) =>
    api.post('/attendance/check-out', { location }),
};

// keep existing exports here
// src/services/api.js

export const adminAPI = {
  getUsers: () => api.get('/admin/users'),          // adjust to your real route
  getSites: () => api.get('/sites'),                // adjust if different
  getMaterials: () => api.get('/materials/master'), // you already have this controller
  getOverview: () => api.get('/admin/overview'),    // optional, for dashboard
};


export default api;

