/**
 * Helper Utility Functions
 * Common helper functions used across the application
 */

/**
 * Generate random string
 * @param {Number} length - Length of string
 * @returns {String}
 */
const generateRandomString = (length = 10) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

/**
 * Generate QR code value
 * @param {String} prefix - Prefix for QR code
 * @param {Number} id - ID to encode
 * @returns {String}
 */
const generateQRCode = (prefix, id) => {
  return `${prefix}-${id}-${generateRandomString(6)}`;
};

/**
 * Format response success
 * @param {String} message - Success message
 * @param {Object} data - Response data
 * @param {Object} meta - Additional metadata (pagination, etc.)
 * @returns {Object}
 */
const successResponse = (message, data = null, meta = null) => {
  const response = {
    success: true,
    message
  };

  if (data !== null) {
    response.data = data;
  }

  if (meta !== null) {
    response.meta = meta;
  }

  return response;
};

/**
 * Format response error
 * @param {String} message - Error message
 * @param {Object} errors - Error details
 * @returns {Object}
 */
const errorResponse = (message, errors = null) => {
  const response = {
    success: false,
    message
  };

  if (errors !== null) {
    response.errors = errors;
  }

  return response;
};

/**
 * Pagination helper
 * @param {Number} page - Current page
 * @param {Number} limit - Items per page
 * @returns {Object} - offset and limit for SQL
 */
const getPagination = (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  return { offset, limit };
};

/**
 * Format pagination metadata
 * @param {Number} total - Total items
 * @param {Number} page - Current page
 * @param {Number} limit - Items per page
 * @returns {Object}
 */
const getPaginationMeta = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1
  };
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 * @param {Number} lat1 - Latitude of point 1
 * @param {Number} lon1 - Longitude of point 1
 * @param {Number} lat2 - Latitude of point 2
 * @param {Number} lon2 - Longitude of point 2
 * @returns {Number} - Distance in meters
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

/**
 * Check if point is inside polygon (geofence)
 * @param {Object} point - {lat, lng}
 * @param {Array} polygon - Array of {lat, lng} coordinates
 * @returns {Boolean}
 */
const isPointInPolygon = (point, polygon) => {
  const x = point.lat;
  const y = point.lng;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lat;
    const yi = polygon[i].lng;
    const xj = polygon[j].lat;
    const yj = polygon[j].lng;

    const intersect = ((yi > y) !== (yj > y)) &&
                     (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    
    if (intersect) inside = !inside;
  }

  return inside;
};

/**
 * Format date to YYYY-MM-DD
 * @param {Date} date - Date object
 * @returns {String}
 */
const formatDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Format time to HH:MM:SS
 * @param {Date} date - Date object
 * @returns {String}
 */
const formatTime = (date) => {
  const d = new Date(date);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

/**
 * Get start and end of day
 * @param {Date} date - Date object
 * @returns {Object} - {startOfDay, endOfDay}
 */
const getDayBoundaries = (date = new Date()) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return { startOfDay, endOfDay };
};

/**
 * Sanitize filename
 * @param {String} filename - Original filename
 * @returns {String}
 */
const sanitizeFilename = (filename) => {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();
};

/**
 * Get file extension
 * @param {String} filename - Filename
 * @returns {String}
 */
const getFileExtension = (filename) => {
  return filename.split('.').pop().toLowerCase();
};

/**
 * Convert bytes to readable format
 * @param {Number} bytes - File size in bytes
 * @returns {String}
 */
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Sleep/delay function
 * @param {Number} ms - Milliseconds to sleep
 * @returns {Promise}
 */
const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Chunk array into smaller arrays
 * @param {Array} array - Array to chunk
 * @param {Number} size - Chunk size
 * @returns {Array}
 */
const chunkArray = (array, size) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

/**
 * Remove duplicates from array
 * @param {Array} array - Input array
 * @returns {Array}
 */
const uniqueArray = (array) => {
  return [...new Set(array)];
};

/**
 * Deep clone object
 * @param {Object} obj - Object to clone
 * @returns {Object}
 */
const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Check if object is empty
 * @param {Object} obj - Object to check
 * @returns {Boolean}
 */
const isEmpty = (obj) => {
  return Object.keys(obj).length === 0;
};

module.exports = {
  generateRandomString,
  generateQRCode,
  successResponse,
  errorResponse,
  getPagination,
  getPaginationMeta,
  calculateDistance,
  isPointInPolygon,
  formatDate,
  formatTime,
  getDayBoundaries,
  sanitizeFilename,
  getFileExtension,
  formatFileSize,
  sleep,
  chunkArray,
  uniqueArray,
  deepClone,
  isEmpty
};
