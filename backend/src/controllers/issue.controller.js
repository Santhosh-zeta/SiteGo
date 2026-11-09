const { query } = require('../config/database');
const { successResponse, errorResponse, getPagination, getPaginationMeta } = require('../utils/helper.util');
const { logger } = require('../utils/logger.util');

/**
 * Create Issue (Supervisor/Worker)
 * @route POST /api/issues
 */
const createIssue = async (req, res) => {
  try {
    const {
      siteId,
      title,
      description,
      priority,
      assignedTo,
      location,
      photos
    } = req.body;

    const reportedBy = req.user.id;

    // Create issue
    const result = await query(
      `INSERT INTO issues 
       (site_id, reported_by, assigned_to, title, description, priority, location, photos, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        siteId,
        reportedBy,
        assignedTo || null,
        title,
        description || null,
        priority || 'medium',
        location ? JSON.stringify(location) : null,
        photos ? JSON.stringify(photos) : null,
        'open'
      ]
    );

    const issue = result.rows[0];

    logger.info('Issue created', {
      issueId: issue.id,
      siteId,
      reportedBy,
      priority: issue.priority
    });

    res.status(201).json(
      successResponse('Issue reported successfully', {
        id: issue.id,
        siteId: issue.site_id,
        reportedBy: issue.reported_by,
        assignedTo: issue.assigned_to,
        title: issue.title,
        description: issue.description,
        priority: issue.priority,
        status: issue.status,
        location: issue.location,
        photos: issue.photos,
        createdAt: issue.created_at
      })
    );

  } catch (error) {
    logger.error('Failed to create issue', { error: error.message });
    
    res.status(500).json(
      errorResponse('Failed to report issue')
    );
  }
};

/**
 * Get Site Issues
 * @route GET /api/issues/site/:siteId
 */
const getSiteIssues = async (req, res) => {
  try {
    const { siteId } = req.params;
    const { page = 1, limit = 20, status, priority } = req.query;
    const { offset, limit: queryLimit } = getPagination(page, limit);

    let whereClause = 'i.site_id = $1';
    let params = [siteId];
    let paramCount = 1;

    if (status) {
      paramCount++;
      whereClause += ` AND i.status = $${paramCount}`;
      params.push(status);
    }

    if (priority) {
      paramCount++;
      whereClause += ` AND i.priority = $${paramCount}`;
      params.push(priority);
    }

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM issues i WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get issues
    const result = await query(
      `SELECT 
         i.*,
         r.name as reported_by_name,
         r.role as reported_by_role,
         a.name as assigned_to_name,
         a.role as assigned_to_role
       FROM issues i
       LEFT JOIN users r ON i.reported_by = r.id
       LEFT JOIN users a ON i.assigned_to = a.id
       WHERE ${whereClause}
       ORDER BY 
         CASE i.priority
           WHEN 'critical' THEN 1
           WHEN 'high' THEN 2
           WHEN 'medium' THEN 3
           WHEN 'low' THEN 4
         END,
         i.created_at DESC
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      [...params, queryLimit, offset]
    );

    const issues = result.rows.map(issue => ({
      id: issue.id,
      siteId: issue.site_id,
      title: issue.title,
      description: issue.description,
      priority: issue.priority,
      status: issue.status,
      location: issue.location,
      photos: issue.photos,
      reportedBy: {
        id: issue.reported_by,
        name: issue.reported_by_name,
        role: issue.reported_by_role
      },
      assignedTo: issue.assigned_to ? {
        id: issue.assigned_to,
        name: issue.assigned_to_name,
        role: issue.assigned_to_role
      } : null,
      resolutionNotes: issue.resolution_notes,
      resolvedAt: issue.resolved_at,
      createdAt: issue.created_at,
      updatedAt: issue.updated_at
    }));

    res.status(200).json(
      successResponse(
        'Issues retrieved successfully',
        issues,
        getPaginationMeta(total, parseInt(page), parseInt(limit))
      )
    );

  } catch (error) {
    logger.error('Failed to get site issues', { error: error.message });
    
    res.status(500).json(
      errorResponse('Failed to retrieve issues')
    );
  }
};

/**
 * Get Issue Details
 * @route GET /api/issues/:issueId
 */
const getIssueDetails = async (req, res) => {
  try {
    const { issueId } = req.params;

    const result = await query(
      `SELECT 
         i.*,
         s.name as site_name,
         r.name as reported_by_name,
         r.email as reported_by_email,
         r.role as reported_by_role,
         r.profile_picture as reported_by_picture,
         a.name as assigned_to_name,
         a.email as assigned_to_email,
         a.role as assigned_to_role
       FROM issues i
       LEFT JOIN sites s ON i.site_id = s.id
       LEFT JOIN users r ON i.reported_by = r.id
       LEFT JOIN users a ON i.assigned_to = a.id
       WHERE i.id = $1`,
      [issueId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json(
        errorResponse('Issue not found')
      );
    }

    const issue = result.rows[0];

    // Get comments
    const commentsResult = await query(
      `SELECT 
         c.*,
         u.name as user_name,
         u.role as user_role,
         u.profile_picture
       FROM issue_comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.issue_id = $1
       ORDER BY c.created_at ASC`,
      [issueId]
    );

    res.status(200).json(
      successResponse('Issue details retrieved', {
        id: issue.id,
        siteId: issue.site_id,
        siteName: issue.site_name,
        title: issue.title,
        description: issue.description,
        priority: issue.priority,
        status: issue.status,
        location: issue.location,
        photos: issue.photos,
        reportedBy: {
          id: issue.reported_by,
          name: issue.reported_by_name,
          email: issue.reported_by_email,
          role: issue.reported_by_role,
          profilePicture: issue.reported_by_picture
        },
        assignedTo: issue.assigned_to ? {
          id: issue.assigned_to,
          name: issue.assigned_to_name,
          email: issue.assigned_to_email,
          role: issue.assigned_to_role
        } : null,
        resolutionNotes: issue.resolution_notes,
        resolvedAt: issue.resolved_at,
        createdAt: issue.created_at,
        updatedAt: issue.updated_at,
        comments: commentsResult.rows.map(comment => ({
          id: comment.id,
          comment: comment.comment,
          user: {
            id: comment.user_id,
            name: comment.user_name,
            role: comment.user_role,
            profilePicture: comment.profile_picture
          },
          createdAt: comment.created_at
        }))
      })
    );

  } catch (error) {
    logger.error('Failed to get issue details', { error: error.message });
    
    res.status(500).json(
      errorResponse('Failed to retrieve issue details')
    );
  }
};

/**
 * Update Issue Status
 * @route PUT /api/issues/:issueId/status
 */
const updateIssueStatus = async (req, res) => {
  try {
    const { issueId } = req.params;
    const { status, resolutionNotes } = req.body;

    // Validate status
    const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json(
        errorResponse('Invalid status')
      );
    }

    // Build update query
    let updateFields = ['status = $1', 'updated_at = CURRENT_TIMESTAMP'];
    let params = [status];
    let paramCount = 1;

    if (status === 'resolved' || status === 'closed') {
      paramCount++;
      updateFields.push(`resolved_at = CURRENT_TIMESTAMP`);
      
      if (resolutionNotes) {
        paramCount++;
        updateFields.push(`resolution_notes = $${paramCount}`);
        params.push(resolutionNotes);
      }
    }

    params.push(issueId);

    const result = await query(
      `UPDATE issues 
       SET ${updateFields.join(', ')}
       WHERE id = $${params.length}
       RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json(
        errorResponse('Issue not found')
      );
    }

    const issue = result.rows[0];

    logger.info('Issue status updated', {
      issueId,
      status,
      userId: req.user.id
    });

    res.status(200).json(
      successResponse('Issue status updated', {
        id: issue.id,
        status: issue.status,
        resolutionNotes: issue.resolution_notes,
        resolvedAt: issue.resolved_at,
        updatedAt: issue.updated_at
      })
    );

  } catch (error) {
    logger.error('Failed to update issue status', { error: error.message });
    
    res.status(500).json(
      errorResponse('Failed to update issue status')
    );
  }
};

/**
 * Add Comment to Issue
 * @route POST /api/issues/:issueId/comments
 */
const addComment = async (req, res) => {
  try {
    const { issueId } = req.params;
    const { comment } = req.body;
    const userId = req.user.id;

    if (!comment || comment.trim().length === 0) {
      return res.status(400).json(
        errorResponse('Comment cannot be empty')
      );
    }

    // Check if issue exists
    const issueResult = await query(
      'SELECT id FROM issues WHERE id = $1',
      [issueId]
    );

    if (issueResult.rows.length === 0) {
      return res.status(404).json(
        errorResponse('Issue not found')
      );
    }

    // Add comment
    const result = await query(
      `INSERT INTO issue_comments (issue_id, user_id, comment)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [issueId, userId, comment]
    );

    const newComment = result.rows[0];

    // Get user details
    const userResult = await query(
      'SELECT name, role, profile_picture FROM users WHERE id = $1',
      [userId]
    );

    const user = userResult.rows[0];

    logger.info('Comment added to issue', { issueId, userId });

    res.status(201).json(
      successResponse('Comment added successfully', {
        id: newComment.id,
        issueId: newComment.issue_id,
        comment: newComment.comment,
        user: {
          id: userId,
          name: user.name,
          role: user.role,
          profilePicture: user.profile_picture
        },
        createdAt: newComment.created_at
      })
    );

  } catch (error) {
    logger.error('Failed to add comment', { error: error.message });
    
    res.status(500).json(
      errorResponse('Failed to add comment')
    );
  }
};

/**
 * Assign Issue
 * @route PUT /api/issues/:issueId/assign
 */
const assignIssue = async (req, res) => {
  try {
    const { issueId } = req.params;
    const { assignedTo } = req.body;

    const result = await query(
      `UPDATE issues 
       SET assigned_to = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [assignedTo, issueId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json(
        errorResponse('Issue not found')
      );
    }

    logger.info('Issue assigned', { issueId, assignedTo });

    res.status(200).json(
      successResponse('Issue assigned successfully', {
        id: result.rows[0].id,
        assignedTo: result.rows[0].assigned_to
      })
    );

  } catch (error) {
    logger.error('Failed to assign issue', { error: error.message });
    
    res.status(500).json(
      errorResponse('Failed to assign issue')
    );
  }
};

/**
 * Get My Issues (Assigned to me)
 * @route GET /api/issues/my
 */
const getMyIssues = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    let whereClause = 'assigned_to = $1';
    let params = [userId];

    if (status) {
      whereClause += ' AND status = $2';
      params.push(status);
    }

    const result = await query(
      `SELECT 
         i.*,
         s.name as site_name,
         r.name as reported_by_name
       FROM issues i
       LEFT JOIN sites s ON i.site_id = s.id
       LEFT JOIN users r ON i.reported_by = r.id
       WHERE ${whereClause}
       ORDER BY 
         CASE i.priority
           WHEN 'critical' THEN 1
           WHEN 'high' THEN 2
           WHEN 'medium' THEN 3
           WHEN 'low' THEN 4
         END,
         i.created_at DESC`,
      params
    );

    res.status(200).json(
      successResponse('Your issues retrieved successfully', result.rows)
    );

  } catch (error) {
    logger.error('Failed to get my issues', { error: error.message });
    
    res.status(500).json(
      errorResponse('Failed to retrieve issues')
    );
  }
};

module.exports = {
  createIssue,
  getSiteIssues,
  getIssueDetails,
  updateIssueStatus,
  addComment,
  assignIssue,
  getMyIssues
};
