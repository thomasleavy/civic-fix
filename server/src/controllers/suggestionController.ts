import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import pool from '../config/database';
import { CustomError } from '../middleware/errorHandler';
import { uploadToCloudinary } from '../services/cloudinaryService';
import { generateCaseId } from '../utils/caseIdGenerator';
import { sendStatusChangeNotification, sendAdminResponseNotification } from '../services/emailService';

// Helper function to get suggestion with images
const getSuggestionWithImages = async (suggestionId: string) => {
  const suggestionResult = await pool.query(
    `SELECT s.*, 
     u.email as admin_action_email
     FROM suggestions s
     LEFT JOIN users u ON s.admin_action_by = u.id
     WHERE s.id = $1`,
    [suggestionId]
  );

  if (suggestionResult.rows.length === 0) {
    return null;
  }

  const suggestion = suggestionResult.rows[0];

  // Get images
  const imagesResult = await pool.query(
    'SELECT cloudinary_url FROM suggestion_images WHERE suggestion_id = $1 ORDER BY created_at',
    [suggestionId]
  );

  const images = imagesResult.rows.map((row) => row.cloudinary_url).filter(url => url && url.trim() !== '');

  return {
    ...suggestion,
    images: images.length > 0 ? images : []
  };
};

export const createSuggestion = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN'); // Start transaction

    const { title, description, category, isPublic } = req.body;

    // Validate required fields
    if (!title || !title.trim()) {
      throw new CustomError('Title is required', 400, 'VALIDATION_ERROR');
    }

    if (!description || !description.trim()) {
      throw new CustomError('Description is required', 400, 'VALIDATION_ERROR');
    }

    if (!category || !category.trim()) {
      throw new CustomError('Category is required', 400, 'VALIDATION_ERROR');
    }

    // Get user's county from profile
    const profileResult = await client.query(
      'SELECT county FROM user_profiles WHERE user_id = $1',
      [req.userId]
    );
    const userCounty = profileResult.rows[0]?.county || null;

    // Validate that user has selected a county
    if (!userCounty) {
      throw new CustomError('Please select your county in your profile before submitting issues or suggestions', 400, 'VALIDATION_ERROR');
    }

    // Generate unique case ID
    let caseId = generateCaseId();
    let attempts = 0;
    const maxAttempts = 10;
    
    // Check for uniqueness across both issues and suggestions (retry if collision)
    while (attempts < maxAttempts) {
      const existingIssue = await client.query(
        'SELECT id FROM issues WHERE case_id = $1',
        [caseId]
      );
      const existingSuggestion = await client.query(
        'SELECT id FROM suggestions WHERE case_id = $1',
        [caseId]
      );
      if (existingIssue.rows.length === 0 && existingSuggestion.rows.length === 0) {
        break; // Case ID is unique across both tables
      }
      caseId = generateCaseId();
      attempts++;
    }

    // Create suggestion
    const isPublicValue = isPublic === true || isPublic === 'true';
    const suggestionResult = await client.query(
      `INSERT INTO suggestions (user_id, title, description, category, status, case_id, county, is_public)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        req.userId,
        title.trim(),
        description.trim(),
        category.trim(),
        'under_review',
        caseId,
        userCounty,
        isPublicValue
      ]
    );

    const suggestion = suggestionResult.rows[0];

    // Handle image uploads if present (only if Cloudinary is configured)
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      try {
        const imagePromises = (req.files as Express.Multer.File[]).map(async (file) => {
          const uploadResult = await uploadToCloudinary(file);
          await client.query(
            'INSERT INTO suggestion_images (suggestion_id, cloudinary_url, cloudinary_public_id) VALUES ($1, $2, $3)',
            [suggestion.id, uploadResult.url, uploadResult.public_id]
          );
          return uploadResult.url;
        });

        await Promise.all(imagePromises);
      } catch (cloudinaryError: any) {
        // Log Cloudinary error but don't fail the suggestion creation
        console.warn('Cloudinary upload failed (images will be skipped):', cloudinaryError.message);
        // Suggestion is still created, just without images
      }
    }

    // Commit transaction - only if everything succeeded
    await client.query('COMMIT');

    // Fetch suggestion with images
    const fullSuggestion = await getSuggestionWithImages(suggestion.id);

    res.status(201).json({
      message: 'Suggestion submitted successfully',
      suggestion: fullSuggestion
    });
  } catch (error: any) {
    // Rollback transaction on any error
    await client.query('ROLLBACK');
    
    console.error('Error creating suggestion:', error);
    // Log detailed database error information
    if (error.code) {
      console.error('Database error code:', error.code);
      console.error('Database error detail:', error.detail);
      console.error('Database error message:', error.message);
      console.error('Database error constraint:', error.constraint);
    }
    next(error);
  } finally {
    client.release(); // Release the client back to the pool
  }
};

export const getMySuggestions = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.userId) {
      throw new CustomError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    // Only return suggestions that have required fields
    const result = await pool.query(
      `SELECT * FROM suggestions 
       WHERE user_id = $1 
       AND title IS NOT NULL 
       AND title != ''
       AND description IS NOT NULL 
       AND description != ''
       AND category IS NOT NULL 
       AND category != ''
       ORDER BY created_at DESC`,
      [req.userId]
    );

    // Get images for each suggestion
    const suggestionsWithImages = await Promise.all(
      result.rows.map(async (suggestion) => await getSuggestionWithImages(suggestion.id))
    );

    res.json({
      suggestions: suggestionsWithImages,
      count: suggestionsWithImages.length
    });
  } catch (error) {
    next(error);
  }
};

export const getSuggestionById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const suggestion = await getSuggestionWithImages(id);

    if (!suggestion) {
      throw new CustomError('Suggestion not found', 404, 'NOT_FOUND');
    }

    // If suggestion is public, anyone can view it (even without authentication)
    // If suggestion is private, only the owner or an admin managing the suggestion's county can view it
    if (!suggestion.is_public) {
      if (!req.userId) {
        throw new CustomError('Authentication required to view private suggestions', 401, 'UNAUTHORIZED');
      }
      
      // Allow owner or admin managing this county to view
      if (suggestion.user_id !== req.userId) {
        // Check if user is admin and manages this county
        if (req.userRole === 'admin' && suggestion.county) {
          const adminLocationCheck = await pool.query(
            'SELECT id FROM admin_locations WHERE admin_id = $1 AND county = $2',
            [req.userId, suggestion.county]
          );
          if (adminLocationCheck.rows.length === 0) {
            throw new CustomError('You do not have permission to view this suggestion', 403, 'FORBIDDEN');
          }
        } else {
          throw new CustomError('You do not have permission to view this suggestion', 403, 'FORBIDDEN');
        }
      }
    }

    // Increment view count for public suggestions (track engagement)
    if (suggestion.is_public) {
      await pool.query(
        'UPDATE suggestions SET view_count = COALESCE(view_count, 0) + 1 WHERE id = $1',
        [id]
      );
      // Update the suggestion object to reflect the new view count
      suggestion.view_count = (suggestion.view_count || 0) + 1;
    }

    res.json({ suggestion });
  } catch (error) {
    next(error);
  }
};

export const updateSuggestionStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body;

    const validStatuses = ['submitted', 'under_review', 'approved', 'implemented', 'rejected'];
    if (!status || !validStatuses.includes(status)) {
      throw new CustomError('Invalid status', 400, 'VALIDATION_ERROR');
    }

    // Check if user is admin or suggestion owner
    const suggestionResult = await pool.query(
      'SELECT user_id, status as old_status, case_id, title FROM suggestions WHERE id = $1',
      [id]
    );

    if (suggestionResult.rows.length === 0) {
      throw new CustomError('Suggestion not found', 404, 'NOT_FOUND');
    }

    const suggestion = suggestionResult.rows[0];
    if (suggestion.user_id !== req.userId && req.userRole !== 'admin') {
      throw new CustomError('Not authorized to update this suggestion', 403, 'FORBIDDEN');
    }

    const oldStatus = suggestion.old_status;

    const result = await pool.query(
      'UPDATE suggestions SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, id]
    );

    const updatedSuggestion = await getSuggestionWithImages(id);

    // Send email notification if status changed and user is not the one updating
    if (oldStatus !== status && req.userRole === 'admin') {
      sendStatusChangeNotification(
        suggestion.user_id,
        suggestion.case_id,
        suggestion.title,
        oldStatus,
        status,
        'suggestion',
        adminNote
      ).catch(err => {
        console.error('Failed to send status change email:', err);
        // Don't fail the request if email fails
      });
    }

    res.json({
      message: 'Suggestion status updated',
      suggestion: updatedSuggestion
    });
  } catch (error) {
    next(error);
  }
};

// Add admin response to a suggestion
export const addAdminResponse = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (req.userRole !== 'admin') {
      throw new CustomError('Admin access required', 403, 'FORBIDDEN');
    }

    const { id } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      throw new CustomError('Message is required', 400, 'VALIDATION_ERROR');
    }

    // Get suggestion details
    const suggestionResult = await pool.query(
      'SELECT user_id, case_id, title FROM suggestions WHERE id = $1',
      [id]
    );

    if (suggestionResult.rows.length === 0) {
      throw new CustomError('Suggestion not found', 404, 'NOT_FOUND');
    }

    const suggestion = suggestionResult.rows[0];

    // Get admin name
    const adminResult = await pool.query(
      'SELECT email FROM users WHERE id = $1',
      [req.userId]
    );
    const adminEmail = adminResult.rows[0]?.email || 'Administrator';
    const adminName = adminEmail.split('@')[0];

    // Send email notification
    sendAdminResponseNotification(
      suggestion.user_id,
      suggestion.case_id,
      suggestion.title,
      'suggestion',
      message.trim(),
      adminName
    ).catch(err => {
      console.error('Failed to send admin response email:', err);
      // Don't fail the request if email fails
    });

    res.json({
      message: 'Admin response sent successfully'
    });
  } catch (error) {
    next(error);
  }
};
