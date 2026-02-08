import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import pool from '../config/database';
import { CustomError } from '../middleware/errorHandler';
import { sendStatusChangeNotification } from '../services/emailService';

// Get issues for admin's assigned counties (both public and private)
export const getIssuesForAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const adminId = req.userId;

    if (!adminId) {
      throw new CustomError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    // Get counties this admin manages
    const locationsResult = await pool.query(
      'SELECT county FROM admin_locations WHERE admin_id = $1',
      [adminId]
    );

    if (locationsResult.rows.length === 0) {
      return res.json({
        issues: [],
        count: 0
      });
    }

    const counties = locationsResult.rows.map(row => row.county);

    // Get case ID filter from query params
    const caseIdFilter = req.query.caseId as string | undefined;

    // Build query with optional case ID filter
    let query = `SELECT i.*, 
              (SELECT COUNT(*) FROM appraisals WHERE issue_id = i.id) as appraisal_count,
              i.view_count
       FROM issues i
       WHERE i.county = ANY($1::text[])
       AND i.title IS NOT NULL 
       AND i.title != ''
       AND i.description IS NOT NULL 
       AND i.description != ''
       AND i.category IS NOT NULL 
       AND i.category != ''`;
    
    const params: any[] = [counties];
    
    if (caseIdFilter && caseIdFilter.trim() !== '') {
      query += ` AND i.case_id ILIKE $${params.length + 1}`;
      params.push(`%${caseIdFilter.trim()}%`);
    }
    
    query += ` ORDER BY i.created_at DESC`;

    const issuesResult = await pool.query(query, params);

    // Get images for each issue
    const issuesWithImages = await Promise.all(
      issuesResult.rows.map(async (issue) => {
        const imagesResult = await pool.query(
          'SELECT cloudinary_url FROM issue_images WHERE issue_id = $1 ORDER BY created_at',
          [issue.id]
        );

        const backendUrl = process.env.BACKEND_URL || process.env.API_URL || 'http://localhost:5000';
        const images = imagesResult.rows
          .map((row) => {
            const url = row.cloudinary_url;
            if (!url || url.trim() === '') return null;
            if (url.startsWith('/uploads')) {
              return `${backendUrl}${url}`;
            }
            if (url.startsWith('http')) {
              return url;
            }
            return `${backendUrl}${url.startsWith('/') ? url : '/' + url}`;
          })
          .filter((url): url is string => url !== null);

        return {
          ...issue,
          images: images.length > 0 ? images : [],
          appraisalCount: parseInt(issue.appraisal_count) || 0
        };
      })
    );

    res.json({
      issues: issuesWithImages,
      count: issuesWithImages.length
    });
  } catch (error) {
    next(error);
  }
};

// Update issue status (accept/reject)
export const updateIssueStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body;
    const adminId = req.userId;

    if (!adminId) {
      throw new CustomError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    // Validate status
    const validStatuses = ['under_review', 'accepted', 'rejected', 'in_progress', 'resolved'];
    if (!validStatuses.includes(status)) {
      throw new CustomError('Invalid status', 400, 'VALIDATION_ERROR');
    }

    // Require admin note for accept/reject actions
    if ((status === 'accepted' || status === 'rejected') && (!adminNote || adminNote.trim() === '')) {
      throw new CustomError('Admin note is required when accepting or rejecting an issue', 400, 'VALIDATION_ERROR');
    }

    // Check if admin has access to this issue's county
    const issueResult = await pool.query('SELECT county FROM issues WHERE id = $1', [id]);
    if (issueResult.rows.length === 0) {
      throw new CustomError('Issue not found', 404, 'NOT_FOUND');
    }

    const issueCounty = issueResult.rows[0].county;
    const adminLocationsResult = await pool.query(
      'SELECT county FROM admin_locations WHERE admin_id = $1 AND county = $2',
      [adminId, issueCounty]
    );

    if (adminLocationsResult.rows.length === 0) {
      throw new CustomError('You do not have permission to manage this issue', 403, 'FORBIDDEN');
    }

    // Update issue status and admin note if provided
    const updateFields: string[] = ['status = $1', 'updated_at = NOW()'];
    const params: any[] = [status];

    if (status === 'accepted' || status === 'rejected') {
      updateFields.push('admin_note = $' + (params.length + 1));
      updateFields.push('admin_action_by = $' + (params.length + 2));
      updateFields.push('admin_action_at = NOW()');
      params.push(adminNote, adminId);
    }

    params.push(id);

    const updateResult = await pool.query(
      `UPDATE issues SET ${updateFields.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params
    );

    // Send email notification to user
    try {
      const issueResult = await pool.query(
        'SELECT i.user_id, i.title, i.case_id, i.status as old_status FROM issues i WHERE i.id = $1',
        [id]
      );
      if (issueResult.rows.length > 0) {
        const { user_id, title, case_id, old_status } = issueResult.rows[0];
        await sendStatusChangeNotification(user_id, case_id, title, old_status, status, 'issue', adminNote);
      }
    } catch (emailError) {
      console.error('Failed to send status change notification:', emailError);
      // Don't fail the request if email fails
    }

    res.json({
      message: 'Issue status updated successfully',
      issue: updateResult.rows[0]
    });
  } catch (error) {
    next(error);
  }
};
