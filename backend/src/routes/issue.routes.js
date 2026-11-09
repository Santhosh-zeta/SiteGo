const express = require('express');
const router = express.Router();
const {
  createIssue,
  getSiteIssues,
  getIssueDetails,
  updateIssueStatus,
  addComment,
  assignIssue,
  getMyIssues
} = require('../controllers/issue.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { checkRole, isSupervisorOrAbove, isManagerOrAdmin } = require('../middleware/rbac.middleware');
const { validateBody, validateParams, schemas } = require('../utils/validation.util');

/**
 * @route   POST /api/issues
 * @desc    Create/report new issue
 * @access  Private (All roles)
 */
router.post('/', authMiddleware, validateBody(schemas.createIssue), createIssue);

/**
 * @route   GET /api/issues/site/:siteId
 * @desc    Get all issues for a site
 * @access  Private (Supervisor, Manager, Admin)
 */
router.get('/site/:siteId', authMiddleware, isSupervisorOrAbove, validateParams(schemas.id), getSiteIssues);

/**
 * @route   GET /api/issues/my
 * @desc    Get issues assigned to me
 * @access  Private (All roles)
 */
router.get('/my', authMiddleware, getMyIssues);

/**
 * @route   GET /api/issues/:issueId
 * @desc    Get issue details with comments
 * @access  Private (All roles)
 */
router.get('/:issueId', authMiddleware, validateParams(schemas.id), getIssueDetails);

/**
 * @route   PUT /api/issues/:issueId/status
 * @desc    Update issue status
 * @access  Private (Supervisor, Manager, Admin)
 */
router.put('/:issueId/status', authMiddleware, isSupervisorOrAbove, validateParams(schemas.id), validateBody(schemas.updateIssueStatus), updateIssueStatus);

/**
 * @route   POST /api/issues/:issueId/comments
 * @desc    Add comment to issue
 * @access  Private (All roles)
 */
router.post('/:issueId/comments', authMiddleware, validateParams(schemas.id), addComment);

/**
 * @route   PUT /api/issues/:issueId/assign
 * @desc    Assign issue to user
 * @access  Private (Manager, Admin)
 */
router.put('/:issueId/assign', authMiddleware, isManagerOrAdmin, validateParams(schemas.id), assignIssue);

module.exports = router;
