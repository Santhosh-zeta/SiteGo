/**
 * Logger Utility
 * Centralized logging for the application
 */

const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Log levels
const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

// Colors for console output
const COLORS = {
  ERROR: '\x1b[31m', // Red
  WARN: '\x1b[33m',  // Yellow
  INFO: '\x1b[36m',  // Cyan
  DEBUG: '\x1b[35m', // Magenta
  RESET: '\x1b[0m'
};

/**
 * Format log message
 */
const formatMessage = (level, message, meta = {}) => {
  const timestamp = new Date().toISOString();
  const metaString = Object.keys(meta).length > 0 ? JSON.stringify(meta) : '';
  
  return `[${timestamp}] [${level}] ${message} ${metaString}`;
};

/**
 * Write log to file
 */
const writeToFile = (level, message, meta) => {
  const logFile = path.join(logsDir, `${level.toLowerCase()}.log`);
  const logMessage = formatMessage(level, message, meta) + '\n';

  fs.appendFile(logFile, logMessage, (err) => {
    if (err) console.error('Failed to write log:', err);
  });

  // Also write to combined log
  const combinedLog = path.join(logsDir, 'combined.log');
  fs.appendFile(combinedLog, logMessage, () => {});
};

/**
 * Log to console
 */
const logToConsole = (level, message, meta) => {
  const color = COLORS[level] || COLORS.RESET;
  const formattedMessage = formatMessage(level, message, meta);
  
  console.log(`${color}${formattedMessage}${COLORS.RESET}`);
};

/**
 * Main logger object
 */
const logger = {
  /**
   * Log error messages
   */
  error: (message, meta = {}) => {
    logToConsole(LOG_LEVELS.ERROR, message, meta);
    writeToFile(LOG_LEVELS.ERROR, message, meta);
  },

  /**
   * Log warning messages
   */
  warn: (message, meta = {}) => {
    logToConsole(LOG_LEVELS.WARN, message, meta);
    writeToFile(LOG_LEVELS.WARN, message, meta);
  },

  /**
   * Log info messages
   */
  info: (message, meta = {}) => {
    logToConsole(LOG_LEVELS.INFO, message, meta);
    writeToFile(LOG_LEVELS.INFO, message, meta);
  },

  /**
   * Log debug messages (only in development)
   */
  debug: (message, meta = {}) => {
    if (process.env.NODE_ENV === 'development') {
      logToConsole(LOG_LEVELS.DEBUG, message, meta);
      writeToFile(LOG_LEVELS.DEBUG, message, meta);
    }
  },

  /**
   * Log HTTP requests
   */
  http: (req, res, duration) => {
    const message = `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`;
    const meta = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent')
    };

    if (res.statusCode >= 400) {
      logger.error(message, meta);
    } else {
      logger.info(message, meta);
    }
  },

  /**
   * Log database queries
   */
  query: (sql, duration, rows) => {
    const message = `Query executed in ${duration}ms, affected ${rows} rows`;
    const meta = {
      sql: sql.substring(0, 100) + '...',
      duration: `${duration}ms`,
      rows
    };
    
    logger.debug(message, meta);
  }
};

/**
 * Express middleware for request logging
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();

  // Log when response finishes
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.http(req, res, duration);
  });

  next();
};

/**
 * Clear old log files (optional utility)
 */
const clearOldLogs = (daysToKeep = 7) => {
  const files = fs.readdirSync(logsDir);
  const now = Date.now();
  const maxAge = daysToKeep * 24 * 60 * 60 * 1000;

  files.forEach(file => {
    const filePath = path.join(logsDir, file);
    const stats = fs.statSync(filePath);
    const age = now - stats.mtime.getTime();

    if (age > maxAge) {
      fs.unlinkSync(filePath);
      console.log(`Deleted old log file: ${file}`);
    }
  });
};

module.exports = {
  logger,
  requestLogger,
  clearOldLogs
};
