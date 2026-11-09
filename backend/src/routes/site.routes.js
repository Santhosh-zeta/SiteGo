const express = require('express');
const router = express.Router();
const {
  createSite,
  getAllSites,
  getSiteDetails,
  updateSite,
  assignUserToSite,
  removeUserFromSite,
  getMySites,
  deleteSite
} = require('../controllers/site.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { checkRole, isAdmin, isManagerOrAdmin } = require('../middleware/rbac.middleware');
const { validateBody, validateParams, schemas } = require('../utils/validation.util');

/**
 * @route   POST /api/sites
 * @desc    Create new site
 * @access  Private (Admin)
 */
router.post('/', authMiddleware, isAdmin, validateBody(schemas.createSite), createSite);

/**
 * @route   GET /api/sites
 * @desc    Get all sites with filters
 * @access  Private (Manager, Admin)
 */
router.get('/', authMiddleware, isManagerOrAdmin, getAllSites);

/**
 * @route   GET /api/sites/my
 * @desc    Get sites assigned to current user
 * @access  Private (All roles)
 */
router.get('/my', authMiddleware, getMySites);

/**
 * @route   GET /api/sites/:siteId
 * @desc    Get site details
 * @access  Private (Supervisor, Manager, Admin)
 */
router.get('/:siteId', authMiddleware, validateParams(schemas.id), getSiteDetails);

/**
 * @route   PUT /api/sites/:siteId
 * @desc    Update site details
 * @access  Private (Admin)
 */
router.put('/:siteId', authMiddleware, isAdmin, validateParams(schemas.id), updateSite);

/**
 * @route   POST /api/sites/:siteId/users
 * @desc    Assign user to site
 * @access  Private (Manager, Admin)
 */
router.post('/:siteId/users', authMiddleware, isManagerOrAdmin, validateParams(schemas.id), assignUserToSite);

/**
 * @route   DELETE /api/sites/:siteId/users/:userId
 * @desc    Remove user from site
 * @access  Private (Manager, Admin)
 */
router.delete('/:siteId/users/:userId', authMiddleware, isManagerOrAdmin, removeUserFromSite);

/**
 * @route   DELETE /api/sites/:siteId
 * @desc    Delete site (soft delete)
 * @access  Private (Admin)
 */
router.delete('/:siteId', authMiddleware, isAdmin, validateParams(schemas.id), deleteSite);

module.exports = router;
