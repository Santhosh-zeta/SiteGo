// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import AuthNavigator from './src/navigation/AuthNavigator';
import WorkerTabs from './src/navigation/WorkerTabs';
import SupervisorTabs from './src/navigation/SupervisorTabs';
import ManagerTabs from './src/navigation/ManagerTabs';
import AdminTabs from './src/navigation/AdminTabs';

const RootNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) return null; // later: splash / loader

  if (!user) {
    return (
      <NavigationContainer>
        <AuthNavigator />
      </NavigationContainer>
    );
  }

  let AppTabs = WorkerTabs;
  if (user.role === 'worker') AppTabs = WorkerTabs;
  if (user.role === 'supervisor') AppTabs = SupervisorTabs;
  if (user.role === 'manager') AppTabs = ManagerTabs;
  if (user.role === 'admin') AppTabs = AdminTabs;

  return (
    <NavigationContainer>
      <AppTabs />
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <PaperProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </PaperProvider>
  );
}
