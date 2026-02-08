import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import pool from '../config/database';
import { CustomError } from '../middleware/errorHandler';

export const getAllIssuesAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status, category, limit = 100, offset = 0 } = req.query;

    let query = 'SELECT * FROM issues WHERE 1=1';
    const params: any[] = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      params.push(status);
    }

    if (category) {
      paramCount++;
      query += ` AND category = $${paramCount}`;
      params.push(category);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(parseInt(limit as string), parseInt(offset as string));

    const result = await pool.query(query, params);

    res.json({
      issues: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    next(error);
  }
};

export const deleteIssue = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    // Delete images first (cascade should handle this, but explicit is better)
    await pool.query('DELETE FROM issue_images WHERE issue_id = $1', [id]);

    // Delete issue
    const result = await pool.query('DELETE FROM issues WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      throw new CustomError('Issue not found', 404, 'NOT_FOUND');
    }

    res.json({ message: 'Issue deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const totalIssues = await pool.query('SELECT COUNT(*) FROM issues');
    const byStatus = await pool.query(
      'SELECT status, COUNT(*) as count FROM issues GROUP BY status'
    );
    const byCategory = await pool.query(
      'SELECT category, COUNT(*) as count FROM issues GROUP BY category'
    );

    res.json({
      total: parseInt(totalIssues.rows[0].count),
      byStatus: byStatus.rows.reduce((acc, row) => {
        acc[row.status] = parseInt(row.count);
        return acc;
      }, {} as Record<string, number>),
      byCategory: byCategory.rows.reduce((acc, row) => {
        acc[row.category] = parseInt(row.count);
        return acc;
      }, {} as Record<string, number>)
    });
  } catch (error) {
    next(error);
  }
};

// Manual trigger for weekly email summaries (admin only, for testing)
export const triggerWeeklyEmails = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (req.userRole !== 'admin') {
      throw new CustomError('Admin access required', 403, 'FORBIDDEN');
    }

    const { triggerWeeklySummary } = require('../services/scheduler');
    await triggerWeeklySummary();

    res.json({
      message: 'Weekly email summaries triggered successfully'
    });
  } catch (error) {
    next(error);
  }
};
