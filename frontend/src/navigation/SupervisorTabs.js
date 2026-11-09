// src/navigation/SupervisorTabs.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import SupervisorDashboardScreen from '../screens/supervisor/SupervisorDashboardScreen';
import SupervisorMaterialsScreen from '../screens/supervisor/SupervisorMaterialsScreen';
import SupervisorIssuesScreen from '../screens/supervisor/SupervisorIssuesScreen';
import SupervisorReportsScreen from '../screens/supervisor/SupervisorReportsScreen';

const Tab = createBottomTabNavigator();

const SupervisorTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarIcon: ({ color, size }) => {
        let name = 'view-dashboard-outline';
        if (route.name === 'Materials') name = 'cube-scan';
        if (route.name === 'Issues') name = 'alert-circle-outline';
        if (route.name === 'Reports') name = 'file-chart-outline';
        return <Icon name={name} color={color} size={size} />;
      },
    })}
  >
    <Tab.Screen name="Dashboard" component={SupervisorDashboardScreen} />
    <Tab.Screen name="Materials" component={SupervisorMaterialsScreen} />
    <Tab.Screen name="Issues" component={SupervisorIssuesScreen} />
    <Tab.Screen name="Reports" component={SupervisorReportsScreen} />
  </Tab.Navigator>
);

export default SupervisorTabs;
