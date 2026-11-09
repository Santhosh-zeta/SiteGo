import React from 'react';
import { View, ScrollView } from 'react-native';
import { Card, Text, Button, Avatar } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { clearAuth } from '../redux/slices/authSlice';

export default function HomeScreen() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const quickActions = [
    { id: 1, title: 'Check In', icon: 'map-marker' },
    { id: 2, title: 'Scan Material', icon: 'barcode-scan' },
    { id: 3, title: 'Daily Report', icon: 'file-document-edit-outline' },
    { id: 4, title: 'Report Issue', icon: 'alert-circle-outline' },
  ];

  return (
    <ScrollView
      contentContainerStyle={{
        padding: 16,
        paddingTop: 32,
        paddingBottom: 32,
        backgroundColor: '#f9fafb',
        flexGrow: 1,
      }}
    >
      {/* Header card */}
      <Card style={{ marginBottom: 16 }}>
        <Card.Title
          title={`Hi, ${user?.name || 'User'}`}
          subtitle="Welcome to SiteGo"
          left={(props) => <Avatar.Text {...props} label={user?.name?.[0] || 'U'} />}
        />
        <Card.Content>
          <Text variant="bodyMedium" style={{ marginBottom: 8 }}>
            Manage your sites, attendance, materials and reports from one place.
          </Text>
          <Button mode="outlined" onPress={() => dispatch(clearAuth())}>
            Logout
          </Button>
        </Card.Content>
      </Card>

      {/* Stats card */}
      <Card style={{ marginBottom: 16 }}>
        <Card.Content>
          <Text variant="titleMedium" style={{ marginBottom: 8 }}>
            Today’s Summary
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text variant="labelSmall">Working Hours</Text>
              <Text variant="headlineSmall">8h 30m</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text variant="labelSmall">Active Sites</Text>
              <Text variant="headlineSmall">3</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Quick actions */}
      <Text variant="titleMedium" style={{ marginBottom: 8 }}>
        Quick Actions
      </Text>
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          marginHorizontal: -4,
          marginBottom: 16,
        }}
      >
        {quickActions.map((action) => (
          <View key={action.id} style={{ width: '50%', padding: 4 }}>
            <Card onPress={() => {}} style={{}}>
              <Card.Content style={{ alignItems: 'center', paddingVertical: 16 }}>
                <Avatar.Icon size={40} icon={action.icon} />
                <Text style={{ marginTop: 8 }}>{action.title}</Text>
              </Card.Content>
            </Card>
          </View>
        ))}
      </View>

      {/* Recent activity */}
      <Text variant="titleMedium" style={{ marginBottom: 8 }}>
        Recent Activity
      </Text>
      <Card>
        <Card.Content>
          <Text variant="bodyMedium" style={{ color: '#6b7280' }}>
            No recent activity yet.
          </Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}
