/**
 * Role-Based Access Control Middleware
 * Checks if authenticated user has required role
 */

/**
 * Check if user has one of the allowed roles
 * @param {Array} allowedRoles - Array of allowed roles
 * @returns {Function} Express middleware
 */
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check if user has required role
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.',
        required: allowedRoles,
        current: req.user.role
      });
    }

    // User has required role, continue
    next();
  };
};

/**
 * Check if user is Admin
 */
const isAdmin = checkRole(['admin']);

/**
 * Check if user is Manager or Admin
 */
const isManagerOrAdmin = checkRole(['manager', 'admin']);

/**
 * Check if user is Supervisor, Manager or Admin
 */
const isSupervisorOrAbove = checkRole(['supervisor', 'manager', 'admin']);

/**
 * Check if user can access worker features
 */
const isWorkerOrAbove = checkRole(['worker', 'supervisor', 'manager', 'admin']);

/**
 * Check if user owns the resource or is admin
 * @param {String} resourceUserIdField - Field name in req.params or req.body containing user id
 */
const isOwnerOrAdmin = (resourceUserIdField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Admin can access everything
    if (req.user.role === 'admin') {
      return next();
    }

    // Get resource user id from params or body
    const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];

    // Check if current user owns the resource
    if (parseInt(resourceUserId) === req.user.id) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only access your own resources.'
    });
  };
};

/**
 * Role hierarchy check
 * @param {String} targetRole - Target role to check against
 * @returns {Boolean}
 */
const hasHigherRole = (userRole, targetRole) => {
  const hierarchy = {
    'worker': 1,
    'supervisor': 2,
    'manager': 3,
    'admin': 4
  };

  return hierarchy[userRole] >= hierarchy[targetRole];
};

/**
 * Check if user can manage another user
 * Users can only manage users with lower role
 */
const canManageUser = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  // Admin can manage everyone
  if (req.user.role === 'admin') {
    return next();
  }

  // Get target user role from request
  const targetRole = req.body.role || req.params.role;

  if (!targetRole) {
    return next(); // Let the controller handle validation
  }

  // Check hierarchy
  if (!hasHigherRole(req.user.role, targetRole)) {
    return res.status(403).json({
      success: false,
      message: 'You cannot manage users with equal or higher roles'
    });
  }

  next();
};

module.exports = {
  checkRole,
  isAdmin,
  isManagerOrAdmin,
  isSupervisorOrAbove,
  isWorkerOrAbove,
  isOwnerOrAdmin,
  canManageUser,
  hasHigherRole
};
