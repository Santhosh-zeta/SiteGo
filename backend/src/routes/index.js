const express = require('express');
const router = express.Router();

// Import all route modules
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const siteRoutes = require('./site.routes');
const attendanceRoutes = require('./attendance.routes');
const materialRoutes = require('./material.routes');
const reportRoutes = require('./report.routes');
const issueRoutes = require('./issue.routes');
const aiRoutes = require('./ai.routes');

/**
 * Mount all routes
 */
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/sites', siteRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/materials', materialRoutes);
router.use('/reports', reportRoutes);
router.use('/issues', issueRoutes);
router.use('/ai', aiRoutes);

/**
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'SiteGo API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

/**
 * API info endpoint
 */
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to SiteGo API',
    version: '1.0.0',
    documentation: '/api/docs',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      sites: '/api/sites',
      attendance: '/api/attendance',
      materials: '/api/materials',
      reports: '/api/reports',
      issues: '/api/issues',
      ai: '/api/ai',
      health: '/api/health'
    }
  });
});

module.exports = router;
