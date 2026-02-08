import { Request, Response, NextFunction } from 'express';
import pool from '../config/database';
import { CustomError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

// Toggle like/appraisal for an issue or suggestion
export const toggleAppraisal = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { type } = req.body; // 'issue' or 'suggestion'

    if (!req.userId) {
      throw new CustomError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    if (!type || (type !== 'issue' && type !== 'suggestion')) {
      throw new CustomError('Invalid type. Must be "issue" or "suggestion"', 400, 'VALIDATION_ERROR');
    }

    // Check if the issue/suggestion exists and is public
    let targetTable: string;
    let targetIdColumn: string;
    
    if (type === 'issue') {
      targetTable = 'issues';
      targetIdColumn = 'issue_id';
    } else {
      targetTable = 'suggestions';
      targetIdColumn = 'suggestion_id';
    }

    const targetResult = await pool.query(
      `SELECT id, is_public FROM ${targetTable} WHERE id = $1`,
      [id]
    );

    if (targetResult.rows.length === 0) {
      throw new CustomError(`${type} not found`, 404, 'NOT_FOUND');
    }

    const target = targetResult.rows[0];

    // Only allow appraisals on public items
    if (!target.is_public) {
      throw new CustomError('Appraisals can only be added to public items', 403, 'FORBIDDEN');
    }

    // Check if user has already liked this item
    const existingAppraisal = await pool.query(
      `SELECT id FROM appraisals WHERE user_id = $1 AND ${targetIdColumn} = $2`,
      [req.userId, id]
    );

    if (existingAppraisal.rows.length > 0) {
      // Unlike - remove the appraisal
      await pool.query(
        `DELETE FROM appraisals WHERE user_id = $1 AND ${targetIdColumn} = $2`,
        [req.userId, id]
      );

      // Get updated count
      const countResult = await pool.query(
        `SELECT COUNT(*) as count FROM appraisals WHERE ${targetIdColumn} = $1`,
        [id]
      );

      res.json({
        message: 'Appraisal removed',
        liked: false,
        count: parseInt(countResult.rows[0].count)
      });
    } else {
      // Like - add the appraisal
      await pool.query(
        `INSERT INTO appraisals (user_id, ${targetIdColumn}) VALUES ($1, $2)`,
        [req.userId, id]
      );

      // Get updated count
      const countResult = await pool.query(
        `SELECT COUNT(*) as count FROM appraisals WHERE ${targetIdColumn} = $1`,
        [id]
      );

      res.json({
        message: 'Appraisal added',
        liked: true,
        count: parseInt(countResult.rows[0].count)
      });
    }
  } catch (error) {
    next(error);
  }
};

// Get appraisal status for a user (whether they've liked an item)
export const getAppraisalStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { type } = req.query; // 'issue' or 'suggestion'

    if (!type || (type !== 'issue' && type !== 'suggestion')) {
      throw new CustomError('Invalid type. Must be "issue" or "suggestion"', 400, 'VALIDATION_ERROR');
    }

    const targetIdColumn = type === 'issue' ? 'issue_id' : 'suggestion_id';

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) as count FROM appraisals WHERE ${targetIdColumn} = $1`,
      [id]
    );

    const count = parseInt(countResult.rows[0].count);
    let liked = false;

    // If user is authenticated, check if they've liked it
    if (req.userId) {
      const userAppraisal = await pool.query(
        `SELECT id FROM appraisals WHERE user_id = $1 AND ${targetIdColumn} = $2`,
        [req.userId, id]
      );
      liked = userAppraisal.rows.length > 0;
    }

    res.json({
      count,
      liked
    });
  } catch (error) {
    next(error);
  }
};

// Get appraisal counts for multiple items (for civic space)
export const getAppraisalCounts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { items } = req.body; // Array of { id, type } objects

    if (!Array.isArray(items)) {
      throw new CustomError('Items must be an array', 400, 'VALIDATION_ERROR');
    }

    const counts: Record<string, { count: number; liked?: boolean }> = {};

    // Get counts for all items
    for (const item of items) {
      const { id, type } = item;
      const targetIdColumn = type === 'issue' ? 'issue_id' : 'suggestion_id';

      const countResult = await pool.query(
        `SELECT COUNT(*) as count FROM appraisals WHERE ${targetIdColumn} = $1`,
        [id]
      );

      counts[`${type}_${id}`] = {
        count: parseInt(countResult.rows[0].count)
      };
    }

    res.json({ counts });
  } catch (error) {
    next(error);
  }
};
