import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import pool from '../config/database';
import { CustomError } from '../middleware/errorHandler';

// Get ban details for the authenticated user
export const getBanDetails = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.userId) {
      throw new CustomError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    const result = await pool.query(
      `SELECT 
        u.banned,
        u.banned_until,
        u.ban_reason,
        u.banned_at,
        u.banned_by,
        admin.email as banned_by_email
      FROM users u
      LEFT JOIN users admin ON u.banned_by = admin.id
      WHERE u.id = $1`,
      [req.userId]
    );

    if (result.rows.length === 0) {
      throw new CustomError('User not found', 404, 'NOT_FOUND');
    }

    const user = result.rows[0];

    // Check if ban has expired
    if (user.banned && user.banned_until) {
      const now = new Date();
      const banUntil = new Date(user.banned_until);
      
      if (now > banUntil) {
        // Ban expired, unban the user
        await pool.query(
          'UPDATE users SET banned = FALSE, banned_until = NULL, ban_reason = NULL, banned_by = NULL, banned_at = NULL WHERE id = $1',
          [req.userId]
        );
        
        return res.status(200).json({
          banned: false,
          message: 'Your ban has expired. You can now access the platform.'
        });
      }
    }

    // If not banned or permanent ban
    if (!user.banned) {
      return res.status(200).json({
        banned: false
      });
    }

    // User is banned
    res.status(200).json({
      banned: true,
      bannedUntil: user.banned_until,
      banReason: user.ban_reason,
      bannedAt: user.banned_at,
      bannedBy: user.banned_by_email,
      isPermanent: !user.banned_until
    });
  } catch (error) {
    next(error);
  }
};
