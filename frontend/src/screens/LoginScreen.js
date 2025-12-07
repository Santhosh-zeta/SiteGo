import React from 'react';
import { View } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import { setUser } from '../redux/slices/authSlice';

export default function LoginScreen() {
  const dispatch = useDispatch();

  const handleLogin = () => {
    dispatch(setUser({ name: 'John Doe', email: 'john@example.com' }));
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }}>
      <Card style={{ width: '100%', maxWidth: 400 }}>
        <Card.Content>
          <Text variant="headlineMedium" style={{ fontWeight: 'bold', marginBottom: 8 }}>
            🏗️ SiteGo
          </Text>
          <Text variant="bodyMedium" style={{ marginBottom: 16 }}>
            Sign in to continue
          </Text>
          <Button mode="contained" onPress={handleLogin}>
            Continue
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
}
