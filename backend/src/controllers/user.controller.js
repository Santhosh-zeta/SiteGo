const { query } = require('../config/database');
const { successResponse, errorResponse, getPagination, getPaginationMeta } = require('../utils/helper.util');
const { logger } = require('../utils/logger.util');

/**
 * Get All Users (Admin)
 * @route GET /api/users
 */
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, status, search } = req.query;
    const { offset, limit: queryLimit } = getPagination(page, limit);

    let whereClause = '1=1';
    let params = [];
    let paramCount = 0;

    if (role) {
      paramCount++;
      whereClause += ` AND role = $${paramCount}`;
      params.push(role);
    }

    if (status) {
      paramCount++;
      whereClause += ` AND status = $${paramCount}`;
      params.push(status);
    }

    if (search) {
      paramCount++;
      whereClause += ` AND (name ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM users WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get users
    const result = await query(
      `SELECT id, email, name, phone, role, status, profile_picture, created_at, updated_at
       FROM users
       WHERE ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      [...params, queryLimit, offset]
    );

    res.status(200).json(
      successResponse(
        'Users retrieved successfully',
        result.rows,
        getPaginationMeta(total, parseInt(page), parseInt(limit))
      )
    );

  } catch (error) {
    logger.error('Failed to get users', { error: error.message });
    
    res.status(500).json(
      errorResponse('Failed to retrieve users')
    );
  }
};

/**
 * Get User by ID
 * @route GET /api/users/:userId
 */
const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await query(
      `SELECT id, email, name, phone, role, status, profile_picture, created_at, updated_at
       FROM users
       WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json(
        errorResponse('User not found')
      );
    }

    // Get assigned sites
    const sitesResult = await query(
      `SELECT s.id, s.name, s.address, su.assigned_at
       FROM sites s
       JOIN site_users su ON s.id = su.site_id
       WHERE su.user_id = $1
       ORDER BY su.assigned_at DESC`,
      [userId]
    );

    const user = result.rows[0];
    user.assignedSites = sitesResult.rows;

    res.status(200).json(
      successResponse('User details retrieved', user)
    );

  } catch (error) {
    logger.error('Failed to get user', { error: error.message });
    
    res.status(500).json(
      errorResponse('Failed to retrieve user')
    );
  }
};

/**
 * Create User (Admin)
 * @route POST /api/users
 */
const createUser = async (req, res) => {
  try {
    const { email, name, phone, role } = req.body;

    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json(
        errorResponse('User with this email already exists')
      );
    }

    // Create user
    const result = await query(
      `INSERT INTO users (email, name, phone, role, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, name, phone, role, status, created_at`,
      [email, name, phone || null, role || 'worker', 'active']
    );

    const user = result.rows[0];

    logger.info('User created', { userId: user.id, email });

    res.status(201).json(
      successResponse('User created successfully', user)
    );

  } catch (error) {
    logger.error('Failed to create user', { error: error.message });
    
    res.status(500).json(
      errorResponse('Failed to create user')
    );
  }
};

/**
 * Update User (Admin/Self)
 * @route PUT /api/users/:userId
 */
const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, phone, role, status } = req.body;

    // Check permissions - users can update themselves, admin can update anyone
    if (req.user.role !== 'admin' && req.user.id !== parseInt(userId)) {
      return res.status(403).json(
        errorResponse('You can only update your own profile')
      );
    }

    // Non-admins cannot change role or status
    if (req.user.role !== 'admin' && (role || status)) {
      return res.status(403).json(
        errorResponse('Only admins can change role or status')
      );
    }

    // Get current user data
    const userResult = await query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json(
        errorResponse('User not found')
      );
    }

    const currentUser = userResult.rows[0];

    // Update user
    const updateResult = await query(
      `UPDATE users 
       SET name = $1,
           phone = $2,
           role = $3,
           status = $4,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING id, email, name, phone, role, status, profile_picture, updated_at`,
      [
        name || currentUser.name,
        phone !== undefined ? phone : currentUser.phone,
        role || currentUser.role,
        status || currentUser.status,
        userId
      ]
    );

    logger.info('User updated', { userId, updatedBy: req.user.id });

    res.status(200).json(
      successResponse('User updated successfully', updateResult.rows[0])
    );

  } catch (error) {
    logger.error('Failed to update user', { error: error.message });
    
    res.status(500).json(
      errorResponse('Failed to update user')
    );
  }
};

/**
 * Update User Role (Admin)
 * @route PUT /api/users/:userId/role
 */
const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    // Validate role
    const validRoles = ['worker', 'supervisor', 'manager', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json(
        errorResponse('Invalid role')
      );
    }

    const result = await query(
      `UPDATE users 
       SET role = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, name, email, role`,
      [role, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json(
        errorResponse('User not found')
      );
    }

    logger.info('User role updated', { userId, newRole: role });

    res.status(200).json(
      successResponse('User role updated successfully', result.rows[0])
    );

  } catch (error) {
    logger.error('Failed to update user role', { error: error.message });
    
    res.status(500).json(
      errorResponse('Failed to update user role')
    );
  }
};

/**
 * Update User Status (Admin)
 * @route PUT /api/users/:userId/status
 */
const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['active', 'inactive', 'suspended'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json(
        errorResponse('Invalid status')
      );
    }

    const result = await query(
      `UPDATE users 
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, name, email, status`,
      [status, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json(
        errorResponse('User not found')
      );
    }

    logger.info('User status updated', { userId, newStatus: status });

    res.status(200).json(
      successResponse('User status updated successfully', result.rows[0])
    );

  } catch (error) {
    logger.error('Failed to update user status', { error: error.message });
    
    res.status(500).json(
      errorResponse('Failed to update user status')
    );
  }
};

/**
 * Delete User (Admin)
 * @route DELETE /api/users/:userId
 */
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Prevent deleting yourself
    if (req.user.id === parseInt(userId)) {
      return res.status(400).json(
        errorResponse('You cannot delete your own account')
      );
    }

    // Soft delete - set status to inactive
    const result = await query(
      'UPDATE users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      ['inactive', userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json(
        errorResponse('User not found')
      );
    }

    logger.info('User deleted (soft)', { userId, deletedBy: req.user.id });

    res.status(200).json(
      successResponse('User deleted successfully')
    );

  } catch (error) {
    logger.error('Failed to delete user', { error: error.message });
    
    res.status(500).json(
      errorResponse('Failed to delete user')
    );
  }
};

/**
 * Get Users by Role
 * @route GET /api/users/role/:role
 */
const getUsersByRole = async (req, res) => {
  try {
    const { role } = req.params;

    const result = await query(
      `SELECT id, email, name, phone, role, status, profile_picture
       FROM users
       WHERE role = $1 AND status = 'active'
       ORDER BY name`,
      [role]
    );

    res.status(200).json(
      successResponse(`${role}s retrieved successfully`, result.rows)
    );

  } catch (error) {
    logger.error('Failed to get users by role', { error: error.message });
    
    res.status(500).json(
      errorResponse('Failed to retrieve users')
    );
  }
};

/**
 * Get User Statistics (Admin)
 * @route GET /api/users/stats
 */
const getUserStats = async (req, res) => {
  try {
    // Get total users by role
    const roleStats = await query(
      `SELECT role, COUNT(*) as count
       FROM users
       WHERE status = 'active'
       GROUP BY role`
    );

    // Get total users by status
    const statusStats = await query(
      `SELECT status, COUNT(*) as count
       FROM users
       GROUP BY status`
    );

    // Get recent users (last 7 days)
    const recentUsers = await query(
      `SELECT COUNT(*) as count
       FROM users
       WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'`
    );

    res.status(200).json(
      successResponse('User statistics retrieved', {
        byRole: roleStats.rows,
        byStatus: statusStats.rows,
        recentUsers: parseInt(recentUsers.rows[0].count)
      })
    );

  } catch (error) {
    logger.error('Failed to get user stats', { error: error.message });
    
    res.status(500).json(
      errorResponse('Failed to retrieve user statistics')
    );
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserRole,
  updateUserStatus,
  deleteUser,
  getUsersByRole,
  getUserStats
};
