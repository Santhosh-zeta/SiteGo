import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminUsersScreen from '../screens/admin/AdminUsersScreen';
import AdminSitesScreen from '../screens/admin/AdminSitesScreen';
import AdminMaterialsScreen from '../screens/admin/AdminMaterialsScreen';

const Tab = createBottomTabNavigator();

const AdminTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarIcon: ({ color, size }) => {
        let name = 'view-dashboard-outline';
        if (route.name === 'Users') name = 'account-group-outline';
        if (route.name === 'Sites') name = 'map-marker-radius-outline';
        if (route.name === 'Materials') name = 'cube-outline';
        return <Icon name={name} color={color} size={size} />;
      },
    })}
  >
    <Tab.Screen name="Dashboard" component={AdminDashboardScreen} />
    <Tab.Screen name="Users" component={AdminUsersScreen} />
    <Tab.Screen name="Sites" component={AdminSitesScreen} />
    <Tab.Screen name="Materials" component={AdminMaterialsScreen} />
  </Tab.Navigator>
);

export default AdminTabs;
