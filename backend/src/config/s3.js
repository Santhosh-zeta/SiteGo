const { S3Client } = require('@aws-sdk/client-s3');
require('dotenv').config();

/**
 * AWS S3 Client Configuration
 */
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// S3 bucket name
const BUCKET_NAME = process.env.AWS_BUCKET_NAME;

// File upload configurations
const FILE_CONFIG = {
  // Maximum file size (10MB)
  maxFileSize: 10 * 1024 * 1024,
  
  // Allowed image formats
  allowedImageTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  
  // Allowed document formats
  allowedDocumentTypes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ],
  
  // S3 folder structure
  folders: {
    profiles: 'profiles/',
    reports: 'reports/',
    issues: 'issues/',
    documents: 'documents/',
    materials: 'materials/',
    ai_quality: 'ai_quality/',
    temp: 'temp/'
  }
};

/**
 * Validate S3 configuration
 */
const validateS3Config = () => {
  const requiredEnvVars = [
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_REGION',
    'AWS_BUCKET_NAME'
  ];

  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);

  if (missing.length > 0) {
    console.warn('⚠️ Missing AWS S3 configuration:', missing.join(', '));
    console.warn('⚠️ File upload features will not work');
    return false;
  }

  console.log('✅ AWS S3 configuration validated');
  return true;
};

// Validate on load
validateS3Config();

module.exports = {
  s3Client,
  BUCKET_NAME,
  FILE_CONFIG
};
