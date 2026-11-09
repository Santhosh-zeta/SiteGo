#!/usr/bin/env node

/**
 * SiteGo Backend Server
 * Construction Site Monitoring & Management System
 */

const app = require('./src/app');
const http = require('http');
const { logger } = require('./src/utils/logger.util');
require('dotenv').config();

// Validate critical environment variables
const requiredEnvVars = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
  console.error('💡 Please check your .env file');
  process.exit(1);
}

// Create HTTP server
const server = http.createServer(app);

// Get port from environment or use default
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

/**
 * Normalize port into a number, string, or false
 */
function normalizePort(val) {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    return val; // named pipe
  }

  if (port >= 0) {
    return port; // port number
  }

  return false;
}

const port = normalizePort(PORT);
app.set('port', port);

/**
 * Start server
 */
const startServer = () => {
  try {
    server.listen(port, HOST, () => {
      console.log('\n' + '='.repeat(60));
      console.log('🚀 SiteGo Backend Server Started Successfully');
      console.log('='.repeat(60));
      console.log(`📍 Environment     : ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 Server URL      : http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${port}`);
      console.log(`🔗 API Base URL    : http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${port}/api`);
      console.log(`💚 Health Check    : http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${port}/api/health`);
      console.log(`📊 Status          : Ready to accept connections`);
      console.log(`⏰ Started at      : ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`);
      console.log(`🔧 Node Version    : ${process.version}`);
      console.log(`💾 Memory Usage    : ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`);
      console.log('='.repeat(60) + '\n');
      
      logger.info('🚀 SiteGo Backend Server Started');
      logger.info(`Server running on ${HOST}:${port}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

/**
 * Event listener for HTTP server "error" event
 */
server.on('error', (error) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

  switch (error.code) {
    case 'EACCES':
      console.error(`❌ ${bind} requires elevated privileges`);
      logger.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    
    case 'EADDRINUSE':
      console.error(`❌ ${bind} is already in use`);
      logger.error(`${bind} is already in use`);
      console.log('\n💡 Try these solutions:');
      console.log(`   1. Kill process on port ${port}: lsof -ti:${port} | xargs kill -9`);
      console.log(`   2. Change PORT in .env file`);
      console.log(`   3. Check if another instance is running\n`);
      process.exit(1);
      break;
    
    default:
      throw error;
  }
});

/**
 * Event listener for HTTP server "listening" event
 */
server.on('listening', () => {
  const addr = server.address();
  const bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
  logger.info('Server listening on ' + bind);
});

/**
 * Graceful shutdown handler
 */
const gracefulShutdown = (signal) => {
  console.log(`\n⚠️  ${signal} received, starting graceful shutdown...`);
  logger.info(`${signal} received, starting graceful shutdown...`);
  
  // Stop accepting new connections
  server.close(() => {
    console.log('✅ HTTP server closed');
    logger.info('HTTP server closed');
    
    // Close database connections
    const { pool } = require('./src/config/database');
    pool.end(() => {
      console.log('✅ Database connections closed');
      logger.info('Database connections closed');
      console.log('👋 Goodbye!\n');
      process.exit(0);
    });
  });

  // Force close after 10 seconds
  setTimeout(() => {
    console.error('⚠️  Forced shutdown after timeout');
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

/**
 * Handle process termination signals
 */
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

/**
 * Handle uncaught exceptions
 */
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  logger.error('Uncaught Exception', { 
    error: error.message, 
    stack: error.stack 
  });
  gracefulShutdown('uncaughtException');
});

/**
 * Handle unhandled promise rejections
 */
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
  logger.error('Unhandled Rejection', { 
    reason: reason instanceof Error ? reason.message : reason,
    stack: reason instanceof Error ? reason.stack : undefined
  });
  gracefulShutdown('unhandledRejection');
});

/**
 * Handle warning events
 */
process.on('warning', (warning) => {
  console.warn('⚠️  Warning:', warning.name);
  console.warn('Message:', warning.message);
  logger.warn('Process warning', { 
    name: warning.name, 
    message: warning.message 
  });
});

/**
 * Display process info on startup
 */
console.log('\n🔍 System Information:');
console.log(`   Platform: ${process.platform}`);
console.log(`   Architecture: ${process.arch}`);
console.log(`   Node.js: ${process.version}`);
console.log(`   Process ID: ${process.pid}`);
console.log(`   Working Directory: ${process.cwd()}`);

// Start the server
startServer();

// Export server for testing
module.exports = server;
