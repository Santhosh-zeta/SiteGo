import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AdminTabs from './AdminTabs';
import SiteMapScreen from '../screens/admin/SiteMapScreen';

const Stack = createNativeStackNavigator();

const AppStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="AdminTabs" component={AdminTabs} />
    <Stack.Screen name="SiteMap" component={SiteMapScreen} />
  </Stack.Navigator>
);

export default AppStack;
