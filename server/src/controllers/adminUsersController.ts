import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import pool from '../config/database';
import { CustomError } from '../middleware/errorHandler';

// Get all users (admin only)
export const getAllUsers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.userId || req.userRole !== 'admin') {
      throw new CustomError('Admin access required', 403, 'FORBIDDEN');
    }

    const result = await pool.query(
      `SELECT 
        u.id,
        u.email,
        u.role,
        u.created_at,
        u.updated_at,
        u.banned,
        u.banned_until,
        u.ban_reason,
        u.banned_at,
        u.banned_by,
        admin.email as banned_by_email,
        up.first_name,
        up.surname,
        up.county,
        COUNT(DISTINCT i.id) as issues_count,
        COUNT(DISTINCT s.id) as suggestions_count
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      LEFT JOIN issues i ON u.id = i.user_id
      LEFT JOIN suggestions s ON u.id = s.user_id
      LEFT JOIN users admin ON u.banned_by = admin.id
      GROUP BY u.id, up.first_name, up.surname, up.county, admin.email
      ORDER BY u.created_at DESC`
    );

    res.status(200).json({ users: result.rows, count: result.rows.length });
  } catch (error) {
    next(error);
  }
};

// Ban a user
export const banUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.userId || req.userRole !== 'admin') {
      throw new CustomError('Admin access required', 403, 'FORBIDDEN');
    }

    const { userId, banType, reason } = req.body;

    if (!userId) {
      throw new CustomError('User ID is required', 400, 'VALIDATION_ERROR');
    }

    if (!banType || !['24h', '7d', 'permanent'].includes(banType)) {
      throw new CustomError('Invalid ban type. Must be "24h", "7d", or "permanent"', 400, 'VALIDATION_ERROR');
    }

    // Check if user exists and is not already an admin
    const userCheck = await pool.query(
      'SELECT id, role, email FROM users WHERE id = $1',
      [userId]
    );

    if (userCheck.rows.length === 0) {
      throw new CustomError('User not found', 404, 'NOT_FOUND');
    }

    if (userCheck.rows[0].role === 'admin') {
      throw new CustomError('Cannot ban another admin', 403, 'FORBIDDEN');
    }

    // Calculate ban expiration
    let bannedUntil: Date | null = null;
    if (banType === '24h') {
      bannedUntil = new Date();
      bannedUntil.setHours(bannedUntil.getHours() + 24);
    } else if (banType === '7d') {
      bannedUntil = new Date();
      bannedUntil.setDate(bannedUntil.getDate() + 7);
    }
    // For permanent bans, bannedUntil remains null

    // Update user
    const result = await pool.query(
      `UPDATE users 
       SET banned = TRUE,
           banned_until = $1,
           ban_reason = $2,
           banned_by = $3,
           banned_at = NOW()
       WHERE id = $4
       RETURNING id, email, banned, banned_until, ban_reason, banned_at`,
      [bannedUntil, reason || `Banned by admin: ${banType} ban`, req.userId, userId]
    );

    res.status(200).json({
      message: `User banned successfully (${banType})`,
      user: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

// Unban a user
export const unbanUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.userId || req.userRole !== 'admin') {
      throw new CustomError('Admin access required', 403, 'FORBIDDEN');
    }

    const { userId } = req.params;

    if (!userId) {
      throw new CustomError('User ID is required', 400, 'VALIDATION_ERROR');
    }

    // Update user
    const result = await pool.query(
      `UPDATE users 
       SET banned = FALSE,
           banned_until = NULL,
           ban_reason = NULL,
           banned_by = NULL,
           banned_at = NULL
       WHERE id = $1
       RETURNING id, email, banned`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new CustomError('User not found', 404, 'NOT_FOUND');
    }

    res.status(200).json({
      message: 'User unbanned successfully',
      user: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};
