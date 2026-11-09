const express = require('express');
const router = express.Router();
const { googleLogin, refreshAccessToken, logout, getCurrentUser, verifyToken } = require('../controllers/auth.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { validateBody, schemas } = require('../utils/validation.util');

/**
 * @route   POST /api/auth/google
 * @desc    Google OAuth login
 * @access  Public
 */
router.post('/google', validateBody(schemas.googleAuth), googleLogin);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', validateBody(schemas.refreshToken), refreshAccessToken);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authMiddleware, logout);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authMiddleware, getCurrentUser);

/**
 * @route   POST /api/auth/verify
 * @desc    Verify token validity
 * @access  Private
 */
router.post('/verify', authMiddleware, verifyToken);

module.exports = router;
