/**
 * Global Error Handling Middleware
 * Catches all errors and sends appropriate response
 */

/**
 * Custom Error Class
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error Handler Middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for debugging
  console.error('❌ Error:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method
  });

  // PostgreSQL errors
  if (err.code === '23505') {
    // Duplicate key error
    const field = err.detail?.match(/\(([^)]+)\)/)?.[1] || 'field';
    error = new AppError(`Duplicate value for ${field}`, 400);
  }

  if (err.code === '23503') {
    // Foreign key violation
    error = new AppError('Referenced resource not found', 404);
  }

  if (err.code === '23502') {
    // Not null violation
    const field = err.column || 'field';
    error = new AppError(`${field} is required`, 400);
  }

  if (err.code === '22P02') {
    // Invalid text representation
    error = new AppError('Invalid data format', 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid token', 401);
  }

  if (err.name === 'TokenExpiredError') {
    error = new AppError('Token expired', 401);
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    error = new AppError(messages.join(', '), 400);
  }

  // Multer file upload errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      error = new AppError('File size too large', 400);
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      error = new AppError('Too many files uploaded', 400);
    } else {
      error = new AppError('File upload error', 400);
    }
  }

  // Default error response
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message: message,
    error: process.env.NODE_ENV === 'development' ? {
      statusCode,
      stack: err.stack,
      details: err
    } : undefined
  });
};

/**
 * 404 Not Found Handler
 */
const notFoundHandler = (req, res, next) => {
  const error = new AppError(
    `Route not found: ${req.method} ${req.originalUrl}`,
    404
  );
  next(error);
};

/**
 * Async Handler Wrapper
 * Wraps async functions to catch errors
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  AppError,
  errorHandler,
  notFoundHandler,
  asyncHandler
};
