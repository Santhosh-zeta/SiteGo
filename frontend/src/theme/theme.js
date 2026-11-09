// theme/theme.js - Material Design Theme for SiteGo
import { MD3LightTheme as DefaultTheme } from 'react-native-paper';

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    // SiteGo Primary Brand Colors
    primary: '#2563eb',     // Construction Blue
    onPrimary: '#ffffff',
    primaryContainer: '#d9e3fd',
    onPrimaryContainer: '#001b3e',
    
    // SiteGo Secondary Colors
    secondary: '#6b7280',   // Steel Gray
    onSecondary: '#ffffff',
    secondaryContainer: '#e5e7eb',
    onSecondaryContainer: '#1f2937',
    
    // Status Colors
    error: '#dc2626',       // Critical Issues
    warning: '#f59e0b',     // Medium Priority
    success: '#10b981',     // Check-in Success
    info: '#3b82f6',        // Progress
    
    // Backgrounds
    background: '#f8fafc',
    surface: '#ffffff',
    surfaceVariant: '#f1f5f9',
    onSurfaceVariant: '#64748b',
    
    // Construction Site Theme
    outline: '#94a3b8',
    outlineVariant: '#cbd5e1',
  },
  // Custom typography for construction theme
  fonts: {
    ...DefaultTheme.fonts,
    regular: {
      fontFamily: 'System',
      fontWeight: '400',
    },
    medium: {
      fontFamily: 'System',
      fontWeight: '500',
    },
    light: {
      fontFamily: 'System',
      fontWeight: '300',
    },
    thin: {
      fontFamily: 'System',
      fontWeight: '200',
    },
  },
};

// Status color helper
export const statusColors = {
  active: '#10b981',
  inactive: '#6b7280',
  pending: '#f59e0b',
  approved: '#059669',
  rejected: '#dc2626',
  open: '#ef4444',
  'in-progress': '#3b82f6',
  resolved: '#10b981',
  closed: '#6b7280',
};

// Role colors for UI elements
export const roleColors = {
  worker: '#3b82f6',
  supervisor: '#10b981',
  manager: '#f59e0b',
  admin: '#8b5cf6',
};
