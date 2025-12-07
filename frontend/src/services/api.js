import axios from 'axios';
import { API_CONFIG, ENDPOINTS } from '../constants/config';
import { getAccessToken } from '../utils/storage';

// Axios instance
const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('📤 API:', config.method.toUpperCase(), config.url);
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => {
    console.log('✅ API OK:', response.status);
    return response;
  },
  async (error) => {
    console.error('❌ API Error:', error.response?.status);
    
    // Handle 401 - token expired
    if (error.response?.status === 401) {
      // TODO: Implement refresh token logic
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  googleLogin: (token) => api.post(ENDPOINTS.AUTH.GOOGLE_LOGIN, { token }),
  getCurrentUser: () => api.get(ENDPOINTS.AUTH.ME),
  logout: () => api.post(ENDPOINTS.AUTH.LOGOUT),
};

// Sites API
export const sitesAPI = {
  getMySites: () => api.get(ENDPOINTS.SITES.MY_SITES),
  getAllSites: () => api.get(ENDPOINTS.SITES.ALL_SITES),
};

// Attendance API
export const attendanceAPI = {
  checkIn: (data) => api.post(ENDPOINTS.ATTENDANCE.CHECK_IN, data),
  checkOut: (data) => api.post(ENDPOINTS.ATTENDANCE.CHECK_OUT, data),
  getToday: () => api.get(ENDPOINTS.ATTENDANCE.TODAY),
};

// Materials API
export const materialsAPI = {
  scanMaterial: (data) => api.post(ENDPOINTS.MATERIALS.SCAN, data),
};

// Reports API
export const reportsAPI = {
  createReport: (data) => api.post(ENDPOINTS.REPORTS.CREATE, data),
  getMyReports: () => api.get(ENDPOINTS.REPORTS.MY_REPORTS),
};

// Issues API
export const issuesAPI = {
  createIssue: (data) => api.post(ENDPOINTS.ISSUES.CREATE, data),
};

export default api;
