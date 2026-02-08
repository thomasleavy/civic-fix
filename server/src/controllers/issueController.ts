import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import pool from '../config/database';
import { CustomError } from '../middleware/errorHandler';
import { uploadToCloudinary } from '../services/cloudinaryService';
import { generateCaseId } from '../utils/caseIdGenerator';
import { sendStatusChangeNotification, sendAdminResponseNotification } from '../services/emailService';

export const createIssue = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN'); // Start transaction

    const { title, description, category, latitude, longitude, address, type, isPublic } = req.body;

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

    // Validate type
    const issueType = type === 'suggestion' ? 'suggestion' : 'issue';

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

    // Create issue or suggestion (latitude/longitude are now optional)
    const isPublicValue = isPublic === true || isPublic === 'true';
    const issueResult = await client.query(
      `INSERT INTO issues (user_id, title, description, category, status, latitude, longitude, address, type, case_id, county, is_public)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        req.userId,
        title.trim(),
        description.trim(),
        category.trim(),
        'under_review',
        latitude || null,
        longitude || null,
        address || null,
        issueType,
        caseId,
        userCounty,
        isPublicValue
      ]
    );

    const issue = issueResult.rows[0];

    // Handle image uploads if present (only if Cloudinary is configured)
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      try {
        const imagePromises = (req.files as Express.Multer.File[]).map(async (file) => {
          const uploadResult = await uploadToCloudinary(file);
          await client.query(
            'INSERT INTO issue_images (issue_id, cloudinary_url, cloudinary_public_id) VALUES ($1, $2, $3)',
            [issue.id, uploadResult.url, uploadResult.public_id]
          );
          return uploadResult.url;
        });

        await Promise.all(imagePromises);
      } catch (cloudinaryError: any) {
        // Log error but don't fail the issue creation
        console.error('Image upload failed:', cloudinaryError);
        // Issue is still created, just without images
        // The uploadToCloudinary function should handle fallback internally
      }
    }

    // Commit transaction - only if everything succeeded
    await client.query('COMMIT');

    // Fetch issue with images
    const fullIssue = await getIssueWithImages(issue.id);

    res.status(201).json({
      message: 'Issue created successfully',
      issue: fullIssue
    });
  } catch (error: any) {
    // Rollback transaction on any error
    await client.query('ROLLBACK');
    
    console.error('Error creating issue:', error);
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

export const getIssues = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { category, status, type, limit = 50, offset = 0 } = req.query;

    let query = 'SELECT * FROM issues WHERE 1=1';
    const params: any[] = [];
    let paramCount = 0;

    if (category) {
      paramCount++;
      query += ` AND category = $${paramCount}`;
      params.push(category);
    }

    if (status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      params.push(status);
    }

    if (type) {
      paramCount++;
      query += ` AND type = $${paramCount}`;
      params.push(type);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(parseInt(limit as string), parseInt(offset as string));

    const result = await pool.query(query, params);

    // Get images for each issue
    const issuesWithImages = await Promise.all(
      result.rows.map(async (issue) => await getIssueWithImages(issue.id))
    );

    res.json({
      issues: issuesWithImages,
      count: issuesWithImages.length
    });
  } catch (error) {
    next(error);
  }
};

export const getIssueById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const issue = await getIssueWithImages(id);

    if (!issue) {
      throw new CustomError('Issue not found', 404, 'NOT_FOUND');
    }

    // If issue is public, anyone can view it (even without authentication)
    // If issue is private, only the owner or an admin managing the issue's county can view it
    if (!issue.is_public) {
      if (!req.userId) {
        throw new CustomError('Authentication required to view private issues', 401, 'UNAUTHORIZED');
      }
      
      // Allow owner or admin managing this county to view
      if (issue.user_id !== req.userId) {
        // Check if user is admin and manages this county
        if (req.userRole === 'admin' && issue.county) {
          const adminLocationCheck = await pool.query(
            'SELECT id FROM admin_locations WHERE admin_id = $1 AND county = $2',
            [req.userId, issue.county]
          );
          if (adminLocationCheck.rows.length === 0) {
            throw new CustomError('You do not have permission to view this issue', 403, 'FORBIDDEN');
          }
        } else {
          throw new CustomError('You do not have permission to view this issue', 403, 'FORBIDDEN');
        }
      }
    }

    // Increment view count for public issues (track engagement)
    if (issue.is_public) {
      await pool.query(
        'UPDATE issues SET view_count = COALESCE(view_count, 0) + 1 WHERE id = $1',
        [id]
      );
      // Update the issue object to reflect the new view count
      issue.view_count = (issue.view_count || 0) + 1;
    }

    res.json({ issue });
  } catch (error) {
    next(error);
  }
};

export const getMyIssues = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.userId) {
      throw new CustomError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    // Only return issues that have required fields (title, description, category)
    // This filters out any incomplete issues that may have been partially saved
    const result = await pool.query(
      `SELECT * FROM issues 
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

    // Get images for each issue
    const issuesWithImages = await Promise.all(
      result.rows.map(async (issue) => await getIssueWithImages(issue.id))
    );

    res.json({
      issues: issuesWithImages,
      count: issuesWithImages.length
    });
  } catch (error) {
    next(error);
  }
};

export const updateIssueStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body;

    const validStatuses = ['under_review', 'in_progress', 'resolved', 'closed'];
    if (!status || !validStatuses.includes(status)) {
      throw new CustomError('Invalid status', 400, 'VALIDATION_ERROR');
    }

    // Check if user is admin or issue owner
    const issueResult = await pool.query(
      'SELECT user_id, status as old_status, case_id, title FROM issues WHERE id = $1', 
      [id]
    );
    
    if (issueResult.rows.length === 0) {
      throw new CustomError('Issue not found', 404, 'NOT_FOUND');
    }

    const issue = issueResult.rows[0];
    if (issue.user_id !== req.userId && req.userRole !== 'admin') {
      throw new CustomError('Not authorized to update this issue', 403, 'FORBIDDEN');
    }

    const oldStatus = issue.old_status;

    const result = await pool.query(
      'UPDATE issues SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, id]
    );

    const updatedIssue = await getIssueWithImages(id);

    // Send email notification if status changed and user is not the one updating
    if (oldStatus !== status && req.userRole === 'admin') {
      sendStatusChangeNotification(
        issue.user_id,
        issue.case_id,
        issue.title,
        oldStatus,
        status,
        'issue',
        adminNote
      ).catch(err => {
        console.error('Failed to send status change email:', err);
        // Don't fail the request if email fails
      });
    }

    res.json({
      message: 'Issue status updated',
      issue: updatedIssue
    });
  } catch (error) {
    next(error);
  }
};

// Add admin response to an issue
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

    // Get issue details
    const issueResult = await pool.query(
      'SELECT user_id, case_id, title FROM issues WHERE id = $1',
      [id]
    );

    if (issueResult.rows.length === 0) {
      throw new CustomError('Issue not found', 404, 'NOT_FOUND');
    }

    const issue = issueResult.rows[0];

    // In a real implementation, you might want to store admin responses in a separate table
    // For now, we'll just send the email notification
    // You could add an admin_responses table later if needed

    // Get admin name
    const adminResult = await pool.query(
      'SELECT email FROM users WHERE id = $1',
      [req.userId]
    );
    const adminEmail = adminResult.rows[0]?.email || 'Administrator';
    const adminName = adminEmail.split('@')[0];

    // Send email notification
    sendAdminResponseNotification(
      issue.user_id,
      issue.case_id,
      issue.title,
      'issue',
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

// Helper function to get issue with images
async function getIssueWithImages(issueId: string) {
  const issueResult = await pool.query(
    `SELECT i.*, 
     u.email as admin_action_email
     FROM issues i
     LEFT JOIN users u ON i.admin_action_by = u.id
     WHERE i.id = $1`,
    [issueId]
  );
  
  if (issueResult.rows.length === 0) {
    return null;
  }

  const issue = issueResult.rows[0];
  const imagesResult = await pool.query(
    'SELECT cloudinary_url FROM issue_images WHERE issue_id = $1 ORDER BY created_at',
    [issueId]
  );

  const images = imagesResult.rows.map(row => row.cloudinary_url).filter(url => url && url.trim() !== '');

  return {
    ...issue,
    images: images.length > 0 ? images : []
  };
}
