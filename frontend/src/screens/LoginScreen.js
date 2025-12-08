// src/screens/LoginScreen.js
import React, { useEffect } from 'react';
import { StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Button,
  useTheme,
  Surface,
  Title,
  Paragraph,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';

WebBrowser.maybeCompleteAuthSession();

const LoginScreen = () => {
  const theme = useTheme();
  const { signIn } = useAuth();

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId:
      '639843907861-l46qthj69pl54pndp08bgpnvb7v5q01c.apps.googleusercontent.com',
    scopes: ['openid', 'email', 'profile'],
    responseType: 'id_token',
  });

  useEffect(() => {
    const handleResponse = async () => {
      if (response?.type !== 'success') return;

      const id_token =
        response?.params?.id_token || response?.authentication?.idToken;
      console.log('GOOGLE RESPONSE', response);
      console.log('ID TOKEN', id_token);

      if (!id_token) {
        Alert.alert('Error', 'No id_token from Google');
        return;
      }

      try {
        console.log('CALLING BACKEND /auth/google');
        const res = await authAPI.googleLogin(id_token);
        console.log('BACKEND RESPONSE', res.data);

        // FIX: match backend shape: { success, message, data: { user, tokens } }
        const { user, tokens } = res.data.data;

        await signIn(tokens.accessToken, tokens.refreshToken, user);
        console.log('SIGNED IN, USER SET IN CONTEXT');
      } catch (e) {
        console.log('LOGIN ERROR', e?.response?.data || e.message);
        Alert.alert(
          'Login failed',
          e?.response?.data?.message || 'Server error during Google login'
        );
      }
    };

    handleResponse();
  }, [response]);

  const handleGoogleLogin = () => {
    if (!request) {
      Alert.alert('Error', 'Google auth not ready yet');
      return;
    }
    promptAsync();
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Surface style={styles.surface}>
        <Icon
          name="office-building"
          size={80}
          color={theme.colors.primary}
        />
        <Title style={styles.title}>SiteGo</Title>
        <Paragraph style={styles.subtitle}>
          Construction Site Monitoring & Management
        </Paragraph>

        <Button
          mode="contained"
          style={styles.googleButton}
          icon="google"
          onPress={handleGoogleLogin}
        >
          Continue with Google
        </Button>
      </Surface>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#f5f5f5' },
  surface: {
    flex: 1,
    padding: 24,
    minHeight: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 36, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  googleButton: {
    marginTop: 24,
    paddingVertical: 8,
    borderRadius: 12,
    width: '80%',
  },
});

export default LoginScreen;
