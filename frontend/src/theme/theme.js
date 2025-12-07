import { MD3LightTheme } from 'react-native-paper';

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#3b82f6',
    onPrimary: '#ffffff',
    primaryContainer: '#dbeafe',
    secondary: '#64748b',
    onSecondary: '#ffffff',
    tertiary: '#10b981',
    error: '#ef4444',
    background: '#f9fafb',
    surface: '#ffffff',
    surfaceVariant: '#f8fafc',
    outline: '#d1d5db',
    outlineVariant: '#e2e8f0',
  },
  roundness: 12,
};

export default theme;
