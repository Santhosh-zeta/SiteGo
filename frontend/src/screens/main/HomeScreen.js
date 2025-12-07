import React from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { Card, Text, Avatar, Button, Divider, useTheme } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { clearAuth } from '../../redux/slices/authSlice';

export default function HomeScreen() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const theme = useTheme();

  const quickActions = [
    { id: 'attendance', title: 'Check In', icon: 'map-marker-check', color: '#10b981' },
    { id: 'materials', title: 'Scan Material', icon: 'barcode-scan', color: '#3b82f6' },
    { id: 'reports', title: 'Daily Report', icon: 'file-document-edit-outline', color: '#f59e0b' },
    { id: 'issues', title: 'Report Issue', icon: 'alert-circle-outline', color: '#ef4444' },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ padding: 24, paddingTop: 40 }}>
        
        {/* Header Card */}
        <Card style={{ marginBottom: 24, elevation: 4 }}>
          <Card.Title
            titleVariant="headlineMedium"
            title={`Welcome back, ${user?.name?.split(' ')[0] || 'User'}`}
            subtitle="Manage your construction sites"
            left={(props) => (
              <Avatar.Image 
                {...props} 
                size={48}
                source={{ uri: user?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150' }}
              />
            )}
            right={(props) => (
              <Button 
                mode="text" 
                {...props}
                onPress={() => dispatch(clearAuth())}
                style={{ marginRight: 8 }}
              >
                Logout
              </Button>
            )}
          />
        </Card>

        {/* Stats Cards */}
        <View style={{ flexDirection: 'row', marginBottom: 24 }}>
          <Card style={{ flex: 1, marginRight: 12, elevation: 2 }}>
            <Card.Content>
              <Text variant="labelLarge" style={{ color: theme.colors.outline, marginBottom: 4 }}>
                Today
              </Text>
              <Text variant="headlineMedium">8h 30m</Text>
              <Text variant="bodySmall" style={{ color: theme.colors.outline }}>
                Working time
              </Text>
            </Card.Content>
          </Card>
          
          <Card style={{ flex: 1, marginLeft: 12, elevation: 2 }}>
            <Card.Content>
              <Text variant="labelLarge" style={{ color: theme.colors.outline, marginBottom: 4 }}>
                Active Sites
              </Text>
              <Text variant="headlineMedium">3</Text>
              <Text variant="bodySmall" style={{ color: theme.colors.outline }}>
                Assigned sites
              </Text>
            </Card.Content>
          </Card>
        </View>

        {/* Quick Actions */}
        <Text variant="titleLarge" style={{ marginBottom: 16, fontWeight: 'bold' }}>
          Quick Actions
        </Text>
        
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={{ width: '48%', marginRight: '4%', marginBottom: 16 }}
            >
              <Card 
                style={{ 
                  backgroundColor: action.color + '20',
                  borderWidth: 1,
                  borderColor: action.color + '30'
                }}
              >
                <Card.Content style={{ alignItems: 'center', paddingVertical: 20 }}>
                  <Avatar.Icon 
                    size={56} 
                    icon={action.icon}
                    style={{ backgroundColor: action.color }}
                  />
                  <Text variant="titleMedium" style={{ marginTop: 8 }}>
                    {action.title}
                  </Text>
                </Card.Content>
              </Card>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Activity */}
        <Text variant="titleLarge" style={{ marginBottom: 16, marginTop: 24, fontWeight: 'bold' }}>
          Recent Activity
        </Text>
        
        <Card style={{ elevation: 2 }}>
          <Card.Content>
            <Text variant="bodyMedium" style={{ color: theme.colors.outline }}>
              No recent activity yet.
            </Text>
          </Card.Content>
        </Card>
      </View>
    </ScrollView>
  );
}
