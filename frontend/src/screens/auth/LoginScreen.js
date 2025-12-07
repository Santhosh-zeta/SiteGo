import React from 'react';
import { View, Alert } from 'react-native';
import { Button, Card, Text, ActivityIndicator, useTheme } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { login, clearError } from '../../redux/slices/authSlice';

export default function LoginScreen() {
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state) => state.auth);

  const theme = useTheme();

  const handleGoogleSignIn = () => {
    dispatch(clearError());
    
    // Mock Google login for now
    setTimeout(() => {
      const mockUser = {
        id: 1,
        name: 'John Doe',
        email: 'john.doe@example.com',
        role: 'WORKER',
        avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
      };
      
      dispatch(login({ idToken: 'mock-google-token' }));
      Alert.alert('Success', 'Logged in as John Doe!');
    }, 1500);
  };

  const handleGuestLogin = () => {
    Alert.alert('Guest Mode', 'Guest login coming soon!');
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.primaryContainer }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Card style={{ width: '100%', maxWidth: 400, elevation: 8 }}>
          <Card.Cover 
            source={{ uri: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500' }} 
            style={{ height: 200 }}
          />
          <Card.Content style={{ paddingTop: 16 }}>
            <Text variant="headlineMedium" style={{ fontWeight: 'bold', marginBottom: 8 }}>
              🏗️ SiteGo
            </Text>
            <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 24 }}>
              Smart construction management platform
            </Text>

            {/* Error Message */}
            {error && (
              <Card style={{ marginBottom: 16, backgroundColor: theme.colors.errorContainer }}>
                <Card.Content>
                  <Text variant="bodyMedium" style={{ color: theme.colors.error }}>
                    {error}
                  </Text>
                </Card.Content>
              </Card>
            )}

            {/* Google Sign In */}
            <Button 
              mode="contained" 
              onPress={handleGoogleSignIn}
              loading={isLoading}
              disabled={isLoading}
              style={{ marginBottom: 12 }}
            >
              Sign in with Google
            </Button>

            {/* Divider */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 16 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: theme.colors.outline }} />
              <Text variant="bodySmall" style={{ marginHorizontal: 8, color: theme.colors.outline }}>
                OR
              </Text>
              <View style={{ flex: 1, height: 1, backgroundColor: theme.colors.outline }} />
            </View>

            {/* Guest Login */}
            <Button 
              mode="outlined" 
              onPress={handleGuestLogin}
              disabled={isLoading}
            >
              Continue as Guest
            </Button>
          </Card.Content>
        </Card>
      </View>
    </View>
  );
}
