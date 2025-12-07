const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const routes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middleware/error.middleware');
const { requestLogger } = require('./utils/logger.util');

// Create Express app
const app = express();

/**
 * Security Middleware
 * Helmet helps secure Express apps by setting various HTTP headers
 */
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

/**
 * CORS Configuration
 * Allow cross-origin requests from frontend
 */
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:19006', // Expo default
      'http://localhost:19000', // Expo alternative
      'http://localhost:3000',  // React dev server
      'http://localhost:8081',  // React Native metro
    ].filter(Boolean);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

/**
 * Body Parser Middleware
 * Parse incoming request bodies in JSON and URL-encoded format
 */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * HTTP Request Logging
 */
if (process.env.NODE_ENV === 'development') {
  // Detailed logging in development
  app.use(morgan('dev'));
}

// Custom request logger (logs to file)
app.use(requestLogger);

/**
 * Request Timestamp
 * Add timestamp to all requests
 */
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

/**
 * Request ID
 * Add unique ID to each request for tracking
 */
app.use((req, res, next) => {
  req.id = Math.random().toString(36).substring(7);
  res.setHeader('X-Request-ID', req.id);
  next();
});

/**
 * API Routes
 * All API endpoints are prefixed with /api
 */
app.use('/api', routes);

/**
 * Root Endpoint
 * Basic info about the API
 */
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'SiteGo Backend API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      docs: '/api',
      auth: '/api/auth',
      users: '/api/users',
      sites: '/api/sites',
      attendance: '/api/attendance',
      materials: '/api/materials',
      reports: '/api/reports',
      issues: '/api/issues',
      ai: '/api/ai'
    },
    environment: process.env.NODE_ENV || 'development'
  });
});

/**
 * Ping Endpoint
 * Simple health check without database
 */
app.get('/ping', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'pong',
    timestamp: new Date().toISOString()
  });
});

/**
 * 404 Handler
 * Must be after all routes
 */
app.use(notFoundHandler);

/**
 * Global Error Handler
 * Must be last middleware
 */
app.use(errorHandler);

module.exports = app;
