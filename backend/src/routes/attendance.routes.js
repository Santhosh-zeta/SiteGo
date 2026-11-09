const express = require('express');
const router = express.Router();
const {
  checkIn,
  checkOut,
  getTodayAttendance,
  getAttendanceHistory,
  getSiteAttendance
} = require('../controllers/attendance.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { checkRole, isSupervisorOrAbove } = require('../middleware/rbac.middleware');
const { validateBody, validateParams, schemas } = require('../utils/validation.util');

/**
 * @route   POST /api/attendance/check-in
 * @desc    Check in to site
 * @access  Private (Worker, Supervisor, Manager)
 */
router.post('/check-in', authMiddleware, validateBody(schemas.checkIn), checkIn);

/**
 * @route   POST /api/attendance/check-out
 * @desc    Check out from site
 * @access  Private (Worker, Supervisor, Manager)
 */
router.post('/check-out', authMiddleware, validateBody(schemas.checkOut), checkOut);

/**
 * @route   GET /api/attendance/today
 * @desc    Get today's attendance status
 * @access  Private (Worker, Supervisor, Manager)
 */
router.get('/today', authMiddleware, getTodayAttendance);

/**
 * @route   GET /api/attendance/history
 * @desc    Get attendance history
 * @access  Private (Worker, Supervisor, Manager)
 */
router.get('/history', authMiddleware, validateParams(schemas.pagination), getAttendanceHistory);

/**
 * @route   GET /api/attendance/site/:siteId
 * @desc    Get site attendance for a specific date
 * @access  Private (Supervisor, Manager, Admin)
 */
router.get('/site/:siteId', authMiddleware, isSupervisorOrAbove, validateParams(schemas.id), getSiteAttendance);

module.exports = router;
