import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import pool from '../config/database';
import { CustomError } from '../middleware/errorHandler';
import { sendStatusChangeNotification } from '../services/emailService';

// Get suggestions for admin's assigned counties (both public and private)
export const getSuggestionsForAdmin = async (
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
        suggestions: [],
        count: 0
      });
    }

    const counties = locationsResult.rows.map(row => row.county);

    // Get case ID filter from query params
    const caseIdFilter = req.query.caseId as string | undefined;

    // Build query with optional case ID filter
    let query = `SELECT s.*, 
              (SELECT COUNT(*) FROM appraisals WHERE suggestion_id = s.id) as appraisal_count,
              s.view_count
       FROM suggestions s
       WHERE s.county = ANY($1::text[])
       AND s.title IS NOT NULL 
       AND s.title != ''
       AND s.description IS NOT NULL 
       AND s.description != ''
       AND s.category IS NOT NULL 
       AND s.category != ''`;
    
    const params: any[] = [counties];
    
    if (caseIdFilter && caseIdFilter.trim() !== '') {
      query += ` AND s.case_id ILIKE $${params.length + 1}`;
      params.push(`%${caseIdFilter.trim()}%`);
    }
    
    query += ` ORDER BY s.created_at DESC`;

    const suggestionsResult = await pool.query(query, params);

    // Get images for each suggestion
    const suggestionsWithImages = await Promise.all(
      suggestionsResult.rows.map(async (suggestion) => {
        const imagesResult = await pool.query(
          'SELECT cloudinary_url FROM suggestion_images WHERE suggestion_id = $1 ORDER BY created_at',
          [suggestion.id]
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
          ...suggestion,
          images: images.length > 0 ? images : [],
          appraisalCount: parseInt(suggestion.appraisal_count) || 0
        };
      })
    );

    res.json({
      suggestions: suggestionsWithImages,
      count: suggestionsWithImages.length
    });
  } catch (error) {
    next(error);
  }
};

// Update suggestion status (accept/reject)
export const updateSuggestionStatus = async (
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
      throw new CustomError('Admin note is required when accepting or rejecting a suggestion', 400, 'VALIDATION_ERROR');
    }

    // Check if admin has access to this suggestion's county
    const suggestionResult = await pool.query('SELECT county FROM suggestions WHERE id = $1', [id]);
    if (suggestionResult.rows.length === 0) {
      throw new CustomError('Suggestion not found', 404, 'NOT_FOUND');
    }

    const suggestionCounty = suggestionResult.rows[0].county;
    const adminLocationsResult = await pool.query(
      'SELECT county FROM admin_locations WHERE admin_id = $1 AND county = $2',
      [adminId, suggestionCounty]
    );

    if (adminLocationsResult.rows.length === 0) {
      throw new CustomError('You do not have permission to manage this suggestion', 403, 'FORBIDDEN');
    }

    // Update suggestion status and admin note if provided
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
      `UPDATE suggestions SET ${updateFields.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params
    );

    // Send email notification to user
    try {
      const suggestionResult = await pool.query(
        'SELECT s.user_id, s.title, s.case_id, s.status as old_status FROM suggestions s WHERE s.id = $1',
        [id]
      );
      if (suggestionResult.rows.length > 0) {
        const { user_id, title, case_id, old_status } = suggestionResult.rows[0];
        await sendStatusChangeNotification(user_id, case_id, title, old_status, status, 'suggestion', adminNote);
      }
    } catch (emailError) {
      console.error('Failed to send status change notification:', emailError);
      // Don't fail the request if email fails
    }

    res.json({
      message: 'Suggestion status updated successfully',
      suggestion: updateResult.rows[0]
    });
  } catch (error) {
    next(error);
  }
};
