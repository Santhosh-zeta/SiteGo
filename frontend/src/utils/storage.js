import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  ACCESS_TOKEN: '@sitego:access_token',
  REFRESH_TOKEN: '@sitego:refresh_token',
  USER: '@sitego:user',
};

// Token functions
export const saveAccessToken = async (token) => {
  try {
    await AsyncStorage.setItem(KEYS.ACCESS_TOKEN, token);
    return true;
  } catch (error) {
    console.error('❌ Save access token failed:', error);
    return false;
  }
};

export const getAccessToken = async () => {
  try {
    return await AsyncStorage.getItem(KEYS.ACCESS_TOKEN);
  } catch (error) {
    console.error('❌ Get access token failed:', error);
    return null;
  }
};

export const saveRefreshToken = async (token) => {
  try {
    await AsyncStorage.setItem(KEYS.REFRESH_TOKEN, token);
    return true;
  } catch (error) {
    return false;
  }
};

export const getRefreshToken = async () => {
  try {
    return await AsyncStorage.getItem(KEYS.REFRESH_TOKEN);
  } catch (error) {
    return null;
  }
};

// User functions
export const saveUser = async (user) => {
  try {
    await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
    return true;
  } catch (error) {
    return false;
  }
};

export const getUser = async () => {
  try {
    const userJson = await AsyncStorage.getItem(KEYS.USER);
    return userJson ? JSON.parse(userJson) : null;
  } catch (error) {
    return null;
  }
};

// Clear all data
export const clearStorage = async () => {
  try {
    await AsyncStorage.multiRemove([
      KEYS.ACCESS_TOKEN,
      KEYS.REFRESH_TOKEN,
      KEYS.USER,
    ]);
    return true;
  } catch (error) {
    return false;
  }
};

export default {
  saveAccessToken,
  getAccessToken,
  saveRefreshToken,
  getRefreshToken,
  saveUser,
  getUser,
  clearStorage,
};
