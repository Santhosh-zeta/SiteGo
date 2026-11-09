const { analyzeImageBuffer, getModelInfo } = require('../services/ai.service');
const { query } = require('../config/database');
const { successResponse, errorResponse } = require('../utils/helper.util');
const { logger } = require('../utils/logger.util');
const multer = require('multer');
const sharp = require('sharp');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  },
  fileFilter: (req, file, cb) => {
    // Accept only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
}).single('image');

/**
 * Analyze Image for Quality Check
 * @route POST /api/ai/analyze
 */
const analyzeQuality = async (req, res) => {
  try {
    // Handle file upload
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json(
          errorResponse(err.message || 'File upload failed')
        );
      }

      if (!req.file) {
        return res.status(400).json(
          errorResponse('No image file provided')
        );
      }

      const { siteId, reportId, issueId, description } = req.body;

      logger.info('Starting AI quality analysis', {
        siteId,
        fileSize: req.file.size,
        mimeType: req.file.mimetype
      });

      // Optimize image if needed
      let imageBuffer = req.file.buffer;
      
      // Compress large images
      if (req.file.size > 2 * 1024 * 1024) { // If larger than 2MB
        imageBuffer = await sharp(req.file.buffer)
          .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 85 })
          .toBuffer();
        
        logger.info('Image compressed', {
          originalSize: req.file.size,
          compressedSize: imageBuffer.length
        });
      }

      // Analyze image
      const analysisResult = await analyzeImageBuffer(imageBuffer);

      // Save analysis to database if related to site
      if (siteId) {
        await query(
          `INSERT INTO quality_checks 
           (site_id, report_id, issue_id, defect_type, confidence, severity, description, analyzed_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)`,
          [
            siteId,
            reportId || null,
            issueId || null,
            analysisResult.defectType,
            analysisResult.confidence,
            analysisResult.severity,
            description || null
          ]
        );

        logger.info('Quality check saved to database', {
          siteId,
          defectType: analysisResult.defectType
        });
      }

      res.status(200).json(
        successResponse('Image analyzed successfully', {
          defectType: analysisResult.defectType,
          confidence: analysisResult.confidence,
          severity: analysisResult.severity,
          isDefect: analysisResult.isDefect,
          recommendations: getRecommendations(analysisResult.defectType, analysisResult.severity),
          allPredictions: analysisResult.allPredictions,
          isMock: analysisResult.isMock || false
        })
      );

    });

  } catch (error) {
    logger.error('AI analysis failed', { error: error.message });
    
    res.status(500).json(
      errorResponse('Image analysis failed', {
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    );
  }
};

/**
 * Get recommendations based on defect type
 */
const getRecommendations = (defectType, severity) => {
  const recommendations = {
    'crack': {
      critical: [
        'Stop work immediately in this area',
        'Consult structural engineer',
        'Document crack size and location',
        'Investigate root cause before proceeding'
      ],
      high: [
        'Mark the area and restrict access',
        'Report to site manager immediately',
        'Schedule repair work',
        'Monitor crack progression'
      ],
      medium: [
        'Document the crack with measurements',
        'Schedule inspection by supervisor',
        'Plan repair in next phase'
      ],
      low: [
        'Monitor the area',
        'Include in next inspection report'
      ]
    },
    'misalignment': {
      critical: [
        'Stop construction in this section',
        'Remove and redo the work',
        'Check alignment tools and equipment',
        'Retrain workers on alignment procedures'
      ],
      high: [
        'Realign before proceeding',
        'Verify with measuring instruments',
        'Document corrective actions'
      ],
      medium: [
        'Minor adjustment required',
        'Can be corrected in finishing phase'
      ],
      low: [
        'Minor cosmetic issue',
        'Document for reference'
      ]
    },
    'poor_plastering': {
      high: [
        'Remove and redo plastering',
        'Check material mix ratio',
        'Ensure proper curing',
        'Verify worker technique'
      ],
      medium: [
        'Surface treatment required',
        'Can be corrected with additional coat',
        'Monitor drying process'
      ],
      low: [
        'Minor touch-up needed',
        'Schedule finishing work'
      ]
    },
    'surface_defect': {
      high: [
        'Identify defect cause',
        'Apply corrective treatment',
        'Inspect surrounding areas',
        'Document for quality records'
      ],
      medium: [
        'Surface repair needed',
        'Schedule correction work',
        'Monitor for recurrence'
      ],
      low: [
        'Minor cosmetic issue',
        'Include in finishing checklist'
      ]
    },
    'no_safety_gear': {
      critical: [
        'Stop work immediately',
        'Provide proper safety equipment',
        'Mandatory safety briefing',
        'Issue warning/penalty as per policy',
        'Document incident'
      ]
    },
    'good_quality': {
      none: [
        'Work meets quality standards',
        'Continue as planned',
        'Document as reference for future work'
      ]
    }
  };

  const defectRecommendations = recommendations[defectType];
  if (!defectRecommendations) {
    return ['No specific recommendations available'];
  }

  return defectRecommendations[severity] || defectRecommendations['medium'] || [];
};

/**
 * Get Quality Check History
 * @route GET /api/ai/quality-checks/:siteId
 */
const getQualityChecks = async (req, res) => {
  try {
    const { siteId } = req.params;
    const { startDate, endDate, defectType, severity } = req.query;

    let whereClause = 'site_id = $1';
    let params = [siteId];
    let paramCount = 1;

    if (startDate) {
      paramCount++;
      whereClause += ` AND analyzed_at >= $${paramCount}`;
      params.push(startDate);
    }

    if (endDate) {
      paramCount++;
      whereClause += ` AND analyzed_at <= $${paramCount}`;
      params.push(endDate);
    }

    if (defectType) {
      paramCount++;
      whereClause += ` AND defect_type = $${paramCount}`;
      params.push(defectType);
    }

    if (severity) {
      paramCount++;
      whereClause += ` AND severity = $${paramCount}`;
      params.push(severity);
    }

    const result = await query(
      `SELECT * FROM quality_checks
       WHERE ${whereClause}
       ORDER BY analyzed_at DESC`,
      params
    );

    res.status(200).json(
      successResponse('Quality checks retrieved', result.rows)
    );

  } catch (error) {
    logger.error('Failed to get quality checks', { error: error.message });
    
    res.status(500).json(
      errorResponse('Failed to retrieve quality checks')
    );
  }
};

/**
 * Get Quality Statistics
 * @route GET /api/ai/stats/:siteId
 */
const getQualityStats = async (req, res) => {
  try {
    const { siteId } = req.params;

    // Get defect distribution
    const defectStats = await query(
      `SELECT defect_type, COUNT(*) as count
       FROM quality_checks
       WHERE site_id = $1
       GROUP BY defect_type
       ORDER BY count DESC`,
      [siteId]
    );

    // Get severity distribution
    const severityStats = await query(
      `SELECT severity, COUNT(*) as count
       FROM quality_checks
       WHERE site_id = $1
       GROUP BY severity
       ORDER BY 
         CASE severity
           WHEN 'critical' THEN 1
           WHEN 'high' THEN 2
           WHEN 'medium' THEN 3
           WHEN 'low' THEN 4
           WHEN 'none' THEN 5
         END`,
      [siteId]
    );

    // Get recent checks
    const recentChecks = await query(
      `SELECT COUNT(*) as count
       FROM quality_checks
       WHERE site_id = $1
       AND analyzed_at >= CURRENT_DATE - INTERVAL '7 days'`,
      [siteId]
    );

    // Get average confidence
    const avgConfidence = await query(
      `SELECT AVG(confidence) as avg_confidence
       FROM quality_checks
       WHERE site_id = $1`,
      [siteId]
    );

    res.status(200).json(
      successResponse('Quality statistics retrieved', {
        defectDistribution: defectStats.rows,
        severityDistribution: severityStats.rows,
        recentChecks: parseInt(recentChecks.rows[0].count),
        averageConfidence: parseFloat(avgConfidence.rows[0].avg_confidence || 0).toFixed(2)
      })
    );

  } catch (error) {
    logger.error('Failed to get quality stats', { error: error.message });
    
    res.status(500).json(
      errorResponse('Failed to retrieve quality statistics')
    );
  }
};

/**
 * Get AI Model Info
 * @route GET /api/ai/model-info
 */
const getAIModelInfo = async (req, res) => {
  try {
    const modelInfo = getModelInfo();

    res.status(200).json(
      successResponse('Model information retrieved', modelInfo)
    );

  } catch (error) {
    logger.error('Failed to get model info', { error: error.message });
    
    res.status(500).json(
      errorResponse('Failed to retrieve model information')
    );
  }
};

module.exports = {
  analyzeQuality,
  getQualityChecks,
  getQualityStats,
  getAIModelInfo
};
