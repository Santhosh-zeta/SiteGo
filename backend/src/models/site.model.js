const { query } = require('../config/database');

/**
 * Site Model
 */

const Site = {
  /**
   * Find site by ID
   */
  findById: async (id) => {
    const result = await query(
      'SELECT * FROM sites WHERE id = $1',
      [id]
    );
    return result.rows[0];
  },

  /**
   * Create new site
   */
  create: async (siteData) => {
    const { name, address, geofence, createdBy, startDate, endDate, budget, description } = siteData;
    const result = await query(
      `INSERT INTO sites (name, address, geofence, created_by, start_date, end_date, budget, description, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [name, address, JSON.stringify(geofence), createdBy, startDate, endDate, budget, description, 'active']
    );
    return result.rows[0];
  },

  /**
   * Update site
   */
  update: async (id, siteData) => {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(siteData).forEach(key => {
      if (key === 'geofence') {
        fields.push(`${key} = $${paramCount}`);
        values.push(JSON.stringify(siteData[key]));
      } else {
        fields.push(`${key} = $${paramCount}`);
        values.push(siteData[key]);
      }
      paramCount++;
    });

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const result = await query(
      `UPDATE sites SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0];
  },

  /**
   * Get all sites
   */
  findAll: async (filters = {}) => {
    let whereClause = '1=1';
    const params = [];
    let paramCount = 0;

    if (filters.status) {
      paramCount++;
      whereClause += ` AND status = $${paramCount}`;
      params.push(filters.status);
    }

    const result = await query(
      `SELECT * FROM sites WHERE ${whereClause} ORDER BY created_at DESC`,
      params
    );
    return result.rows;
  },

  /**
   * Assign user to site
   */
  assignUser: async (siteId, userId) => {
    const result = await query(
      'INSERT INTO site_users (site_id, user_id) VALUES ($1, $2) RETURNING *',
      [siteId, userId]
    );
    return result.rows[0];
  },

  /**
   * Remove user from site
   */
  removeUser: async (siteId, userId) => {
    const result = await query(
      'DELETE FROM site_users WHERE site_id = $1 AND user_id = $2 RETURNING *',
      [siteId, userId]
    );
    return result.rows[0];
  },

  /**
   * Get site users
   */
  getUsers: async (siteId) => {
    const result = await query(
      `SELECT u.* FROM users u
       JOIN site_users su ON u.id = su.user_id
       WHERE su.site_id = $1
       ORDER BY u.role, u.name`,
      [siteId]
    );
    return result.rows;
  }
};

module.exports = Site;
