// hooks/useGeolocation.js - Custom GPS Hook for SiteGo
import { useState, useEffect } from 'react';
import Geolocation from '@react-native-community/geolocation';
import { PermissionsAndroid, Platform, Alert } from 'react-native';
import { siteAPI } from '../services/api';

export const useGeolocation = () => {
  const [location, setLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [watchId, setWatchId] = useState(null);

  // Request location permissions
  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'SiteGo Location Permission',
            message: 'SiteGo needs location access for geofenced attendance.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true; // iOS handled by Info.plist
  };

  // Get current position with high accuracy
  const getCurrentPosition = () => {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          if (accuracy > 50) {
            reject(new Error('GPS accuracy too low'));
          } else {
            resolve({ latitude, longitude, accuracy });
          }
        },
        (error) => reject(error),
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 30000,
        },
      );
    });
  };

  // Start watching location (for real-time tracking)
  const startWatching = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      setError('Location permission denied');
      setIsLoading(false);
      return;
    }

    try {
      // Get initial position
      const coords = await getCurrentPosition();
      setLocation(coords);
      setError(null);

      // Start continuous tracking
      const id = Geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          if (accuracy <= 50) {
            setLocation({ latitude, longitude, accuracy });
          }
        },
        (error) => {
          console.warn('Location watch error:', error);
        },
        {
          enableHighAccuracy: true,
          distanceFilter: 10, // Update every 10m
          timeout: 10000,
        },
      );
      setWatchId(id);
    } catch (err) {
      setError(err.message);
      console.error('Geolocation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Stop watching
  const stopWatching = () => {
    if (watchId !== null) {
      Geolocation.clearWatch(watchId);
      setWatchId(null);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    startWatching();

    return () => {
      stopWatching();
    };
  }, []);

  return {
    location,
    isLoading,
    error,
    startWatching,
    stopWatching,
    hasLocationPermission: !error || error !== 'Location permission denied',
  };
};
