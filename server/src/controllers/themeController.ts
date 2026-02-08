import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import pool from '../config/database';
import { CustomError } from '../middleware/errorHandler';

// Get user's theme preference
export const getThemePreference = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;

    if (!userId) {
      // Return default for non-authenticated users
      return res.json({ theme: 'light' });
    }

    try {
      const result = await pool.query(
        'SELECT theme_preference FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        return res.json({ theme: 'light' });
      }

      res.json({
        theme: result.rows[0].theme_preference || 'light'
      });
    } catch (dbError: any) {
      // If column doesn't exist yet, return default
      if (dbError.code === '42703') {
        return res.json({ theme: 'light' });
      }
      throw dbError;
    }
  } catch (error) {
    next(error);
  }
};

// Set user's theme preference
export const setThemePreference = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { theme } = req.body;
    const userId = req.userId;

    if (!userId) {
      throw new CustomError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    if (theme !== 'light' && theme !== 'dark') {
      throw new CustomError('Invalid theme. Must be "light" or "dark"', 400, 'VALIDATION_ERROR');
    }

    try {
      const result = await pool.query(
        'UPDATE users SET theme_preference = $1 WHERE id = $2 RETURNING theme_preference',
        [theme, userId]
      );

      res.json({
        message: 'Theme preference updated successfully',
        theme: result.rows[0].theme_preference
      });
    } catch (dbError: any) {
      // If column doesn't exist yet, still return success (theme saved in localStorage)
      if (dbError.code === '42703') {
        return res.json({
          message: 'Theme preference will be saved after migration',
          theme: theme
        });
      }
      throw dbError;
    }
  } catch (error) {
    next(error);
  }
};
