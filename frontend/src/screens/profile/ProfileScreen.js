import React from 'react';
import { View, ScrollView } from 'react-native';
import { Avatar, Card, Text, Button, List, Switch, Divider, IconButton, useTheme } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { clearAuth } from '../../redux/slices/authSlice';

export default function ProfileScreen() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const theme = useTheme();

  const [notifications, setNotifications] = React.useState(true);
  const [darkMode, setDarkMode] = React.useState(false);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ padding: 24 }}>
        
        {/* Profile Header */}
        <Card style={{ marginBottom: 24, elevation: 4 }}>
          <Card.Cover 
            source={{ uri: user?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=500' }} 
            style={{ height: 200 }}
          />
          <Card.Content style={{ alignItems: 'center', paddingTop: 16 }}>
            <Avatar.Text size={80} label={user?.name?.[0] || 'U'} style={{ backgroundColor: theme.colors.primary }} />
            <Text variant="headlineMedium" style={{ marginTop: 8, fontWeight: 'bold' }}>
              {user?.name || 'John Doe'}
            </Text>
            <Text variant="titleMedium" style={{ color: theme.colors.primary }}>
              {user?.role || 'WORKER'}
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.outline, marginTop: 4 }}>
              {user?.email || 'john@example.com'}
            </Text>
          </Card.Content>
        </Card>

        {/* Stats */}
        <View style={{ flexDirection: 'row', marginBottom: 24 }}>
          <Card style={{ flex: 1, marginRight: 8, elevation: 2 }}>
            <Card.Content style={{ alignItems: 'center' }}>
              <Text variant="headlineSmall">47</Text>
              <Text variant="bodySmall" style={{ color: theme.colors.outline }}>Total Hours</Text>
            </Card.Content>
          </Card>
          <Card style={{ flex: 1, marginLeft: 8, elevation: 2 }}>
            <Card.Content style={{ alignItems: 'center' }}>
              <Text variant="headlineSmall">3</Text>
              <Text variant="bodySmall" style={{ color: theme.colors.outline }}>Active Sites</Text>
            </Card.Content>
          </Card>
        </View>

        {/* Settings List */}
        <Card style={{ marginBottom: 24, elevation: 2 }}>
          <Card.Content>
            <List.Section>
              <List.Item
                title="Notifications"
                description="Receive push notifications"
                left={() => <List.Icon icon="bell-outline" />}
                right={() => <Switch value={notifications} onValueChange={setNotifications} />}
              />
              <Divider />
              <List.Item
                title="Dark Mode"
                description="Enable dark theme"
                left={() => <List.Icon icon="weather-night" />}
                right={() => <Switch value={darkMode} onValueChange={setDarkMode} />}
              />
              <Divider />
              <List.Item
                title="Location Services"
                description="Track attendance with GPS"
                left={() => <List.Icon icon="map-marker" />}
                right={() => <List.Icon icon="toggle-switch" />}
              />
            </List.Section>
          </Card.Content>
        </Card>

        {/* Account Actions */}
        <Card style={{ elevation: 2 }}>
          <Card.Content>
            <Button 
              mode="outlined" 
              style={{ marginBottom: 12 }}
              icon="cog-outline"
            >
              Account Settings
            </Button>
            <Button 
              mode="outlined" 
              style={{ marginBottom: 12 }}
              icon="help-circle-outline"
            >
              Help & Support
            </Button>
            <Button 
              mode="contained-tonal" 
              style={{ marginBottom: 12 }}
              icon="shield-check-outline"
            >
              Privacy Policy
            </Button>
            <Button 
              mode="text" 
              style={{ marginBottom: 8 }}
              onPress={() => dispatch(clearAuth())}
              icon="logout"
            >
              Logout
            </Button>
          </Card.Content>
        </Card>
      </View>
    </ScrollView>
  );
}
