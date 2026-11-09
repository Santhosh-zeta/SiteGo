const { verifyAccessToken } = require('../utils/jwt.util');

/**
 * Authentication Middleware
 * Verifies JWT token from Authorization header
 * Attaches user data to req.user
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'No authorization header provided'
      });
    }

    // Check if header starts with "Bearer "
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authorization format. Use: Bearer <token>'
      });
    }

    // Extract token
    const token = authHeader.split(' ')[1];

    if (!token || token === 'null' || token === 'undefined') {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    // Verify token
    const decoded = verifyAccessToken(token);

    // Attach user data to request object
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    };

    // Continue to next middleware
    next();

  } catch (error) {
    console.error('❌ Authentication error:', error.message);
    
    return res.status(401).json({
      success: false,
      message: error.message || 'Authentication failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Optional Authentication Middleware
 * Does not fail if token is missing, but verifies if present
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      
      if (token && token !== 'null' && token !== 'undefined') {
        const decoded = verifyAccessToken(token);
        req.user = {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role
        };
      }
    }

    next();
  } catch (error) {
    // Don't fail, just continue without user
    next();
  }
};

module.exports = {
  authMiddleware,
  optionalAuth
};
