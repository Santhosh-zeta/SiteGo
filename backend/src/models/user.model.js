const { query } = require('../config/database');

/**
 * User Model
 * Database operations for users table
 */

const User = {
  /**
   * Find user by ID
   */
  findById: async (id) => {
    const result = await query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0];
  },

  /**
   * Find user by email
   */
  findByEmail: async (email) => {
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0];
  },

  /**
   * Find user by Google ID
   */
  findByGoogleId: async (googleId) => {
    const result = await query(
      'SELECT * FROM users WHERE google_id = $1',
      [googleId]
    );
    return result.rows[0];
  },

  /**
   * Create new user
   */
  create: async (userData) => {
    const { googleId, email, name, profilePicture, role } = userData;
    const result = await query(
      `INSERT INTO users (google_id, email, name, profile_picture, role, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [googleId, email, name, profilePicture, role || 'worker', 'active']
    );
    return result.rows[0];
  },

  /**
   * Update user
   */
  update: async (id, userData) => {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(userData).forEach(key => {
      fields.push(`${key} = $${paramCount}`);
      values.push(userData[key]);
      paramCount++;
    });

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const result = await query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0];
  },

  /**
   * Delete user (soft delete)
   */
  delete: async (id) => {
    const result = await query(
      `UPDATE users SET status = 'inactive', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [id]
    );
    return result.rows[0];
  },

  /**
   * Get all users with filters
   */
  findAll: async (filters = {}) => {
    let whereClause = '1=1';
    const params = [];
    let paramCount = 0;

    if (filters.role) {
      paramCount++;
      whereClause += ` AND role = $${paramCount}`;
      params.push(filters.role);
    }

    if (filters.status) {
      paramCount++;
      whereClause += ` AND status = $${paramCount}`;
      params.push(filters.status);
    }

    const result = await query(
      `SELECT * FROM users WHERE ${whereClause} ORDER BY created_at DESC`,
      params
    );
    return result.rows;
  }
};

module.exports = User;
