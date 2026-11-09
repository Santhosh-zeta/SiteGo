const { query, transaction } = require('../config/database');
const { successResponse, errorResponse, getPagination, getPaginationMeta, generateQRCode } = require('../utils/helper.util');
const { logger } = require('../utils/logger.util');

/**
 * Create Material Master (Admin)
 * @route POST /api/materials/master
 */
const createMaterialMaster = async (req, res) => {
  try {
    const { name, category, unit, description, standardPrice } = req.body;

    // Check if material already exists
    const existingMaterial = await query(
      'SELECT id FROM material_master WHERE name = $1 AND category = $2',
      [name, category]
    );

    if (existingMaterial.rows.length > 0) {
      return res.status(400).json(
        errorResponse('Material already exists')
      );
    }

    // Generate QR code
    const qrCode = generateQRCode('MAT', Date.now());

    // Insert material
    const result = await query(
      `INSERT INTO material_master (name, category, unit, qr_code, description, standard_price)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, category, unit, qrCode, description, standardPrice || null]
    );

    const material = result.rows[0];

    logger.info('Material master created', { materialId: material.id });

    res.status(201).json(
      successResponse('Material created successfully', {
        id: material.id,
        name: material.name,
        category: material.category,
        unit: material.unit,
        qrCode: material.qr_code,
        description: material.description,
        standardPrice: material.standard_price
      })
    );

  } catch (error) {
    logger.error('Failed to create material', { error: error.message });
    
    res.status(500).json(
      errorResponse('Failed to create material')
    );
  }
};

/**
 * Get All Materials (Paginated)
 * @route GET /api/materials/master
 */
const getAllMaterials = async (req, res) => {
  try {
    const { page = 1, limit = 20, category, search } = req.query;
    const { offset, limit: queryLimit } = getPagination(page, limit);

    let whereClause = '1=1';
    let params = [];
    let paramCount = 0;

    if (category) {
      paramCount++;
      whereClause += ` AND category = $${paramCount}`;
      params.push(category);
    }

    if (search) {
      paramCount++;
      whereClause += ` AND name ILIKE $${paramCount}`;
      params.push(`%${search}%`);
    }

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM material_master WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get materials
    const result = await query(
      `SELECT * FROM material_master 
       WHERE ${whereClause}
       ORDER BY category, name
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      [...params, queryLimit, offset]
    );

    res.status(200).json(
      successResponse(
        'Materials retrieved successfully',
        result.rows,
        getPaginationMeta(total, parseInt(page), parseInt(limit))
      )
    );

  } catch (error) {
    logger.error('Failed to get materials', { error: error.message });
    
    res.status(500).json(
      errorResponse('Failed to retrieve materials')
    );
  }
};

/**
 * Scan Material QR Code
 * @route POST /api/materials/scan
 */
const scanMaterial = async (req, res) => {
  try {
    const { siteId, qrCode, quantity, logType, notes } = req.body;
    const userId = req.user.id;

    // Find material by QR code
    const materialResult = await query(
      'SELECT * FROM material_master WHERE qr_code = $1',
      [qrCode]
    );

    if (materialResult.rows.length === 0) {
      return res.status(404).json(
        errorResponse('Material not found')
      );
    }

    const material = materialResult.rows[0];

    // Use transaction for atomic operation
    await transaction(async (client) => {
      // Log the transaction
      await client.query(
        `INSERT INTO material_logs (site_id, material_id, logged_by, log_type, quantity, notes)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [siteId, material.id, userId, logType, quantity, notes || null]
      );

      // Update inventory
      const inventoryResult = await client.query(
        'SELECT * FROM material_inventory WHERE site_id = $1 AND material_id = $2',
        [siteId, material.id]
      );

      if (inventoryResult.rows.length === 0) {
        // Create inventory record
        const received = logType === 'received' ? quantity : 0;
        const used = logType === 'used' ? quantity : 0;
        const available = received - used;

        await client.query(
          `INSERT INTO material_inventory (site_id, material_id, quantity_received, quantity_used, quantity_available)
           VALUES ($1, $2, $3, $4, $5)`,
          [siteId, material.id, received, used, available]
        );
      } else {
        // Update existing inventory
        let updateQuery = '';
        
        if (logType === 'received') {
          updateQuery = `
            UPDATE material_inventory 
            SET quantity_received = quantity_received + $1,
                quantity_available = quantity_available + $1,
                last_updated = CURRENT_TIMESTAMP
            WHERE site_id = $2 AND material_id = $3
          `;
        } else if (logType === 'used') {
          updateQuery = `
            UPDATE material_inventory 
            SET quantity_used = quantity_used + $1,
                quantity_available = quantity_available - $1,
                last_updated = CURRENT_TIMESTAMP
            WHERE site_id = $2 AND material_id = $3
          `;
        }

        await client.query(updateQuery, [quantity, siteId, material.id]);
      }
    });

    logger.info('Material scanned', {
      userId,
      siteId,
      materialId: material.id,
      logType,
      quantity
    });

    res.status(200).json(
      successResponse('Material logged successfully', {
        material: {
          id: material.id,
          name: material.name,
          category: material.category,
          unit: material.unit
        },
        logType,
        quantity
      })
    );

  } catch (error) {
    logger.error('Material scan failed', { error: error.message });
    
    res.status(500).json(
      errorResponse('Failed to log material')
    );
  }
};

/**
 * Get Site Material Inventory
 * @route GET /api/materials/inventory/:siteId
 */
const getSiteInventory = async (req, res) => {
  try {
    const { siteId } = req.params;
    const { category } = req.query;

    let whereClause = 'i.site_id = $1';
    let params = [siteId];

    if (category) {
      whereClause += ' AND m.category = $2';
      params.push(category);
    }

    const result = await query(
      `SELECT 
         i.*,
         m.name as material_name,
         m.category,
         m.unit,
         m.qr_code,
         m.standard_price
       FROM material_inventory i
       JOIN material_master m ON i.material_id = m.id
       WHERE ${whereClause}
       ORDER BY m.category, m.name`,
      params
    );

    const inventory = result.rows.map(item => ({
      materialId: item.material_id,
      materialName: item.material_name,
      category: item.category,
      unit: item.unit,
      qrCode: item.qr_code,
      quantityReceived: parseFloat(item.quantity_received),
      quantityUsed: parseFloat(item.quantity_used),
      quantityAvailable: parseFloat(item.quantity_available),
      standardPrice: item.standard_price,
      lastUpdated: item.last_updated
    }));

    res.status(200).json(
      successResponse('Inventory retrieved successfully', inventory)
    );

  } catch (error) {
    logger.error('Failed to get inventory', { error: error.message });
    
    res.status(500).json(
      errorResponse('Failed to retrieve inventory')
    );
  }
};

/**
 * Get Material Logs
 * @route GET /api/materials/logs/:siteId
 */
const getMaterialLogs = async (req, res) => {
  try {
    const { siteId } = req.params;
    const { page = 1, limit = 20, materialId, logType, startDate, endDate } = req.query;
    const { offset, limit: queryLimit } = getPagination(page, limit);

    let whereClause = 'l.site_id = $1';
    let params = [siteId];
    let paramCount = 1;

    if (materialId) {
      paramCount++;
      whereClause += ` AND l.material_id = $${paramCount}`;
      params.push(materialId);
    }

    if (logType) {
      paramCount++;
      whereClause += ` AND l.log_type = $${paramCount}`;
      params.push(logType);
    }

    if (startDate) {
      paramCount++;
      whereClause += ` AND l.transaction_date >= $${paramCount}`;
      params.push(startDate);
    }

    if (endDate) {
      paramCount++;
      whereClause += ` AND l.transaction_date <= $${paramCount}`;
      params.push(endDate);
    }

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM material_logs l WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get logs
    const result = await query(
      `SELECT 
         l.*,
         m.name as material_name,
         m.category,
         m.unit,
         u.name as logged_by_name,
         u.role as logged_by_role
       FROM material_logs l
       JOIN material_master m ON l.material_id = m.id
       LEFT JOIN users u ON l.logged_by = u.id
       WHERE ${whereClause}
       ORDER BY l.transaction_date DESC
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      [...params, queryLimit, offset]
    );

    const logs = result.rows.map(log => ({
      id: log.id,
      materialId: log.material_id,
      materialName: log.material_name,
      category: log.category,
      unit: log.unit,
      logType: log.log_type,
      quantity: parseFloat(log.quantity),
      notes: log.notes,
      loggedBy: {
        id: log.logged_by,
        name: log.logged_by_name,
        role: log.logged_by_role
      },
      transactionDate: log.transaction_date
    }));

    res.status(200).json(
      successResponse(
        'Material logs retrieved successfully',
        logs,
        getPaginationMeta(total, parseInt(page), parseInt(limit))
      )
    );

  } catch (error) {
    logger.error('Failed to get material logs', { error: error.message });
    
    res.status(500).json(
      errorResponse('Failed to retrieve material logs')
    );
  }
};

/**
 * Get Material Categories
 * @route GET /api/materials/categories
 */
const getMaterialCategories = async (req, res) => {
  try {
    const result = await query(
      `SELECT DISTINCT category, COUNT(*) as count
       FROM material_master
       GROUP BY category
       ORDER BY category`
    );

    res.status(200).json(
      successResponse('Categories retrieved successfully', result.rows)
    );

  } catch (error) {
    logger.error('Failed to get categories', { error: error.message });
    
    res.status(500).json(
      errorResponse('Failed to retrieve categories')
    );
  }
};

module.exports = {
  createMaterialMaster,
  getAllMaterials,
  scanMaterial,
  getSiteInventory,
  getMaterialLogs,
  getMaterialCategories
};
