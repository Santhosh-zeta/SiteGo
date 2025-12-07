const { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { s3Client, BUCKET_NAME, FILE_CONFIG } = require('../config/s3');
const { sanitizeFilename, getFileExtension } = require('../utils/helper.util');
const { logger } = require('../utils/logger.util');

/**
 * S3 Service
 * Handles all AWS S3 operations including presigned URLs
 */

/**
 * Generate presigned URL for file upload
 * @param {String} folder - Folder name in S3
 * @param {String} filename - Original filename
 * @param {String} fileType - MIME type
 * @returns {Object} - { uploadUrl, fileUrl, key }
 */
const generateUploadUrl = async (folder, filename, fileType) => {
  try {
    // Sanitize and create unique filename
    const sanitized = sanitizeFilename(filename);
    const timestamp = Date.now();
    const extension = getFileExtension(sanitized);
    const key = `${FILE_CONFIG.folders[folder] || 'misc/'}${timestamp}-${sanitized}`;

    // Create PUT command
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: fileType
    });

    // Generate presigned URL (valid for 5 minutes)
    const uploadUrl = await getSignedUrl(s3Client, command, { 
      expiresIn: 300 
    });

    // Generate public file URL
    const fileUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    logger.info('Generated upload URL', { folder, filename: sanitized });

    return {
      uploadUrl,
      fileUrl,
      key
    };
  } catch (error) {
    logger.error('Failed to generate upload URL', { error: error.message });
    throw new Error('Failed to generate upload URL');
  }
};

/**
 * Generate presigned URL for file download
 * @param {String} key - S3 object key
 * @returns {String} - Presigned download URL
 */
const generateDownloadUrl = async (key) => {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    });

    // Generate presigned URL (valid for 1 hour)
    const downloadUrl = await getSignedUrl(s3Client, command, { 
      expiresIn: 3600 
    });

    logger.info('Generated download URL', { key });

    return downloadUrl;
  } catch (error) {
    logger.error('Failed to generate download URL', { error: error.message });
    throw new Error('Failed to generate download URL');
  }
};

/**
 * Delete file from S3
 * @param {String} key - S3 object key
 * @returns {Boolean}
 */
const deleteFile = async (key) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    });

    await s3Client.send(command);
    logger.info('Deleted file from S3', { key });

    return true;
  } catch (error) {
    logger.error('Failed to delete file from S3', { error: error.message });
    throw new Error('Failed to delete file');
  }
};

/**
 * Delete multiple files from S3
 * @param {Array} keys - Array of S3 object keys
 * @returns {Object} - { deleted, failed }
 */
const deleteMultipleFiles = async (keys) => {
  const results = {
    deleted: [],
    failed: []
  };

  for (const key of keys) {
    try {
      await deleteFile(key);
      results.deleted.push(key);
    } catch (error) {
      results.failed.push({ key, error: error.message });
    }
  }

  return results;
};

/**
 * Generate multiple upload URLs
 * @param {Array} files - Array of {folder, filename, fileType}
 * @returns {Array} - Array of upload URL objects
 */
const generateMultipleUploadUrls = async (files) => {
  const uploadUrls = [];

  for (const file of files) {
    const { folder, filename, fileType } = file;
    const urlData = await generateUploadUrl(folder, filename, fileType);
    uploadUrls.push(urlData);
  }

  return uploadUrls;
};

/**
 * Validate file type
 * @param {String} fileType - MIME type
 * @param {String} category - 'image' or 'document'
 * @returns {Boolean}
 */
const validateFileType = (fileType, category = 'image') => {
  if (category === 'image') {
    return FILE_CONFIG.allowedImageTypes.includes(fileType);
  }
  
  if (category === 'document') {
    return FILE_CONFIG.allowedDocumentTypes.includes(fileType);
  }

  return false;
};

/**
 * Validate file size
 * @param {Number} fileSize - File size in bytes
 * @returns {Boolean}
 */
const validateFileSize = (fileSize) => {
  return fileSize <= FILE_CONFIG.maxFileSize;
};

/**
 * Extract S3 key from URL
 * @param {String} url - Full S3 URL
 * @returns {String} - S3 key
 */
const extractKeyFromUrl = (url) => {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname.substring(1); // Remove leading slash
  } catch (error) {
    logger.error('Failed to extract key from URL', { url });
    return null;
  }
};

/**
 * Get file metadata
 * @param {String} key - S3 object key
 * @returns {Object} - File metadata
 */
const getFileMetadata = async (key) => {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    });

    const response = await s3Client.send(command);

    return {
      contentType: response.ContentType,
      contentLength: response.ContentLength,
      lastModified: response.LastModified,
      etag: response.ETag
    };
  } catch (error) {
    logger.error('Failed to get file metadata', { error: error.message });
    throw new Error('Failed to get file metadata');
  }
};

module.exports = {
  generateUploadUrl,
  generateDownloadUrl,
  generateMultipleUploadUrls,
  deleteFile,
  deleteMultipleFiles,
  validateFileType,
  validateFileSize,
  extractKeyFromUrl,
  getFileMetadata
};
