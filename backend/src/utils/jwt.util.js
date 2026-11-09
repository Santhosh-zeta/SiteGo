const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * Generate JWT Access Token
 * @param {Object} payload - User data to encode
 * @returns {String} JWT token
 */
const generateAccessToken = (payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || '1h',
      issuer: 'sitego-backend',
      audience: 'sitego-app'
    }
  );
};

/**
 * Generate JWT Refresh Token
 * @param {Object} payload - User data to encode
 * @returns {String} Refresh token
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
      issuer: 'sitego-backend',
      audience: 'sitego-app'
    }
  );
};

/**
 * Verify JWT Access Token
 * @param {String} token - JWT token to verify
 * @returns {Object} Decoded payload
 */
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'sitego-backend',
      audience: 'sitego-app'
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    throw new Error('Token verification failed');
  }
};

/**
 * Verify JWT Refresh Token
 * @param {String} token - Refresh token to verify
 * @returns {Object} Decoded payload
 */
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET, {
      issuer: 'sitego-backend',
      audience: 'sitego-app'
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Refresh token has expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid refresh token');
    }
    throw new Error('Refresh token verification failed');
  }
};

/**
 * Decode token without verification (for debugging)
 * @param {String} token - JWT token
 * @returns {Object} Decoded payload
 */
const decodeToken = (token) => {
  return jwt.decode(token);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken
};
