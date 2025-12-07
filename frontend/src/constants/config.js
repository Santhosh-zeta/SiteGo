export const COLORS = {
  primary: '#3b82f6',
  secondary: '#64748b',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  background: '#f9fafb',
  surface: '#ffffff',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#111827',
};

export const API_CONFIG = {
  BASE_URL: 'http://10.0.2.2:5000/api', // Android emulator
  TIMEOUT: 30000,
};

export const ENDPOINTS = {
  AUTH: {
    GOOGLE_LOGIN: '/auth/google',
    ME: '/auth/me',
    LOGOUT: '/auth/logout',
  },
  SITES: {
    MY_SITES: '/sites/my',
    ALL_SITES: '/sites',
  },
  ATTENDANCE: {
    CHECK_IN: '/attendance/check-in',
    CHECK_OUT: '/attendance/check-out',
    TODAY: '/attendance/today',
  },
  MATERIALS: {
    SCAN: '/materials/scan',
  },
  REPORTS: {
    CREATE: '/reports/daily',
    MY_REPORTS: '/reports/my',
  },
  ISSUES: {
    CREATE: '/issues',
  },
};

export default {
  COLORS,
  API_CONFIG,
  ENDPOINTS,
};
