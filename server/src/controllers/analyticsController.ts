import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import pool from '../config/database';
import { CustomError } from '../middleware/errorHandler';

// Get category analytics
export const getCategoryAnalytics = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.userId) {
      throw new CustomError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    // Get most reported categories from issues
    const issuesByCategory = await pool.query(
      `SELECT 
        category,
        COUNT(*) as count
      FROM issues
      WHERE category IS NOT NULL
      GROUP BY category
      ORDER BY count DESC
      LIMIT 10`
    );

    // Get most reported categories from suggestions
    const suggestionsByCategory = await pool.query(
      `SELECT 
        category,
        COUNT(*) as count
      FROM suggestions
      WHERE category IS NOT NULL
      GROUP BY category
      ORDER BY count DESC
      LIMIT 10`
    );

    // Combine and aggregate
    const categoryMap = new Map<string, { issues: number; suggestions: number; total: number }>();

    issuesByCategory.rows.forEach((row: any) => {
      const category = row.category;
      const count = parseInt(row.count);
      categoryMap.set(category, {
        issues: count,
        suggestions: 0,
        total: count
      });
    });

    suggestionsByCategory.rows.forEach((row: any) => {
      const category = row.category;
      const count = parseInt(row.count);
      const existing = categoryMap.get(category) || { issues: 0, suggestions: 0, total: 0 };
      existing.suggestions = count;
      existing.total = existing.issues + existing.suggestions;
      categoryMap.set(category, existing);
    });

    // Convert to array and sort by total
    const categories = Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        ...data
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    res.status(200).json({ categories });
  } catch (error) {
    next(error);
  }
};

// Get trends over time
export const getTrendsOverTime = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.userId) {
      throw new CustomError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    const { period = '30' } = req.query; // days, default 30
    const days = parseInt(period as string);
    
    // Validate days parameter
    if (isNaN(days) || days < 1 || days > 365) {
      throw new CustomError('Invalid period. Must be between 1 and 365 days', 400, 'VALIDATION_ERROR');
    }

    // Get issues created over time
    const issuesTrend = await pool.query(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM issues
      WHERE created_at >= NOW() - make_interval(days => $1)
      GROUP BY DATE(created_at)
      ORDER BY date ASC`,
      [days]
    );

    // Get suggestions created over time
    const suggestionsTrend = await pool.query(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM suggestions
      WHERE created_at >= NOW() - make_interval(days => $1)
      GROUP BY DATE(created_at)
      ORDER BY date ASC`,
      [days]
    );

    // Get resolved issues over time
    const resolvedTrend = await pool.query(
      `SELECT 
        DATE(updated_at) as date,
        COUNT(*) as count
      FROM issues
      WHERE status = 'resolved'
        AND updated_at >= NOW() - make_interval(days => $1)
      GROUP BY DATE(updated_at)
      ORDER BY date ASC`,
      [days]
    );

    res.status(200).json({
      issues: issuesTrend.rows.map((row: any) => ({
        date: row.date,
        count: parseInt(row.count)
      })),
      suggestions: suggestionsTrend.rows.map((row: any) => ({
        date: row.date,
        count: parseInt(row.count)
      })),
      resolved: resolvedTrend.rows.map((row: any) => ({
        date: row.date,
        count: parseInt(row.count)
      }))
    });
  } catch (error) {
    next(error);
  }
};

// Get geographic distribution
export const getGeographicDistribution = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.userId) {
      throw new CustomError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    // Get issues by county
    const issuesByCounty = await pool.query(
      `SELECT 
        county,
        COUNT(*) as count,
        COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_count,
        COUNT(CASE WHEN status = 'under_review' THEN 1 END) as under_review_count,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_count
      FROM issues
      WHERE county IS NOT NULL
      GROUP BY county
      ORDER BY count DESC`
    );

    // Get suggestions by county
    const suggestionsByCounty = await pool.query(
      `SELECT 
        county,
        COUNT(*) as count,
        COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_count,
        COUNT(CASE WHEN status = 'under_review' THEN 1 END) as under_review_count,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_count
      FROM suggestions
      WHERE county IS NOT NULL
      GROUP BY county
      ORDER BY count DESC`
    );

    // Combine data
    const countyMap = new Map<string, any>();

    issuesByCounty.rows.forEach((row: any) => {
      const county = row.county;
      countyMap.set(county, {
        county,
        issues: {
          total: parseInt(row.count),
          resolved: parseInt(row.resolved_count),
          underReview: parseInt(row.under_review_count),
          inProgress: parseInt(row.in_progress_count)
        },
        suggestions: {
          total: 0,
          resolved: 0,
          underReview: 0,
          inProgress: 0
        }
      });
    });

    suggestionsByCounty.rows.forEach((row: any) => {
      const county = row.county;
      const existing = countyMap.get(county) || {
        county,
        issues: { total: 0, resolved: 0, underReview: 0, inProgress: 0 },
        suggestions: { total: 0, resolved: 0, underReview: 0, inProgress: 0 }
      };
      existing.suggestions = {
        total: parseInt(row.count),
        resolved: parseInt(row.resolved_count),
        underReview: parseInt(row.under_review_count),
        inProgress: parseInt(row.in_progress_count)
      };
      countyMap.set(county, existing);
    });

    const distribution = Array.from(countyMap.values())
      .map((data) => ({
        ...data,
        total: data.issues.total + data.suggestions.total
      }))
      .sort((a, b) => b.total - a.total);

    res.status(200).json({ distribution });
  } catch (error) {
    next(error);
  }
};

// Get overall statistics
export const getOverallStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.userId) {
      throw new CustomError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    // Total counts
    const totalIssues = await pool.query('SELECT COUNT(*) as count FROM issues');
    const totalSuggestions = await pool.query('SELECT COUNT(*) as count FROM suggestions');
    const totalUsers = await pool.query('SELECT COUNT(*) as count FROM users WHERE role = \'user\'');
    const totalResolved = await pool.query('SELECT COUNT(*) as count FROM issues WHERE status = \'resolved\'');
    const totalResolvedSuggestions = await pool.query('SELECT COUNT(*) as count FROM suggestions WHERE status = \'resolved\'');

    // Status breakdown
    const issuesByStatus = await pool.query(
      `SELECT status, COUNT(*) as count 
       FROM issues 
       GROUP BY status`
    );

    const suggestionsByStatus = await pool.query(
      `SELECT status, COUNT(*) as count 
       FROM suggestions 
       GROUP BY status`
    );

    res.status(200).json({
      totals: {
        issues: parseInt(totalIssues.rows[0].count),
        suggestions: parseInt(totalSuggestions.rows[0].count),
        users: parseInt(totalUsers.rows[0].count),
        resolved: parseInt(totalResolved.rows[0].count) + parseInt(totalResolvedSuggestions.rows[0].count)
      },
      issuesByStatus: issuesByStatus.rows.map((row: any) => ({
        status: row.status,
        count: parseInt(row.count)
      })),
      suggestionsByStatus: suggestionsByStatus.rows.map((row: any) => ({
        status: row.status,
        count: parseInt(row.count)
      }))
    });
  } catch (error) {
    next(error);
  }
};
