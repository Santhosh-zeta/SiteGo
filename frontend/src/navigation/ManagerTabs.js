import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ManagerDashboardScreen from '../screens/manager/ManagerDashboardScreen';
import ManagerTimelineScreen from '../screens/manager/ManagerTimelineScreen';
import ManagerInventoryScreen from '../screens/manager/ManagerInventoryScreen';
import ManagerDocumentsScreen from '../screens/manager/ManagerDocumentsScreen';

const Tab = createBottomTabNavigator();

const ManagerTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarIcon: ({ color, size }) => {
        let name = 'view-dashboard-outline';
        if (route.name === 'Timeline') name = 'timeline-text-outline';
        if (route.name === 'Inventory') name = 'warehouse';
        if (route.name === 'Documents') name = 'file-document-outline';
        return <Icon name={name} color={color} size={size} />;
      },
    })}
  >
    <Tab.Screen name="Dashboard" component={ManagerDashboardScreen} />
    <Tab.Screen name="Timeline" component={ManagerTimelineScreen} />
    <Tab.Screen name="Inventory" component={ManagerInventoryScreen} />
    <Tab.Screen name="Documents" component={ManagerDocumentsScreen} />
  </Tab.Navigator>
);

export default ManagerTabs;
