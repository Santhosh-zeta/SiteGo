// services/geolocation.js - Geofencing Validation Service
import { attendanceAPI, siteAPI } from './api';

export const geolocationService = {
  // Validate if location is inside site geofence
  validateGeofence: async (siteId, location) => {
    try {
      // Backend handles polygon validation [file:8]
      const response = await attendanceAPI.checkIn(siteId, location, {
        validateOnly: true, // Custom flag if backend supports
      });
      return {
        isInside: true,
        distance: 0,
        siteName: response.data.siteName,
      };
    } catch (error) {
      const distance = error.response?.data?.distance || 999;
      return {
        isInside: false,
        distance,
        siteName: error.response?.data?.siteName || 'Unknown',
      };
    }
  },

  // Get nearby sites
  getNearbySites: async (location, maxDistance = 5000) => {
    try {
      const sites = await siteAPI.getAllSites({
        lat: location.latitude,
        lng: location.longitude,
        distance: maxDistance,
      });
      return sites.data;
    } catch (error) {
      return [];
    }
  },

  // Check if user is at assigned site
  isAtAssignedSite: async (userId, location) => {
    try {
      const sites = await siteAPI.getMySites();
      for (const site of sites.data) {
        const validation = await geolocationService.validateGeofence(site.id, location);
        if (validation.isInside) {
          return { site, isValid: true };
        }
      }
      return { isValid: false };
    } catch (error) {
      return { isValid: false };
    }
  },
};
