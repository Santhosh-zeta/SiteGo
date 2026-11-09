const { query, transaction } = require('../config/database');
const { successResponse, errorResponse, getPagination, getPaginationMeta, formatDate } = require('../utils/helper.util');
const { logger } = require('../utils/logger.util');

/**
 * Create Daily Report (Supervisor)
 * @route POST /api/reports/daily
 */
const createDailyReport = async (req, res) => {
  try {
    const {
      siteId,
      reportDate,
      workSummary,
      workCategory,
      workersCount,
      materialsUsed,
      photos,
      issuesFaced
    } = req.body;

    const supervisorId = req.user.id;

    // Check if report already exists for this date and supervisor
    const existingReport = await query(
      'SELECT id FROM daily_reports WHERE site_id = $1 AND report_date = $2 AND supervisor_id = $3',
      [siteId, reportDate, supervisorId]
    );

    if (existingReport.rows.length > 0) {
      return res.status(400).json(
        errorResponse('Report already submitted for this date')
      );
    }

    // Create report
    const result = await query(
      `INSERT INTO daily_reports 
       (site_id, supervisor_id, report_date, work_summary, work_category, 
        workers_count, materials_used, photos, issues_faced, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        siteId,
        supervisorId,
        reportDate,
        workSummary,
        workCategory || null,
        workersCount || 0,
        JSON.stringify(materialsUsed || []),
        JSON.stringify(photos || []),
        issuesFaced || null,
        'pending'
      ]
    );

    const report = result.rows[0];

    logger.info('Daily report created', {
      reportId: report.id,
      siteId,
      supervisorId
    });

    res.status(201).json(
      successResponse('Report submitted successfully', {
        id: report.id,
        siteId: report.site_id,
        supervisorId: report.supervisor_id,
        reportDate: report.report_date,
        workSummary: report.work_summary,
        workCategory: report.work_category,
        workersCount: report.workers_count,
        materialsUsed: report.materials_used,
        photos: report.photos,
        issuesFaced: report.issues_faced,
        status: report.status,
        createdAt: report.created_at
      })
    );

  } catch (error) {
    logger.error('Failed to create report', { error: error.message });
    
    res.status(500).json(
      errorResponse('Failed to submit report')
    );
  }
};

/**
 * Update Daily Report (Supervisor)
 * @route PUT /api/reports/daily/:reportId
 */
const updateDailyReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const {
      workSummary,
      workCategory,
      workersCount,
      materialsUsed,
      photos,
      issuesFaced
    } = req.body;

    const supervisorId = req.user.id;

    // Check if report exists and belongs to this supervisor
    const reportResult = await query(
      'SELECT * FROM daily_reports WHERE id = $1 AND supervisor_id = $2',
      [reportId, supervisorId]
    );

    if (reportResult.rows.length === 0) {
      return res.status(404).json(
        errorResponse('Report not found or access denied')
      );
    }

    const report = reportResult.rows[0];

    // Check if already approved
    if (report.status === 'approved') {
      return res.status(400).json(
        errorResponse('Cannot edit approved report')
      );
    }

    // Update report
    const updateResult = await query(
      `UPDATE daily_reports 
       SET work_summary = $1,
           work_category = $2,
           workers_count = $3,
           materials_used = $4,
           photos = $5,
           issues_faced = $6,
           status = 'pending',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [
        workSummary || report.work_summary,
        workCategory || report.work_category,
        workersCount !== undefined ? workersCount : report.workers_count,
        materialsUsed ? JSON.stringify(materialsUsed) : report.materials_used,
        photos ? JSON.stringify(photos) : report.photos,
        issuesFaced !== undefined ? issuesFaced : report.issues_faced,
        reportId
      ]
    );

    const updatedReport = updateResult.rows[0];

    logger.info('Daily report updated', { reportId });

    res.status(200).json(
      successResponse('Report updated successfully', {
        id: updatedReport.id,
        workSummary: updatedReport.work_summary,
        workCategory: updatedReport.work_category,
        workersCount: updatedReport.workers_count,
        materialsUsed: updatedReport.materials_used,
        photos: updatedReport.photos,
        issuesFaced: updatedReport.issues_faced,
        status: updatedReport.status,
        updatedAt: updatedReport.updated_at
      })
    );

  } catch (error) {
    logger.error('Failed to update report', { error: error.message });
    
    res.status(500).json(
      errorResponse('Failed to update report')
    );
  }
};

/**
 * Get Site Reports (Manager/Supervisor)
 * @route GET /api/reports/site/:siteId
 */
const getSiteReports = async (req, res) => {
  try {
    const { siteId } = req.params;
    const { page = 1, limit = 20, status, startDate, endDate } = req.query;
    const { offset, limit: queryLimit } = getPagination(page, limit);

    let whereClause = 'r.site_id = $1';
    let params = [siteId];
    let paramCount = 1;

    if (status) {
      paramCount++;
      whereClause += ` AND r.status = $${paramCount}`;
      params.push(status);
    }

    if (startDate) {
      paramCount++;
      whereClause += ` AND r.report_date >= $${paramCount}`;
      params.push(startDate);
    }

    if (endDate) {
      paramCount++;
      whereClause += ` AND r.report_date <= $${paramCount}`;
      params.push(endDate);
    }

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM daily_reports r WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get reports
    const result = await query(
      `SELECT 
         r.*,
         u.name as supervisor_name,
         u.email as supervisor_email,
         a.name as approved_by_name
       FROM daily_reports r
       LEFT JOIN users u ON r.supervisor_id = u.id
       LEFT JOIN users a ON r.approved_by = a.id
       WHERE ${whereClause}
       ORDER BY r.report_date DESC, r.created_at DESC
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      [...params, queryLimit, offset]
    );

    const reports = result.rows.map(report => ({
      id: report.id,
      siteId: report.site_id,
      supervisor: {
        id: report.supervisor_id,
        name: report.supervisor_name,
        email: report.supervisor_email
      },
      reportDate: report.report_date,
      workSummary: report.work_summary,
      workCategory: report.work_category,
      workersCount: report.workers_count,
      materialsUsed: report.materials_used,
      photos: report.photos,
      issuesFaced: report.issues_faced,
      status: report.status,
      approvedBy: report.approved_by ? {
        id: report.approved_by,
        name: report.approved_by_name
      } : null,
      approvedAt: report.approved_at,
      createdAt: report.created_at,
      updatedAt: report.updated_at
    }));

    res.status(200).json(
      successResponse(
        'Reports retrieved successfully',
        reports,
        getPaginationMeta(total, parseInt(page), parseInt(limit))
      )
    );

  } catch (error) {
    logger.error('Failed to get site reports', { error: error.message });
    
    res.status(500).json(
      errorResponse('Failed to retrieve reports')
    );
  }
};

/**
 * Approve Report (Manager)
 * @route POST /api/reports/:reportId/approve
 */
const approveReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const managerId = req.user.id;

    // Get report
    const reportResult = await query(
      'SELECT * FROM daily_reports WHERE id = $1',
      [reportId]
    );

    if (reportResult.rows.length === 0) {
      return res.status(404).json(
        errorResponse('Report not found')
      );
    }

    const report = reportResult.rows[0];

    if (report.status === 'approved') {
      return res.status(400).json(
        errorResponse('Report already approved')
      );
    }

    // Update report status
    const updateResult = await query(
      `UPDATE daily_reports 
       SET status = 'approved',
           approved_by = $1,
           approved_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [managerId, reportId]
    );

    logger.info('Report approved', { reportId, managerId });

    res.status(200).json(
      successResponse('Report approved successfully', {
        id: updateResult.rows[0].id,
        status: updateResult.rows[0].status,
        approvedBy: managerId,
        approvedAt: updateResult.rows[0].approved_at
      })
    );

  } catch (error) {
    logger.error('Failed to approve report', { error: error.message });
    
    res.status(500).json(
      errorResponse('Failed to approve report')
    );
  }
};

/**
 * Reject Report (Manager)
 * @route POST /api/reports/:reportId/reject
 */
const rejectReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { rejectionReason } = req.body;
    const managerId = req.user.id;

    if (!rejectionReason) {
      return res.status(400).json(
        errorResponse('Rejection reason is required')
      );
    }

    // Update report status
    const updateResult = await query(
      `UPDATE daily_reports 
       SET status = 'rejected',
           rejection_reason = $1,
           approved_by = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [rejectionReason, managerId, reportId]
    );

    if (updateResult.rows.length === 0) {
      return res.status(404).json(
        errorResponse('Report not found')
      );
    }

    logger.info('Report rejected', { reportId, managerId });

    res.status(200).json(
      successResponse('Report rejected', {
        id: updateResult.rows[0].id,
        status: updateResult.rows[0].status,
        rejectionReason: updateResult.rows[0].rejection_reason
      })
    );

  } catch (error) {
    logger.error('Failed to reject report', { error: error.message });
    
    res.status(500).json(
      errorResponse('Failed to reject report')
    );
  }
};

/**
 * Get My Reports (Supervisor)
 * @route GET /api/reports/my
 */
const getMyReports = async (req, res) => {
  try {
    const supervisorId = req.user.id;
    const { page = 1, limit = 20, status } = req.query;
    const { offset, limit: queryLimit } = getPagination(page, limit);

    let whereClause = 'supervisor_id = $1';
    let params = [supervisorId];

    if (status) {
      whereClause += ' AND status = $2';
      params.push(status);
    }

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM daily_reports WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get reports
    const result = await query(
      `SELECT * FROM daily_reports
       WHERE ${whereClause}
       ORDER BY report_date DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, queryLimit, offset]
    );

    res.status(200).json(
      successResponse(
        'Your reports retrieved successfully',
        result.rows,
        getPaginationMeta(total, parseInt(page), parseInt(limit))
      )
    );

  } catch (error) {
    logger.error('Failed to get my reports', { error: error.message });
    
    res.status(500).json(
      errorResponse('Failed to retrieve reports')
    );
  }
};

module.exports = {
  createDailyReport,
  updateDailyReport,
  getSiteReports,
  approveReport,
  rejectReport,
  getMyReports
};
