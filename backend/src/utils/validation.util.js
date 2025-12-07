const Joi = require('joi');

/**
 * Validation Utility Functions
 */

/**
 * Validate request body against schema
 * @param {Object} schema - Joi validation schema
 * @returns {Function} Express middleware
 */
const validateBody = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    req.body = value;
    next();
  };
};

/**
 * Validate query parameters
 */
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Query validation failed',
        errors
      });
    }

    req.query = value;
    next();
  };
};

/**
 * Validate params
 */
const validateParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Parameter validation failed',
        errors
      });
    }

    req.params = value;
    next();
  };
};

// Common validation schemas
const schemas = {
  // ID parameter validation
  id: Joi.object({
    id: Joi.number().integer().positive().required()
  }),

  // Pagination
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  }),

  // Date range
  dateRange: Joi.object({
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).optional()
  }),

  // Location
  location: Joi.object({
    lat: Joi.number().min(-90).max(90).required(),
    lng: Joi.number().min(-180).max(180).required()
  }),

  // User registration
  register: Joi.object({
    email: Joi.string().email().required(),
    name: Joi.string().min(2).max(255).required(),
    phone: Joi.string().pattern(/^[0-9]{10}$/).optional(),
    role: Joi.string().valid('worker', 'supervisor', 'manager', 'admin').default('worker')
  }),

  // Google OAuth
  googleAuth: Joi.object({
    token: Joi.string().required()
  }),

  // Refresh token
  refreshToken: Joi.object({
    refreshToken: Joi.string().required()
  }),

  // Site creation
  createSite: Joi.object({
    name: Joi.string().min(3).max(255).required(),
    address: Joi.string().min(10).required(),
    geofence: Joi.array().items(
      Joi.object({
        lat: Joi.number().min(-90).max(90).required(),
        lng: Joi.number().min(-180).max(180).required()
      })
    ).min(3).required(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
    budget: Joi.number().positive().optional(),
    description: Joi.string().max(1000).optional()
  }),

  // Attendance check-in
  checkIn: Joi.object({
    siteId: Joi.number().integer().positive().required(),
    location: Joi.object({
      lat: Joi.number().min(-90).max(90).required(),
      lng: Joi.number().min(-180).max(180).required()
    }).required()
  }),

  // Attendance check-out
  checkOut: Joi.object({
    attendanceId: Joi.number().integer().positive().required(),
    location: Joi.object({
      lat: Joi.number().min(-90).max(90).required(),
      lng: Joi.number().min(-180).max(180).required()
    }).required()
  }),

  // Material scan
  materialScan: Joi.object({
    siteId: Joi.number().integer().positive().required(),
    materialId: Joi.number().integer().positive().required(),
    quantity: Joi.number().positive().required(),
    logType: Joi.string().valid('received', 'used', 'moved', 'returned').required(),
    notes: Joi.string().max(500).optional()
  }),

  // Daily report
  dailyReport: Joi.object({
    siteId: Joi.number().integer().positive().required(),
    reportDate: Joi.date().iso().required(),
    workSummary: Joi.string().min(10).max(2000).required(),
    workCategory: Joi.string().max(100).optional(),
    workersCount: Joi.number().integer().min(0).optional(),
    materialsUsed: Joi.array().items(
      Joi.object({
        materialId: Joi.number().integer().positive().required(),
        quantity: Joi.number().positive().required()
      })
    ).optional(),
    issuesFaced: Joi.string().max(1000).optional()
  }),

  // Issue reporting
  createIssue: Joi.object({
    siteId: Joi.number().integer().positive().required(),
    title: Joi.string().min(5).max(255).required(),
    description: Joi.string().max(2000).optional(),
    priority: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium'),
    assignedTo: Joi.number().integer().positive().optional(),
    location: Joi.object({
      lat: Joi.number().min(-90).max(90).required(),
      lng: Joi.number().min(-180).max(180).required()
    }).optional()
  }),

  // Update issue status
  updateIssueStatus: Joi.object({
    status: Joi.string().valid('open', 'in_progress', 'resolved', 'closed').required(),
    resolutionNotes: Joi.string().max(1000).optional()
  }),

  // Task creation
  createTask: Joi.object({
    siteId: Joi.number().integer().positive().required(),
    assignedTo: Joi.number().integer().positive().required(),
    title: Joi.string().min(5).max(255).required(),
    description: Joi.string().max(2000).optional(),
    priority: Joi.string().valid('low', 'medium', 'high').default('medium'),
    dueDate: Joi.date().iso().min('now').optional()
  })
};

module.exports = {
  validateBody,
  validateQuery,
  validateParams,
  schemas
};
