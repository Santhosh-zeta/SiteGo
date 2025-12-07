const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserRole,
  updateUserStatus,
  deleteUser,
  getUsersByRole,
  getUserStats
} = require('../controllers/user.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { checkRole, isAdmin, isManagerOrAdmin, canManageUser } = require('../middleware/rbac.middleware');
const { validateBody, validateParams, schemas } = require('../utils/validation.util');

/**
 * @route   GET /api/users
 * @desc    Get all users with filters
 * @access  Private (Admin)
 */
router.get('/', authMiddleware, isAdmin, getAllUsers);

/**
 * @route   GET /api/users/stats
 * @desc    Get user statistics
 * @access  Private (Admin)
 */
router.get('/stats', authMiddleware, isAdmin, getUserStats);

/**
 * @route   GET /api/users/role/:role
 * @desc    Get users by role
 * @access  Private (Manager, Admin)
 */
router.get('/role/:role', authMiddleware, isManagerOrAdmin, getUsersByRole);

/**
 * @route   POST /api/users
 * @desc    Create new user
 * @access  Private (Admin)
 */
router.post('/', authMiddleware, isAdmin, validateBody(schemas.register), createUser);

/**
 * @route   GET /api/users/:userId
 * @desc    Get user by ID
 * @access  Private (Manager, Admin, Self)
 */
router.get('/:userId', authMiddleware, validateParams(schemas.id), getUserById);

/**
 * @route   PUT /api/users/:userId
 * @desc    Update user details
 * @access  Private (Admin, Self for own profile)
 */
router.put('/:userId', authMiddleware, validateParams(schemas.id), updateUser);

/**
 * @route   PUT /api/users/:userId/role
 * @desc    Update user role
 * @access  Private (Admin)
 */
router.put('/:userId/role', authMiddleware, isAdmin, validateParams(schemas.id), canManageUser, updateUserRole);

/**
 * @route   PUT /api/users/:userId/status
 * @desc    Update user status
 * @access  Private (Admin)
 */
router.put('/:userId/status', authMiddleware, isAdmin, validateParams(schemas.id), updateUserStatus);

/**
 * @route   DELETE /api/users/:userId
 * @desc    Delete user (soft delete)
 * @access  Private (Admin)
 */
router.delete('/:userId', authMiddleware, isAdmin, validateParams(schemas.id), deleteUser);

module.exports = router;
