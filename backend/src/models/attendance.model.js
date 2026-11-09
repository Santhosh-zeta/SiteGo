const { query } = require('../config/database');

/**
 * Attendance Model
 */

const Attendance = {
  /**
   * Create check-in record
   */
  checkIn: async (userId, siteId, location) => {
    const result = await query(
      `INSERT INTO attendance (user_id, site_id, check_in_time, check_in_location, is_valid)
       VALUES ($1, $2, CURRENT_TIMESTAMP, $3, $4)
       RETURNING *`,
      [userId, siteId, JSON.stringify(location), true]
    );
    return result.rows[0];
  },

  /**
   * Check out
   */
  checkOut: async (attendanceId, location) => {
    const result = await query(
      `UPDATE attendance
       SET check_out_time = CURRENT_TIMESTAMP,
           check_out_location = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [JSON.stringify(location), attendanceId]
    );
    return result.rows[0];
  },

  /**
   * Get active attendance for user
   */
  getActive: async (userId) => {
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
    return result.rows[0];
  },

  /**
   * Get attendance by date range
   */
  findByDateRange: async (userId, startDate, endDate) => {
    const result = await query(
      `SELECT a.*, s.name as site_name
       FROM attendance a
       JOIN sites s ON a.site_id = s.id
       WHERE a.user_id = $1
       AND a.check_in_time >= $2
       AND a.check_in_time <= $3
       ORDER BY a.check_in_time DESC`,
      [userId, startDate, endDate]
    );
    return result.rows;
  },

  /**
   * Get site attendance for date
   */
  getSiteAttendance: async (siteId, date) => {
    const result = await query(
      `SELECT a.*, u.name as user_name, u.role
       FROM attendance a
       JOIN users u ON a.user_id = u.id
       WHERE a.site_id = $1
       AND DATE(a.check_in_time) = $2`,
      [siteId, date]
    );
    return result.rows;
  }
};

module.exports = Attendance;
