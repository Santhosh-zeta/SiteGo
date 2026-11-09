const express = require('express');
const router = express.Router();
const {
  createDailyReport,
  updateDailyReport,
  getSiteReports,
  approveReport,
  rejectReport,
  getMyReports
} = require('../controllers/report.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { checkRole, isSupervisorOrAbove, isManagerOrAdmin } = require('../middleware/rbac.middleware');
const { validateBody, validateParams, schemas } = require('../utils/validation.util');

/**
 * @route   POST /api/reports/daily
 * @desc    Create daily work report
 * @access  Private (Supervisor, Manager, Admin)
 */
router.post('/daily', authMiddleware, isSupervisorOrAbove, validateBody(schemas.dailyReport), createDailyReport);

/**
 * @route   PUT /api/reports/daily/:reportId
 * @desc    Update daily report
 * @access  Private (Supervisor - own reports only)
 */
router.put('/daily/:reportId', authMiddleware, isSupervisorOrAbove, validateParams(schemas.id), updateDailyReport);

/**
 * @route   GET /api/reports/site/:siteId
 * @desc    Get all reports for a site
 * @access  Private (Supervisor, Manager, Admin)
 */
router.get('/site/:siteId', authMiddleware, isSupervisorOrAbove, validateParams(schemas.id), getSiteReports);

/**
 * @route   GET /api/reports/my
 * @desc    Get my reports
 * @access  Private (Supervisor)
 */
router.get('/my', authMiddleware, checkRole(['supervisor']), getMyReports);

/**
 * @route   POST /api/reports/:reportId/approve
 * @desc    Approve daily report
 * @access  Private (Manager, Admin)
 */
router.post('/:reportId/approve', authMiddleware, isManagerOrAdmin, validateParams(schemas.id), approveReport);

/**
 * @route   POST /api/reports/:reportId/reject
 * @desc    Reject daily report
 * @access  Private (Manager, Admin)
 */
router.post('/:reportId/reject', authMiddleware, isManagerOrAdmin, validateParams(schemas.id), rejectReport);

module.exports = router;
