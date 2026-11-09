const { query, transaction } = require('../config/database');
const { validateGeofence } = require('../services/geofence.service');
const { successResponse, errorResponse, getPagination, getPaginationMeta } = require('../utils/helper.util');
const { logger } = require('../utils/logger.util');

/**
 * Create Site (Admin)
 * @route POST /api/sites
 */
const createSite = async (req, res) => {
  try {
    const {
      name,
      address,
      geofence,
      startDate,
      endDate,
      budget,
      description
    } = req.body;

    const createdBy = req.user.id;

    // Validate geofence
    const geofenceValidation = validateGeofence(geofence);
    if (!geofenceValidation.isValid) {
      return res.status(400).json(
        errorResponse(geofenceValidation.error)
      );
    }

    // Create site
    const result = await query(
      `INSERT INTO sites 
       (name, address, geofence, created_by, start_date, end_date, budget, description, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        name,
        address,
        JSON.stringify(geofence),
        createdBy,
        startDate || null,
        endDate || null,
        budget || null,
        description || null,
        'active'
      ]
    );

    const site = result.rows[0];

    logger.info('Site created', {
      siteId: site.id,
      name: site.name,
      createdBy
    });

    res.status(201).json(
      successResponse('Site created successfully', {
        id: site.id,
        name: site.name,
        address: site.address,
        geofence: site.geofence,
        status: site.status,
        startDate: site.start_date,
        endDate: site.end_date,
        budget: site.budget,
        description: site.description,
        createdAt: site.created_at
      })
    );

  } catch (error) {
    logger.error('Failed to create site', { error: error.message });
    
    res.status(500).json(
      errorResponse('Failed to create site')
    );
  }
};

/**
 * Get All Sites (with filters)
 * @route GET /api/sites
 */
const getAllSites = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const { offset, limit: queryLimit } = getPagination(page, limit);

    let whereClause = '1=1';
    let params = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      whereClause += ` AND status = $${paramCount}`;
      params.push(status);
    }

    if (search) {
      paramCount++;
      whereClause += ` AND (name ILIKE $${paramCount} OR address ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM sites WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get sites
    const result = await query(
      `SELECT 
         s.*,
         u.name as created_by_name,
         (SELECT COUNT(*) FROM site_users WHERE site_id = s.id) as users_count
       FROM sites s
       LEFT JOIN users u ON s.created_by = u.id
       WHERE ${whereClause}
       ORDER BY s.created_at DESC
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      [...params, queryLimit, offset]
    );

    const sites = result.rows.map(site => ({
      id: site.id,
      name: site.name,
      address: site.address,
      geofence: site.geofence,
      status: site.status,
      startDate: site.start_date,
      endDate: site.end_date,
      budget: site.budget,
      description: site.description,
      createdBy: {
        id: site.created_by,
        name: site.created_by_name
      },
      usersCount: parseInt(site.users_count),
      createdAt: site.created_at,
      updatedAt: site.updated_at
    }));

    res.status(200).json(
      successResponse(
        'Sites retrieved successfully',
        sites,
        getPaginationMeta(total, parseInt(page), parseInt(limit))
      )
    );

  } catch (error) {
    logger.error('Failed to get sites', { error: error.message });
    
    res.status(500).json(
      errorResponse('Failed to retrieve sites')
    );
  }
};

/**
 * Get Site Details
 * @route GET /api/sites/:siteId
 */
const getSiteDetails = async (req, res) => {
  try {
    const { siteId } = req.params;

    const result = await query(
      `SELECT 
         s.*,
         u.name as created_by_name,
         u.email as created_by_email
       FROM sites s
       LEFT JOIN users u ON s.created_by = u.id
       WHERE s.id = $1`,
      [siteId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json(
        errorResponse('Site not found')
      );
    }

    const site = result.rows[0];

    // Get assigned users
    const usersResult = await query(
      `SELECT 
         u.id,
         u.name,
         u.email,
         u.role,
         u.profile_picture,
         su.assigned_at
       FROM site_users su
       JOIN users u ON su.user_id = u.id
       WHERE su.site_id = $1
       ORDER BY u.role, u.name`,
      [siteId]
    );

    res.status(200).json(
      successResponse('Site details retrieved', {
        id: site.id,
        name: site.name,
        address: site.address,
        geofence: site.geofence,
        status: site.status,
        startDate: site.start_date,
        endDate: site.end_date,
        budget: site.budget,
        description: site.description,
        createdBy: {
          id: site.created_by,
          name: site.created_by_name,
          email: site.created_by_email
        },
        assignedUsers: usersResult.rows,
        createdAt: site.created_at,
        updatedAt: site.updated_at
      })
    );

  } catch (error) {
    logger.error('Failed to get site details', { error: error.message });
    
    res.status(500).json(
      errorResponse('Failed to retrieve site details')
    );
  }
};

/**
 * Update Site (Admin)
 * @route PUT /api/sites/:siteId
 */
const updateSite = async (req, res) => {
  try {
    const { siteId } = req.params;
    const {
      name,
      address,
      geofence,
      status,
      startDate,
      endDate,
      budget,
      description
    } = req.body;

    // Check if site exists
    const siteResult = await query(
      'SELECT * FROM sites WHERE id = $1',
      [siteId]
    );

    if (siteResult.rows.length === 0) {
      return res.status(404).json(
        errorResponse('Site not found')
      );
    }

    const site = siteResult.rows[0];

    // Validate geofence if provided
    if (geofence) {
      const geofenceValidation = validateGeofence(geofence);
      if (!geofenceValidation.isValid) {
        return res.status(400).json(
          errorResponse(geofenceValidation.error)
        );
      }
    }

    // Update site
    const updateResult = await query(
      `UPDATE sites 
       SET name = $1,
           address = $2,
           geofence = $3,
           status = $4,
           start_date = $5,
           end_date = $6,
           budget = $7,
           description = $8,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $9
       RETURNING *`,
      [
        name || site.name,
        address || site.address,
        geofence ? JSON.stringify(geofence) : site.geofence,
        status || site.status,
        startDate !== undefined ? startDate : site.start_date,
        endDate !== undefined ? endDate : site.end_date,
        budget !== undefined ? budget : site.budget,
        description !== undefined ? description : site.description,
        siteId
      ]
    );

    logger.info('Site updated', { siteId });

    res.status(200).json(
      successResponse('Site updated successfully', updateResult.rows[0])
    );

  } catch (error) {
    logger.error('Failed to update site', { error: error.message });
    
    res.status(500).json(
      errorResponse('Failed to update site')
    );
  }
};

/**
 * Assign User to Site (Admin/Manager)
 * @route POST /api/sites/:siteId/users
 */
const assignUserToSite = async (req, res) => {
  try {
    const { siteId } = req.params;
    const { userId } = req.body;

    // Check if site exists
    const siteResult = await query(
      'SELECT id FROM sites WHERE id = $1',
      [siteId]
    );

    if (siteResult.rows.length === 0) {
      return res.status(404).json(
        errorResponse('Site not found')
      );
    }

    // Check if user exists
    const userResult = await query(
      'SELECT id, name, email FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json(
        errorResponse('User not found')
      );
    }

    // Check if already assigned
    const existingAssignment = await query(
      'SELECT id FROM site_users WHERE site_id = $1 AND user_id = $2',
      [siteId, userId]
    );

    if (existingAssignment.rows.length > 0) {
      return res.status(400).json(
        errorResponse('User already assigned to this site')
      );
    }

    // Assign user to site
    const result = await query(
      'INSERT INTO site_users (site_id, user_id) VALUES ($1, $2) RETURNING *',
      [siteId, userId]
    );

    logger.info('User assigned to site', { siteId, userId });

    res.status(201).json(
      successResponse('User assigned successfully', {
        siteId: result.rows[0].site_id,
        userId: result.rows[0].user_id,
        assignedAt: result.rows[0].assigned_at
      })
    );

  } catch (error) {
    logger.error('Failed to assign user', { error: error.message });
    
    res.status(500).json(
      errorResponse('Failed to assign user to site')
    );
  }
};

/**
 * Remove User from Site (Admin/Manager)
 * @route DELETE /api/sites/:siteId/users/:userId
 */
const removeUserFromSite = async (req, res) => {
  try {
    const { siteId, userId } = req.params;

    const result = await query(
      'DELETE FROM site_users WHERE site_id = $1 AND user_id = $2 RETURNING *',
      [siteId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json(
        errorResponse('User assignment not found')
      );
    }

    logger.info('User removed from site', { siteId, userId });

    res.status(200).json(
      successResponse('User removed from site successfully')
    );

  } catch (error) {
    logger.error('Failed to remove user', { error: error.message });
    
    res.status(500).json(
      errorResponse('Failed to remove user from site')
    );
  }
};

/**
 * Get My Sites (for current user)
 * @route GET /api/sites/my
 */
const getMySites = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await query(
      `SELECT 
         s.*,
         (SELECT COUNT(*) FROM site_users WHERE site_id = s.id) as users_count
       FROM sites s
       JOIN site_users su ON s.id = su.site_id
       WHERE su.user_id = $1 AND s.status = 'active'
       ORDER BY su.assigned_at DESC`,
      [userId]
    );

    res.status(200).json(
      successResponse('Your sites retrieved successfully', result.rows)
    );

  } catch (error) {
    logger.error('Failed to get my sites', { error: error.message });
    
    res.status(500).json(
      errorResponse('Failed to retrieve sites')
    );
  }
};

/**
 * Delete Site (Admin)
 * @route DELETE /api/sites/:siteId
 */
const deleteSite = async (req, res) => {
  try {
    const { siteId } = req.params;

    // Soft delete - change status to inactive
    const result = await query(
      'UPDATE sites SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      ['inactive', siteId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json(
        errorResponse('Site not found')
      );
    }

    logger.info('Site deleted (soft)', { siteId });

    res.status(200).json(
      successResponse('Site deleted successfully')
    );

  } catch (error) {
    logger.error('Failed to delete site', { error: error.message });
    
    res.status(500).json(
      errorResponse('Failed to delete site')
    );
  }
};

module.exports = {
  createSite,
  getAllSites,
  getSiteDetails,
  updateSite,
  assignUserToSite,
  removeUserFromSite,
  getMySites,
  deleteSite
};
