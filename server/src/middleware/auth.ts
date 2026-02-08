import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { CustomError } from './errorHandler';
import pool from '../config/database';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new CustomError('No token provided', 401, 'UNAUTHORIZED');
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new CustomError('JWT_SECRET not configured', 500, 'CONFIG_ERROR');
    }
    
    const decoded = jwt.verify(token, jwtSecret) as {
      userId: string;
      role: string;
    };

    // Check if user is banned
    const userCheck = await pool.query(
      'SELECT banned, banned_until FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userCheck.rows.length > 0) {
      const user = userCheck.rows[0];
      
      if (user.banned) {
        // Check if ban has expired
        if (user.banned_until) {
          const now = new Date();
          const banUntil = new Date(user.banned_until);
          
          if (now > banUntil) {
            // Ban expired, unban the user
            await pool.query(
              'UPDATE users SET banned = FALSE, banned_until = NULL, ban_reason = NULL, banned_by = NULL, banned_at = NULL WHERE id = $1',
              [decoded.userId]
            );
          } else {
            // User is still banned - don't throw error, let them access /banned page
            // The frontend will handle the redirect
            req.userId = decoded.userId;
            req.userRole = decoded.role;
            return next(); // Allow them to proceed so they can access /banned endpoint
          }
        } else {
          // Permanent ban - don't throw error, let them access /banned page
          req.userId = decoded.userId;
          req.userRole = decoded.role;
          return next(); // Allow them to proceed so they can access /banned endpoint
        }
      }
    }

    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new CustomError('Invalid token', 401, 'INVALID_TOKEN');
    }
    next(error);
  }
};

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.userRole !== 'admin') {
    throw new CustomError('Admin access required', 403, 'FORBIDDEN');
  }
  next();
};

// Optional authentication - doesn't throw error if no token, but sets userId/userRole if valid token provided
export const optionalAuthenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided - continue without authentication
      return next();
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      // JWT_SECRET not configured - continue without authentication
      return next();
    }
    
    try {
      const decoded = jwt.verify(token, jwtSecret) as {
        userId: string;
        role: string;
      };

      req.userId = decoded.userId;
      req.userRole = decoded.role;
    } catch (jwtError) {
      // Invalid token - continue without authentication
      // Don't throw error, just proceed without setting userId/userRole
    }
    
    next();
  } catch (error) {
    // Any other error - continue without authentication
    next();
  }
};
