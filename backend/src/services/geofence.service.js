const { query } = require('../config/database');
const { isPointInPolygon, calculateDistance } = require('../utils/helper.util');
const { logger } = require('../utils/logger.util');

/**
 * Geofence Service
 * Handles geofencing logic for attendance validation
 */

/**
 * Check if location is inside site geofence
 * @param {Number} siteId - Site ID
 * @param {Object} location - {lat, lng}
 * @returns {Object} - {isInside, distance}
 */
const validateLocation = async (siteId, location) => {
  try {
    // Get site geofence
    const siteResult = await query(
      'SELECT id, name, geofence FROM sites WHERE id = $1',
      [siteId]
    );

    if (siteResult.rows.length === 0) {
      throw new Error('Site not found');
    }

    const site = siteResult.rows[0];
    const geofence = site.geofence;

    // Check if geofence is valid
    if (!geofence || !Array.isArray(geofence) || geofence.length < 3) {
      throw new Error('Invalid geofence configuration');
    }

    // Check if point is inside polygon
    const isInside = isPointInPolygon(location, geofence);

    // Calculate distance to nearest point if outside
    let distance = 0;
    if (!isInside) {
      distance = calculateMinDistanceToPolygon(location, geofence);
    }

    logger.info('Location validated', {
      siteId,
      siteName: site.name,
      isInside,
      distance: Math.round(distance)
    });

    return {
      isInside,
      distance: Math.round(distance),
      siteName: site.name
    };

  } catch (error) {
    logger.error('Location validation failed', { 
      siteId, 
      error: error.message 
    });
    throw error;
  }
};

/**
 * Calculate minimum distance from point to polygon
 * @param {Object} point - {lat, lng}
 * @param {Array} polygon - Array of {lat, lng}
 * @returns {Number} - Distance in meters
 */
const calculateMinDistanceToPolygon = (point, polygon) => {
  let minDistance = Infinity;

  for (let i = 0; i < polygon.length; i++) {
    const vertex = polygon[i];
    const distance = calculateDistance(
      point.lat,
      point.lng,
      vertex.lat,
      vertex.lng
    );

    if (distance < minDistance) {
      minDistance = distance;
    }
  }

  return minDistance;
};

/**
 * Get all sites near a location
 * @param {Object} location - {lat, lng}
 * @param {Number} radius - Radius in meters (default 5000m = 5km)
 * @returns {Array} - Array of nearby sites
 */
const getNearestSites = async (location, radius = 5000) => {
  try {
    // Get all active sites
    const sitesResult = await query(
      'SELECT id, name, address, geofence FROM sites WHERE status = $1',
      ['active']
    );

    const nearbySites = [];

    for (const site of sitesResult.rows) {
      if (!site.geofence || site.geofence.length === 0) continue;

      // Calculate distance to site center
      const siteCenter = calculatePolygonCenter(site.geofence);
      const distance = calculateDistance(
        location.lat,
        location.lng,
        siteCenter.lat,
        siteCenter.lng
      );

      if (distance <= radius) {
        nearbySites.push({
          id: site.id,
          name: site.name,
          address: site.address,
          distance: Math.round(distance),
          center: siteCenter
        });
      }
    }

    // Sort by distance
    nearbySites.sort((a, b) => a.distance - b.distance);

    logger.info('Found nearby sites', {
      count: nearbySites.length,
      radius
    });

    return nearbySites;

  } catch (error) {
    logger.error('Failed to find nearest sites', { error: error.message });
    throw error;
  }
};

/**
 * Calculate center point of polygon
 * @param {Array} polygon - Array of {lat, lng}
 * @returns {Object} - {lat, lng}
 */
const calculatePolygonCenter = (polygon) => {
  let latSum = 0;
  let lngSum = 0;

  for (const point of polygon) {
    latSum += point.lat;
    lngSum += point.lng;
  }

  return {
    lat: latSum / polygon.length,
    lng: lngSum / polygon.length
  };
};

/**
 * Validate geofence polygon
 * @param {Array} geofence - Array of {lat, lng}
 * @returns {Object} - {isValid, error}
 */
const validateGeofence = (geofence) => {
  // Check if array
  if (!Array.isArray(geofence)) {
    return { isValid: false, error: 'Geofence must be an array' };
  }

  // Check minimum points (need at least 3 for a polygon)
  if (geofence.length < 3) {
    return { isValid: false, error: 'Geofence must have at least 3 points' };
  }

  // Validate each point
  for (let i = 0; i < geofence.length; i++) {
    const point = geofence[i];

    if (!point.lat || !point.lng) {
      return { 
        isValid: false, 
        error: `Point ${i + 1} missing lat or lng` 
      };
    }

    if (point.lat < -90 || point.lat > 90) {
      return { 
        isValid: false, 
        error: `Point ${i + 1} has invalid latitude` 
      };
    }

    if (point.lng < -180 || point.lng > 180) {
      return { 
        isValid: false, 
        error: `Point ${i + 1} has invalid longitude` 
      };
    }
  }

  return { isValid: true };
};

/**
 * Calculate geofence area (approximate)
 * @param {Array} polygon - Array of {lat, lng}
 * @returns {Number} - Area in square meters
 */
const calculateGeofenceArea = (polygon) => {
  if (polygon.length < 3) return 0;

  let area = 0;
  const R = 6371000; // Earth radius in meters

  for (let i = 0; i < polygon.length; i++) {
    const p1 = polygon[i];
    const p2 = polygon[(i + 1) % polygon.length];

    area += (p2.lng - p1.lng) * (2 + Math.sin(p1.lat * Math.PI / 180) + 
            Math.sin(p2.lat * Math.PI / 180));
  }

  area = Math.abs(area * R * R / 2);
  return Math.round(area);
};

/**
 * Check if worker is already checked in at another site
 * @param {Number} userId - User ID
 * @returns {Object|null} - Active attendance record or null
 */
const getActiveAttendance = async (userId) => {
  try {
    const result = await query(
      `SELECT a.*, s.name as site_name 
       FROM attendance a
       JOIN sites s ON a.site_id = s.id
       WHERE a.user_id = $1 
       AND a.check_out_time IS NULL
       AND DATE(a.check_in_time) = CURRENT_DATE
       ORDER BY a.check_in_time DESC
       LIMIT 1`,
      [userId]
    );

    return result.rows.length > 0 ? result.rows[0] : null;

  } catch (error) {
    logger.error('Failed to get active attendance', { error: error.message });
    throw error;
  }
};

module.exports = {
  validateLocation,
  getNearestSites,
  calculatePolygonCenter,
  validateGeofence,
  calculateGeofenceArea,
  getActiveAttendance,
  calculateMinDistanceToPolygon
};
