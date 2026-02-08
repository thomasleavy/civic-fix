import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import pool from '../config/database';
import { CustomError } from '../middleware/errorHandler';

// Pre-defined issue types
export const ISSUE_TYPES = [
  'I wrote my PPSN wrong',
  'I wrote my name wrong',
  'I wrote my surname wrong',
  'I wrote my date of birth wrong',
  'I wrote my address wrong',
  'Other profile issue',
  'Account access issue',
  'Other'
];

// Create a message from user to admin
export const createMessage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    const { issueType, description } = req.body;

    if (!userId) {
      throw new CustomError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    if (!issueType || !description) {
      throw new CustomError('Issue type and description are required', 400, 'VALIDATION_ERROR');
    }

    // Validate issue type
    if (!ISSUE_TYPES.includes(issueType)) {
      throw new CustomError('Invalid issue type', 400, 'VALIDATION_ERROR');
    }

    // Get user's county from profile
    const profileResult = await pool.query(
      'SELECT county FROM user_profiles WHERE user_id = $1',
      [userId]
    );

    if (profileResult.rows.length === 0 || !profileResult.rows[0].county) {
      throw new CustomError('User must have a county set in their profile', 400, 'VALIDATION_ERROR');
    }

    const userCounty = profileResult.rows[0].county;

    // Find an admin who manages this county
    const adminResult = await pool.query(
      `SELECT DISTINCT al.admin_id, u.email as admin_email
       FROM admin_locations al
       JOIN users u ON al.admin_id = u.id
       WHERE al.county = $1 AND u.role = 'admin'
       LIMIT 1`,
      [userCounty]
    );

    if (adminResult.rows.length === 0) {
      throw new CustomError('No admin is currently assigned to your county. Please try again later.', 404, 'NOT_FOUND');
    }

    const adminId = adminResult.rows[0].admin_id;

    // Create the message
    const result = await pool.query(
      `INSERT INTO admin_messages (user_id, admin_id, issue_type, description, status)
       VALUES ($1, $2, $3, $4, 'pending')
       RETURNING *`,
      [userId, adminId, issueType, description]
    );

    res.status(201).json({
      message: 'Message sent successfully',
      adminMessage: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

// Close resolved messages older than 48 hours
export const closeOldResolvedMessages = async (): Promise<void> => {
  try {
    const result = await pool.query(
      `UPDATE admin_messages 
       SET status = 'closed', updated_at = NOW()
       WHERE status = 'resolved' 
       AND resolved_at IS NOT NULL
       AND resolved_at < NOW() - INTERVAL '48 hours'`,
      []
    );

    if (result.rowCount && result.rowCount > 0) {
      console.log(`✅ Closed ${result.rowCount} resolved message(s) older than 48 hours`);
    }
  } catch (error: any) {
    console.error('❌ Error closing old resolved messages:', error.message);
  }
};

// Get messages for the authenticated admin
export const getAdminMessages = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const adminId = req.userId;

    if (!adminId || req.userRole !== 'admin') {
      throw new CustomError('Admin access required', 403, 'FORBIDDEN');
    }

    const { status } = req.query;

    let query = `
      SELECT 
        am.*,
        u.email as user_email,
        up.first_name,
        up.surname,
        up.county as user_county
      FROM admin_messages am
      JOIN users u ON am.user_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE am.admin_id = $1
    `;

    const params: any[] = [adminId];

    if (status && typeof status === 'string' && ['pending', 'in_progress', 'resolved', 'closed'].includes(status)) {
      query += ' AND am.status = $2';
      params.push(status);
    }

    query += ' ORDER BY am.created_at DESC';

    // Close any resolved messages older than 48 hours (safety check)
    await closeOldResolvedMessages();

    const result = await pool.query(query, params);

    // Count unread messages (pending or in_progress without viewed_at)
    const unreadCount = result.rows.filter((m: any) => 
      (m.status === 'pending' || m.status === 'in_progress') && !m.viewed_at
    ).length;

    res.status(200).json({
      messages: result.rows,
      count: result.rows.length,
      unreadCount: unreadCount
    });
  } catch (error) {
    next(error);
  }
};

// Get messages for the authenticated user
export const getUserMessages = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;

    if (!userId) {
      throw new CustomError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    const result = await pool.query(
      `SELECT 
        am.*,
        u.email as admin_email
      FROM admin_messages am
      LEFT JOIN users u ON am.admin_id = u.id
      WHERE am.user_id = $1
      ORDER BY am.created_at DESC`,
      [userId]
    );

    res.status(200).json({
      messages: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    next(error);
  }
};

// Mark message as viewed (admin only)
export const markMessageAsViewed = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const adminId = req.userId;
    const { messageId } = req.params;

    if (!adminId || req.userRole !== 'admin') {
      throw new CustomError('Admin access required', 403, 'FORBIDDEN');
    }

    // Verify the message belongs to this admin and mark as viewed
    const result = await pool.query(
      `UPDATE admin_messages 
       SET viewed_at = COALESCE(viewed_at, NOW())
       WHERE id = $1 AND admin_id = $2 AND viewed_at IS NULL
       RETURNING *`,
      [messageId, adminId]
    );

    if (result.rows.length === 0) {
      // Message not found or already viewed, but that's okay
      return res.status(200).json({
        message: 'Message already viewed or not found',
        alreadyViewed: true
      });
    }

    res.status(200).json({
      message: 'Message marked as viewed',
      adminMessage: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

// Update message status (admin only)
export const updateMessageStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const adminId = req.userId;
    const { messageId } = req.params;
    const { status, adminResponse } = req.body;

    if (!adminId || req.userRole !== 'admin') {
      throw new CustomError('Admin access required', 403, 'FORBIDDEN');
    }

    if (!status || !['pending', 'in_progress', 'resolved', 'closed'].includes(status)) {
      throw new CustomError('Valid status is required', 400, 'VALIDATION_ERROR');
    }

    // Verify the message belongs to this admin
    const messageCheck = await pool.query(
      'SELECT id, admin_id FROM admin_messages WHERE id = $1',
      [messageId]
    );

    if (messageCheck.rows.length === 0) {
      throw new CustomError('Message not found', 404, 'NOT_FOUND');
    }

    if (messageCheck.rows[0].admin_id !== adminId) {
      throw new CustomError('You do not have permission to update this message', 403, 'FORBIDDEN');
    }

    // Update message
    const updateFields: string[] = ['status = $1'];
    const params: any[] = [status];

    if (adminResponse) {
      updateFields.push('admin_response = $2');
      params.push(adminResponse);
    }

    if (status === 'resolved' || status === 'closed') {
      updateFields.push('resolved_at = NOW()');
    }

    // Mark as viewed if not already viewed
    updateFields.push('viewed_at = COALESCE(viewed_at, NOW())');

    params.push(messageId);

    const result = await pool.query(
      `UPDATE admin_messages 
       SET ${updateFields.join(', ')}, updated_at = NOW()
       WHERE id = $${params.length}
       RETURNING *`,
      params
    );

    res.status(200).json({
      message: 'Message status updated successfully',
      adminMessage: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

// Get user profile by user ID (admin only)
export const getUserProfileByAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const adminId = req.userId;
    const { userId } = req.params;

    if (!adminId || req.userRole !== 'admin') {
      throw new CustomError('Admin access required', 403, 'FORBIDDEN');
    }

    if (!userId) {
      throw new CustomError('User ID is required', 400, 'VALIDATION_ERROR');
    }

    const result = await pool.query(
      'SELECT * FROM user_profiles WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.json({ profile: null });
    }

    res.json({ profile: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

// Delete a message (admin only)
export const deleteMessage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const adminId = req.userId;
    const { messageId } = req.params;

    if (!adminId || req.userRole !== 'admin') {
      throw new CustomError('Admin access required', 403, 'FORBIDDEN');
    }

    // Verify the message belongs to this admin
    const messageCheck = await pool.query(
      'SELECT id, admin_id FROM admin_messages WHERE id = $1',
      [messageId]
    );

    if (messageCheck.rows.length === 0) {
      throw new CustomError('Message not found', 404, 'NOT_FOUND');
    }

    if (messageCheck.rows[0].admin_id !== adminId) {
      throw new CustomError('You do not have permission to delete this message', 403, 'FORBIDDEN');
    }

    // Delete the message
    await pool.query(
      'DELETE FROM admin_messages WHERE id = $1',
      [messageId]
    );

    res.status(200).json({
      message: 'Message deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Admin updates user profile details
export const updateUserProfileByAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const adminId = req.userId;
    const { userId } = req.params;
    const { firstName, surname, dateOfBirth, ppsn, address } = req.body;

    if (!adminId || req.userRole !== 'admin') {
      throw new CustomError('Admin access required', 403, 'FORBIDDEN');
    }

    if (!userId) {
      throw new CustomError('User ID is required', 400, 'VALIDATION_ERROR');
    }

    // Verify the user exists and is not an admin
    const userCheck = await pool.query(
      'SELECT id, role FROM users WHERE id = $1',
      [userId]
    );

    if (userCheck.rows.length === 0) {
      throw new CustomError('User not found', 404, 'NOT_FOUND');
    }

    if (userCheck.rows[0].role === 'admin') {
      throw new CustomError('Cannot modify another admin\'s profile', 403, 'FORBIDDEN');
    }

    // Build dynamic update query
    const updateFields: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (firstName !== undefined) {
      updateFields.push(`first_name = $${paramIndex}`);
      params.push(firstName);
      paramIndex++;
    }

    if (surname !== undefined) {
      updateFields.push(`surname = $${paramIndex}`);
      params.push(surname);
      paramIndex++;
    }

    if (dateOfBirth !== undefined) {
      updateFields.push(`date_of_birth = $${paramIndex}::DATE`);
      params.push(dateOfBirth);
      paramIndex++;
    }

    if (ppsn !== undefined) {
      updateFields.push(`ppsn = $${paramIndex}`);
      params.push(ppsn);
      paramIndex++;
    }

    if (address !== undefined) {
      updateFields.push(`address = $${paramIndex}`);
      params.push(address);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      throw new CustomError('At least one field must be provided for update', 400, 'VALIDATION_ERROR');
    }

    updateFields.push(`updated_at = NOW()`);
    params.push(userId);

    // Update user profile
    const result = await pool.query(
      `UPDATE user_profiles 
       SET ${updateFields.join(', ')}
       WHERE user_id = $${paramIndex}
       RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      // Profile doesn't exist, create it
      const createFields: string[] = ['user_id'];
      const createValues: string[] = [`$${paramIndex}`];
      const createParams: any[] = [userId];
      let createIndex = paramIndex + 1;

      if (firstName !== undefined) {
        createFields.push('first_name');
        createValues.push(`$${createIndex}`);
        createParams.push(firstName);
        createIndex++;
      }
      if (surname !== undefined) {
        createFields.push('surname');
        createValues.push(`$${createIndex}`);
        createParams.push(surname);
        createIndex++;
      }
      if (dateOfBirth !== undefined) {
        createFields.push('date_of_birth');
        createValues.push(`$${createIndex}::DATE`);
        createParams.push(dateOfBirth);
        createIndex++;
      }
      if (ppsn !== undefined) {
        createFields.push('ppsn');
        createValues.push(`$${createIndex}`);
        createParams.push(ppsn);
        createIndex++;
      }
      if (address !== undefined) {
        createFields.push('address');
        createValues.push(`$${createIndex}`);
        createParams.push(address);
        createIndex++;
      }

      const createResult = await pool.query(
        `INSERT INTO user_profiles (${createFields.join(', ')})
         VALUES (${createValues.join(', ')})
         RETURNING *`,
        createParams
      );

      return res.status(200).json({
        message: 'User profile updated successfully',
        profile: createResult.rows[0]
      });
    }

    res.status(200).json({
      message: 'User profile updated successfully',
      profile: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};
