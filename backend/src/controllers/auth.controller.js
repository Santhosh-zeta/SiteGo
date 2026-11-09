const { OAuth2Client } = require('google-auth-library');
const { query } = require('../config/database');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt.util');
const { successResponse, errorResponse } = require('../utils/helper.util');
const { logger } = require('../utils/logger.util');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Google OAuth Login
 * @route POST /api/auth/google
 */
const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;

    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    logger.info('Google login attempt', { email });

    // Check if user exists
    let userResult = await query(
      'SELECT * FROM users WHERE google_id = $1 OR email = $2',
      [googleId, email]
    );

    let user;

    if (userResult.rows.length === 0) {
      // Create new user (default role: worker)
      const insertResult = await query(
        `INSERT INTO users (google_id, email, name, profile_picture, role, status) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING id, google_id, email, name, profile_picture, role, status, created_at`,
        [googleId, email, name, picture, 'worker', 'active']
      );
      
      user = insertResult.rows[0];
      logger.info('New user registered', { userId: user.id, email });

    } else {
      user = userResult.rows[0];

      // Check if user is active
      if (user.status !== 'active') {
        logger.warn('Inactive user login attempt', { userId: user.id, status: user.status });
        return res.status(403).json(
          errorResponse('Your account is inactive. Please contact admin.')
        );
      }

      // Update google_id if not set
      if (!user.google_id) {
        await query(
          'UPDATE users SET google_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [googleId, user.id]
        );
      }

      // Update last login
      await query(
        'UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [user.id]
      );

      logger.info('User logged in', { userId: user.id, email });
    }

    // Generate JWT tokens
    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    const refreshToken = generateRefreshToken({
      id: user.id
    });

    // Send response
    res.status(200).json(
      successResponse('Login successful', {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          profilePicture: user.profile_picture
        },
        tokens: {
          accessToken,
          refreshToken
        }
      })
    );

  } catch (error) {
    logger.error('Google login failed', { error: error.message });
    
    res.status(500).json(
      errorResponse('Authentication failed. Please try again.', {
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    );
  }
};

/**
 * Refresh Access Token
 * @route POST /api/auth/refresh
 */
const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json(
        errorResponse('Refresh token is required')
      );
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Get user from database
    const userResult = await query(
      'SELECT id, email, role, status FROM users WHERE id = $1',
      [decoded.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json(
        errorResponse('User not found')
      );
    }

    const user = userResult.rows[0];

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(403).json(
        errorResponse('Account is inactive')
      );
    }

    // Generate new access token
    const newAccessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    logger.info('Token refreshed', { userId: user.id });

    res.status(200).json(
      successResponse('Token refreshed successfully', {
        accessToken: newAccessToken
      })
    );

  } catch (error) {
    logger.error('Token refresh failed', { error: error.message });
    
    res.status(401).json(
      errorResponse('Invalid or expired refresh token')
    );
  }
};

/**
 * Logout
 * @route POST /api/auth/logout
 */
const logout = async (req, res) => {
  try {
    // In a stateless JWT system, logout is handled client-side
    // Here we can log the event for analytics
    
    logger.info('User logged out', { userId: req.user?.id });

    res.status(200).json(
      successResponse('Logged out successfully')
    );

  } catch (error) {
    logger.error('Logout failed', { error: error.message });
    
    res.status(500).json(
      errorResponse('Logout failed')
    );
  }
};

/**
 * Get Current User Profile
 * @route GET /api/auth/me
 */
const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id;

    const userResult = await query(
      `SELECT id, email, name, phone, role, status, profile_picture, created_at 
       FROM users 
       WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json(
        errorResponse('User not found')
      );
    }

    const user = userResult.rows[0];

    res.status(200).json(
      successResponse('User profile retrieved', {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        profilePicture: user.profile_picture,
        createdAt: user.created_at
      })
    );

  } catch (error) {
    logger.error('Failed to get current user', { error: error.message });
    
    res.status(500).json(
      errorResponse('Failed to retrieve user profile')
    );
  }
};

/**
 * Verify Token
 * @route POST /api/auth/verify
 */
const verifyToken = async (req, res) => {
  try {
    // If middleware passed, token is valid
    res.status(200).json(
      successResponse('Token is valid', {
        user: req.user
      })
    );

  } catch (error) {
    res.status(401).json(
      errorResponse('Invalid token')
    );
  }
};

module.exports = {
  googleLogin,
  refreshAccessToken,
  logout,
  getCurrentUser,
  verifyToken
};
