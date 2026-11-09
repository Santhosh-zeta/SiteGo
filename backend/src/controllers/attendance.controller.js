const { query, transaction } = require('../config/database');
const { validateLocation, getActiveAttendance } = require('../services/geofence.service');
const { successResponse, errorResponse, getPagination, getPaginationMeta, formatDate, getDayBoundaries } = require('../utils/helper.util');
const { logger } = require('../utils/logger.util');

/**
 * Check In (Worker/Supervisor)
 * @route POST /api/attendance/check-in
 */
const checkIn = async (req, res) => {
  try {
    const { siteId, location } = req.body;
    const userId = req.user.id;

    // Check if already checked in today
    const existingAttendance = await getActiveAttendance(userId);
    
    if (existingAttendance) {
      return res.status(400).json(
        errorResponse(
          `You are already checked in at ${existingAttendance.site_name}`,
          { attendanceId: existingAttendance.id }
        )
      );
    }

    // Validate location against geofence
    const locationValidation = await validateLocation(siteId, location);

    if (!locationValidation.isInside) {
      logger.warn('Check-in outside geofence', {
        userId,
        siteId,
        distance: locationValidation.distance
      });

      return res.status(400).json(
        errorResponse(
          `You are ${locationValidation.distance}m away from the site. Please move closer to check in.`,
          { 
            distance: locationValidation.distance,
            siteName: locationValidation.siteName
          }
        )
      );
    }

    // Check if user is assigned to this site
    const siteUserResult = await query(
      'SELECT id FROM site_users WHERE site_id = $1 AND user_id = $2',
      [siteId, userId]
    );

    if (siteUserResult.rows.length === 0) {
      return res.status(403).json(
        errorResponse('You are not assigned to this site')
      );
    }

    // Create attendance record
    const attendanceResult = await query(
      `INSERT INTO attendance (user_id, site_id, check_in_time, check_in_location, is_valid)
       VALUES ($1, $2, CURRENT_TIMESTAMP, $3, $4)
       RETURNING id, user_id, site_id, check_in_time, check_in_location, is_valid`,
      [userId, siteId, JSON.stringify(location), true]
    );

    const attendance = attendanceResult.rows[0];

    logger.info('User checked in', {
      userId,
      siteId,
      attendanceId: attendance.id
    });

    res.status(201).json(
      successResponse('Checked in successfully', {
        id: attendance.id,
        userId: attendance.user_id,
        siteId: attendance.site_id,
        checkInTime: attendance.check_in_time,
        checkInLocation: attendance.check_in_location,
        siteName: locationValidation.siteName
      })
    );

  } catch (error) {
    logger.error('Check-in failed', { error: error.message });
    
    res.status(500).json(
      errorResponse('Check-in failed. Please try again.')
    );
  }
};

/**
 * Check Out (Worker/Supervisor)
 * @route POST /api/attendance/check-out
 */
const checkOut = async (req, res) => {
  try {
    const { location } = req.body;
    const userId = req.user.id;

    // Get active attendance
    const activeAttendance = await getActiveAttendance(userId);

    if (!activeAttendance) {
      return res.status(400).json(
        errorResponse('No active check-in found')
      );
    }

    // Update attendance with check-out
    const updateResult = await query(
      `UPDATE attendance 
       SET check_out_time = CURRENT_TIMESTAMP,
           check_out_location = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, check_in_time, check_out_time, total_hours`,
      [JSON.stringify(location), activeAttendance.id]
    );

    const attendance = updateResult.rows[0];

    logger.info('User checked out', {
      userId,
      attendanceId: attendance.id,
      totalHours: attendance.total_hours
    });

    res.status(200).json(
      successResponse('Checked out successfully', {
        id: attendance.id,
        checkInTime: attendance.check_in_time,
        checkOutTime: attendance.check_out_time,
        totalHours: parseFloat(attendance.total_hours).toFixed(2),
        siteName: activeAttendance.site_name
      })
    );

  } catch (error) {
    logger.error('Check-out failed', { error: error.message });
    
    res.status(500).json(
      errorResponse('Check-out failed. Please try again.')
    );
  }
};

/**
 * Get Today's Attendance Status
 * @route GET /api/attendance/today
 */
const getTodayAttendance = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startOfDay, endOfDay } = getDayBoundaries();

    const result = await query(
      `SELECT a.*, s.name as site_name, s.address as site_address
       FROM attendance a
       JOIN sites s ON a.site_id = s.id
       WHERE a.user_id = $1
       AND a.check_in_time >= $2
       AND a.check_in_time <= $3
       ORDER BY a.check_in_time DESC
       LIMIT 1`,
      [userId, startOfDay, endOfDay]
    );

    if (result.rows.length === 0) {
      return res.status(200).json(
        successResponse('No attendance record for today', {
          isCheckedIn: false,
          attendance: null
        })
      );
    }

    const attendance = result.rows[0];
    const isCheckedIn = !attendance.check_out_time;

    res.status(200).json(
      successResponse('Today\'s attendance retrieved', {
        isCheckedIn,
        attendance: {
          id: attendance.id,
          siteId: attendance.site_id,
          siteName: attendance.site_name,
          siteAddress: attendance.site_address,
          checkInTime: attendance.check_in_time,
          checkOutTime: attendance.check_out_time,
          totalHours: attendance.total_hours ? parseFloat(attendance.total_hours).toFixed(2) : null,
          isValid: attendance.is_valid
        }
      })
    );

  } catch (error) {
    logger.error('Failed to get today attendance', { error: error.message });
    
    res.status(500).json(
      errorResponse('Failed to retrieve attendance')
    );
  }
};

/**
 * Get Attendance History
 * @route GET /api/attendance/history
 */
const getAttendanceHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, startDate, endDate } = req.query;
    const { offset, limit: queryLimit } = getPagination(page, limit);

    let whereClause = 'a.user_id = $1';
    let params = [userId];
    let paramCount = 1;

    if (startDate) {
      paramCount++;
      whereClause += ` AND a.check_in_time >= $${paramCount}`;
      params.push(startDate);
    }

    if (endDate) {
      paramCount++;
      whereClause += ` AND a.check_in_time <= $${paramCount}`;
      params.push(endDate);
    }

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM attendance a WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get paginated records
    const result = await query(
      `SELECT a.*, s.name as site_name, s.address as site_address
       FROM attendance a
       JOIN sites s ON a.site_id = s.id
       WHERE ${whereClause}
       ORDER BY a.check_in_time DESC
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      [...params, queryLimit, offset]
    );

    const attendance = result.rows.map(record => ({
      id: record.id,
      siteId: record.site_id,
      siteName: record.site_name,
      siteAddress: record.site_address,
      checkInTime: record.check_in_time,
      checkOutTime: record.check_out_time,
      totalHours: record.total_hours ? parseFloat(record.total_hours).toFixed(2) : null,
      isValid: record.is_valid,
      date: formatDate(record.check_in_time)
    }));

    res.status(200).json(
      successResponse(
        'Attendance history retrieved',
        attendance,
        getPaginationMeta(total, parseInt(page), parseInt(limit))
      )
    );

  } catch (error) {
    logger.error('Failed to get attendance history', { error: error.message });
    
    res.status(500).json(
      errorResponse('Failed to retrieve attendance history')
    );
  }
};

/**
 * Get Site Attendance (Supervisor/Manager)
 * @route GET /api/attendance/site/:siteId
 */
const getSiteAttendance = async (req, res) => {
  try {
    const { siteId } = req.params;
    const { date } = req.query;
    const targetDate = date || formatDate(new Date());

    // Get all users assigned to site
    const usersResult = await query(
      `SELECT u.id, u.name, u.email, u.role, u.profile_picture
       FROM users u
       JOIN site_users su ON u.id = su.user_id
       WHERE su.site_id = $1
       ORDER BY u.role, u.name`,
      [siteId]
    );

    // Get attendance for the date
    const attendanceResult = await query(
      `SELECT a.*, u.name as user_name, u.role as user_role
       FROM attendance a
       JOIN users u ON a.user_id = u.id
       WHERE a.site_id = $1
       AND DATE(a.check_in_time) = $2`,
      [siteId, targetDate]
    );

    // Map attendance to users
    const attendanceMap = {};
    attendanceResult.rows.forEach(record => {
      attendanceMap[record.user_id] = {
        id: record.id,
        checkInTime: record.check_in_time,
        checkOutTime: record.check_out_time,
        totalHours: record.total_hours ? parseFloat(record.total_hours).toFixed(2) : null,
        isValid: record.is_valid
      };
    });

    const attendanceList = usersResult.rows.map(user => ({
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePicture: user.profile_picture,
      attendance: attendanceMap[user.id] || null,
      status: attendanceMap[user.id] 
        ? (attendanceMap[user.id].checkOutTime ? 'checked_out' : 'checked_in')
        : 'absent'
    }));

    const summary = {
      total: usersResult.rows.length,
      present: Object.keys(attendanceMap).length,
      absent: usersResult.rows.length - Object.keys(attendanceMap).length,
      checkedOut: attendanceResult.rows.filter(r => r.check_out_time).length
    };

    res.status(200).json(
      successResponse('Site attendance retrieved', {
        date: targetDate,
        summary,
        attendance: attendanceList
      })
    );

  } catch (error) {
    logger.error('Failed to get site attendance', { error: error.message });
    
    res.status(500).json(
      errorResponse('Failed to retrieve site attendance')
    );
  }
};

module.exports = {
  checkIn,
  checkOut,
  getTodayAttendance,
  getAttendanceHistory,
  getSiteAttendance
};
