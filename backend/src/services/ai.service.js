const tf = require('@tensorflow/tfjs-node');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { logger } = require('../utils/logger.util');

/**
 * AI Service for Quality Check
 * Uses TensorFlow for image analysis
 */

let model = null;
const MODEL_PATH = process.env.AI_MODEL_PATH || './ai_models/quality_check_model';
const CONFIDENCE_THRESHOLD = parseFloat(process.env.AI_CONFIDENCE_THRESHOLD) || 0.75;
const MODEL_ENABLED = process.env.AI_MODEL_ENABLED !== 'false'; // Default true

// Defect categories
const DEFECT_LABELS = [
  'crack',
  'misalignment',
  'poor_plastering',
  'surface_defect',
  'no_safety_gear',
  'good_quality'
];

/**
 * Load TensorFlow model with proper error handling
 */
const loadModel = async () => {
  try {
    // Check if already loaded
    if (model) {
      logger.info('AI model already loaded');
      return model;
    }

    // Check if AI is enabled
    if (!MODEL_ENABLED) {
      logger.info('🤖 AI model disabled in configuration');
      logger.info('📝 Set AI_MODEL_ENABLED=true in .env to enable');
      return null;
    }

    // Check if model directory exists
    if (!fs.existsSync(MODEL_PATH)) {
      logger.warn('⚠️  AI model directory not found');
      logger.warn('📍 Expected path:', MODEL_PATH);
      logger.warn('🤖 Using mock predictions for AI quality checks');
      logger.info('💡 To add a real model:');
      logger.info('   1. Train model using ai_models/train_model.py');
      logger.info('   2. Convert using ai_models/convert_to_tfjs.py');
      logger.info('   3. Copy files to', MODEL_PATH);
      return null;
    }

    // Check if model.json exists
    const modelJsonPath = path.join(MODEL_PATH, 'model.json');
    if (!fs.existsSync(modelJsonPath)) {
      logger.warn('⚠️  model.json not found in', MODEL_PATH);
      logger.warn('🤖 Using mock predictions for AI quality checks');
      return null;
    }

    // Read and validate model.json
    let modelConfig;
    try {
      const modelJsonContent = fs.readFileSync(modelJsonPath, 'utf8');
      modelConfig = JSON.parse(modelJsonContent);
    } catch (parseError) {
      logger.warn('⚠️  Failed to parse model.json:', parseError.message);
      logger.warn('🤖 Using mock predictions for AI quality checks');
      return null;
    }

    // Check if it's a valid TensorFlow.js model
    if (!modelConfig.modelTopology || !modelConfig.weightsManifest) {
      logger.warn('⚠️  Invalid model.json format (placeholder or corrupted)');
      logger.warn('🤖 Using mock predictions for AI quality checks');
      return null;
    }

    // Check if model topology has required fields
    if (!modelConfig.modelTopology.class_name || !modelConfig.modelTopology.config) {
      logger.warn('⚠️  Incomplete model topology in model.json');
      logger.warn('🤖 Using mock predictions for AI quality checks');
      return null;
    }

    // Check if weights file exists
    if (modelConfig.weightsManifest && modelConfig.weightsManifest.length > 0) {
      const weightsPath = modelConfig.weightsManifest[0].paths[0];
      const fullWeightsPath = path.join(MODEL_PATH, weightsPath);
      
      if (!fs.existsSync(fullWeightsPath)) {
        logger.warn('⚠️  Model weights file not found:', weightsPath);
        logger.warn('🤖 Using mock predictions for AI quality checks');
        return null;
      }
    }

    // Load model
    logger.info('📦 Loading TensorFlow.js model from', MODEL_PATH);
    model = await tf.loadLayersModel(`file://${modelJsonPath}`);
    logger.info('✅ AI model loaded successfully');
    logger.info('🎯 Model ready for quality predictions');
    
    return model;
  } catch (error) {
    logger.error('❌ Failed to load AI model:', error.message);
    logger.warn('🤖 Falling back to mock predictions');
    
    // Log additional debug info in development
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Error stack:', error.stack);
    }
    
    return null;
  }
};

/**
 * Preprocess image for model input
 * @param {Buffer} imageBuffer - Image buffer
 * @returns {Tensor} - Preprocessed tensor
 */
const preprocessImage = async (imageBuffer) => {
  try {
    // Resize and normalize image using sharp
    const processedImage = await sharp(imageBuffer)
      .resize(224, 224) // Standard size for most models
      .toFormat('jpeg')
      .toBuffer();

    // Convert to tensor
    const imageTensor = tf.node.decodeImage(processedImage, 3);
    
    // Normalize pixel values to [0, 1]
    const normalized = imageTensor.toFloat().div(tf.scalar(255));
    
    // Add batch dimension
    const batched = normalized.expandDims(0);
    
    return batched;
  } catch (error) {
    logger.error('Image preprocessing failed', { error: error.message });
    throw new Error('Failed to preprocess image');
  }
};

/**
 * Analyze image for defects
 * @param {String} imageUrl - Image URL or local path
 * @returns {Object} - Analysis results
 */
const analyzeImage = async (imageUrl) => {
  try {
    logger.info('Starting image analysis', { imageUrl });

    // Load model if not loaded
    if (!model) {
      await loadModel();
    }

    // If model is still null, use mock prediction
    if (!model) {
      return mockPrediction();
    }

    // Read image
    let imageBuffer;
    if (imageUrl.startsWith('http')) {
      // Download from URL (if needed in future)
      throw new Error('URL download not implemented yet');
    } else {
      // Read from local file
      imageBuffer = fs.readFileSync(imageUrl);
    }

    // Preprocess image
    const inputTensor = await preprocessImage(imageBuffer);

    // Run prediction
    const predictions = await model.predict(inputTensor);
    const predictionData = await predictions.data();

    // Get top prediction
    let maxIndex = 0;
    let maxConfidence = predictionData[0];

    for (let i = 1; i < predictionData.length; i++) {
      if (predictionData[i] > maxConfidence) {
        maxConfidence = predictionData[i];
        maxIndex = i;
      }
    }

    const defectType = DEFECT_LABELS[maxIndex];
    const confidence = maxConfidence;

    // Determine severity
    const severity = determineSeverity(defectType, confidence);

    // Clean up tensors
    inputTensor.dispose();
    predictions.dispose();

    const result = {
      defectType,
      confidence: parseFloat(confidence.toFixed(4)),
      severity,
      isDefect: defectType !== 'good_quality' && confidence >= CONFIDENCE_THRESHOLD,
      allPredictions: DEFECT_LABELS.map((label, idx) => ({
        label,
        confidence: parseFloat(predictionData[idx].toFixed(4))
      })).sort((a, b) => b.confidence - a.confidence)
    };

    logger.info('Image analysis completed', result);

    return result;

  } catch (error) {
    logger.error('Image analysis failed', { error: error.message });
    throw new Error('AI analysis failed');
  }
};

/**
 * Analyze image from buffer
 * @param {Buffer} imageBuffer - Image buffer
 * @returns {Object} - Analysis results
 */
const analyzeImageBuffer = async (imageBuffer) => {
  try {
    logger.info('Starting image analysis from buffer');

    // Load model if not loaded
    if (!model) {
      await loadModel();
    }

    // If model is still null, use mock prediction
    if (!model) {
      return mockPrediction();
    }

    // Preprocess image
    const inputTensor = await preprocessImage(imageBuffer);

    // Run prediction
    const predictions = await model.predict(inputTensor);
    const predictionData = await predictions.data();

    // Get top prediction
    let maxIndex = 0;
    let maxConfidence = predictionData[0];

    for (let i = 1; i < predictionData.length; i++) {
      if (predictionData[i] > maxConfidence) {
        maxConfidence = predictionData[i];
        maxIndex = i;
      }
    }

    const defectType = DEFECT_LABELS[maxIndex];
    const confidence = maxConfidence;

    // Determine severity
    const severity = determineSeverity(defectType, confidence);

    // Clean up tensors
    inputTensor.dispose();
    predictions.dispose();

    const result = {
      defectType,
      confidence: parseFloat(confidence.toFixed(4)),
      severity,
      isDefect: defectType !== 'good_quality' && confidence >= CONFIDENCE_THRESHOLD,
      allPredictions: DEFECT_LABELS.map((label, idx) => ({
        label,
        confidence: parseFloat(predictionData[idx].toFixed(4))
      })).sort((a, b) => b.confidence - a.confidence)
    };

    logger.info('Image analysis completed', result);

    return result;

  } catch (error) {
    logger.error('Image analysis failed', { error: error.message });
    throw new Error('AI analysis failed');
  }
};

/**
 * Determine severity based on defect type and confidence
 * @param {String} defectType - Type of defect
 * @param {Number} confidence - Confidence score
 * @returns {String} - Severity level
 */
const determineSeverity = (defectType, confidence) => {
  if (defectType === 'good_quality') {
    return 'none';
  }

  const criticalDefects = ['crack', 'no_safety_gear'];
  const highDefects = ['misalignment', 'surface_defect'];
  const mediumDefects = ['poor_plastering'];

  if (criticalDefects.includes(defectType) && confidence >= 0.85) {
    return 'critical';
  }

  if (criticalDefects.includes(defectType) || (highDefects.includes(defectType) && confidence >= 0.80)) {
    return 'high';
  }

  if (highDefects.includes(defectType) || (mediumDefects.includes(defectType) && confidence >= 0.75)) {
    return 'medium';
  }

  return 'low';
};

/**
 * Mock prediction (when model is not available)
 * @returns {Object} - Mock analysis results
 */
const mockPrediction = () => {
  logger.warn('🤖 Using mock AI prediction (no model loaded)');

  const randomIndex = Math.floor(Math.random() * DEFECT_LABELS.length);
  const defectType = DEFECT_LABELS[randomIndex];
  const confidence = 0.70 + Math.random() * 0.25;
  const severity = determineSeverity(defectType, confidence);

  return {
    defectType,
    confidence: parseFloat(confidence.toFixed(4)),
    severity,
    isDefect: defectType !== 'good_quality' && confidence >= CONFIDENCE_THRESHOLD,
    isMock: true,
    message: 'Using mock prediction - no AI model loaded',
    allPredictions: DEFECT_LABELS.map(label => ({
      label,
      confidence: parseFloat((Math.random() * 0.3).toFixed(4))
    })).sort((a, b) => b.confidence - a.confidence)
  };
};

/**
 * Batch analyze multiple images
 * @param {Array} imageBuffers - Array of image buffers
 * @returns {Array} - Array of analysis results
 */
const batchAnalyze = async (imageBuffers) => {
  const results = [];

  for (const buffer of imageBuffers) {
    try {
      const result = await analyzeImageBuffer(buffer);
      results.push(result);
    } catch (error) {
      results.push({
        error: true,
        message: error.message
      });
    }
  }

  return results;
};

/**
 * Get model info
 * @returns {Object} - Model information
 */
const getModelInfo = () => {
  return {
    loaded: model !== null,
    modelPath: MODEL_PATH,
    confidenceThreshold: CONFIDENCE_THRESHOLD,
    defectLabels: DEFECT_LABELS,
    version: '1.0.0',
    enabled: MODEL_ENABLED,
    status: model ? 'ready' : 'using mock predictions'
  };
};

// Load model on startup (non-blocking)
loadModel().catch(err => {
  logger.warn('Initial model load failed, will use mock predictions');
});

module.exports = {
  loadModel,
  analyzeImage,
  analyzeImageBuffer,
  batchAnalyze,
  getModelInfo,
  DEFECT_LABELS
};
