const express = require('express');
const router = express.Router();
const {
  analyzeQuality,
  getQualityChecks,
  getQualityStats,
  getAIModelInfo
} = require('../controllers/ai.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { isSupervisorOrAbove } = require('../middleware/rbac.middleware');
const { validateParams, schemas } = require('../utils/validation.util');

/**
 * @route   POST /api/ai/analyze
 * @desc    Analyze image for quality defects
 * @access  Private (Supervisor, Manager, Admin)
 */
router.post('/analyze', authMiddleware, isSupervisorOrAbove, analyzeQuality);

/**
 * @route   GET /api/ai/quality-checks/:siteId
 * @desc    Get quality check history for site
 * @access  Private (Supervisor, Manager, Admin)
 */
router.get('/quality-checks/:siteId', authMiddleware, isSupervisorOrAbove, validateParams(schemas.id), getQualityChecks);

/**
 * @route   GET /api/ai/stats/:siteId
 * @desc    Get quality statistics for site
 * @access  Private (Supervisor, Manager, Admin)
 */
router.get('/stats/:siteId', authMiddleware, isSupervisorOrAbove, validateParams(schemas.id), getQualityStats);

/**
 * @route   GET /api/ai/model-info
 * @desc    Get AI model information
 * @access  Private (All roles)
 */
router.get('/model-info', authMiddleware, getAIModelInfo);

module.exports = router;
