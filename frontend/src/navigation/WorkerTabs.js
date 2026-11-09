import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import WorkerHomeScreen from '../screens/worker/WorkerHomeScreen';
import WorkerAttendanceScreen from '../screens/worker/WorkerAttendanceScreen';
import WorkerTasksScreen from '../screens/worker/WorkerTasksScreen';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const Tab = createBottomTabNavigator();

const WorkerTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarIcon: ({ color, size }) => {
        let name = 'home';
        if (route.name === 'Attendance') name = 'map-marker-check';
        if (route.name === 'Tasks') name = 'clipboard-check-outline';
        return <Icon name={name} color={color} size={size} />;
      },
    })}
  >
    <Tab.Screen name="Home" component={WorkerHomeScreen} />
    <Tab.Screen name="Attendance" component={WorkerAttendanceScreen} />
    <Tab.Screen name="Tasks" component={WorkerTasksScreen} />
  </Tab.Navigator>
);

export default WorkerTabs;
