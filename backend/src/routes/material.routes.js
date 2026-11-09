const express = require('express');
const router = express.Router();
const {
  createMaterialMaster,
  getAllMaterials,
  scanMaterial,
  getSiteInventory,
  getMaterialLogs,
  getMaterialCategories
} = require('../controllers/material.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { checkRole, isAdmin, isSupervisorOrAbove } = require('../middleware/rbac.middleware');
const { validateBody, validateParams, schemas } = require('../utils/validation.util');

/**
 * @route   POST /api/materials/master
 * @desc    Create material master data
 * @access  Private (Admin)
 */
router.post('/master', authMiddleware, isAdmin, createMaterialMaster);

/**
 * @route   GET /api/materials/master
 * @desc    Get all materials
 * @access  Private (All roles)
 */
router.get('/master', authMiddleware, getAllMaterials);

/**
 * @route   GET /api/materials/categories
 * @desc    Get material categories
 * @access  Private (All roles)
 */
router.get('/categories', authMiddleware, getMaterialCategories);

/**
 * @route   POST /api/materials/scan
 * @desc    Scan material QR code and log transaction
 * @access  Private (Supervisor, Manager, Admin)
 */
router.post('/scan', authMiddleware, isSupervisorOrAbove, validateBody(schemas.materialScan), scanMaterial);

/**
 * @route   GET /api/materials/inventory/:siteId
 * @desc    Get site material inventory
 * @access  Private (Supervisor, Manager, Admin)
 */
router.get('/inventory/:siteId', authMiddleware, isSupervisorOrAbove, validateParams(schemas.id), getSiteInventory);

/**
 * @route   GET /api/materials/logs/:siteId
 * @desc    Get material transaction logs
 * @access  Private (Supervisor, Manager, Admin)
 */
router.get('/logs/:siteId', authMiddleware, isSupervisorOrAbove, validateParams(schemas.id), getMaterialLogs);

module.exports = router;
