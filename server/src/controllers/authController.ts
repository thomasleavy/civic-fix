import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import pool from '../config/database';
import { CustomError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password, recaptchaToken, adminCode } = req.body;

    if (!email || !password) {
      throw new CustomError('Email and password are required', 400, 'VALIDATION_ERROR');
    }

    // Verify reCAPTCHA if secret key is configured
    // Skip verification in development if DISABLE_RECAPTCHA_VERIFICATION is set
    const skipRecaptcha = process.env.NODE_ENV === 'development' && 
                          process.env.DISABLE_RECAPTCHA_VERIFICATION === 'true';
    
    if (process.env.RECAPTCHA_SECRET_KEY && !skipRecaptcha) {
      if (!recaptchaToken) {
        throw new CustomError('reCAPTCHA verification is required', 400, 'RECAPTCHA_REQUIRED');
      }

      try {
        const axios = require('axios');
        // Google reCAPTCHA API expects form data
        const secretKey = process.env.RECAPTCHA_SECRET_KEY;
        
        console.log('Verifying reCAPTCHA:', {
          tokenLength: recaptchaToken?.length || 0,
          secretKeyLength: secretKey?.length || 0,
          secretKeyPreview: secretKey?.substring(0, 20) + '...',
          tokenPreview: recaptchaToken?.substring(0, 20) + '...'
        });
        
        const verifyResponse = await axios.post(
          'https://www.google.com/recaptcha/api/siteverify',
          `secret=${encodeURIComponent(secretKey || '')}&response=${encodeURIComponent(recaptchaToken)}`,
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          }
        );

        const { success, score, 'error-codes': errorCodes } = verifyResponse.data;

        console.log('reCAPTCHA verification response:', {
          success,
          score,
          errorCodes,
          hasToken: !!recaptchaToken,
          tokenLength: recaptchaToken?.length || 0
        });

        if (!success) {
          console.error('reCAPTCHA verification failed. Error codes:', errorCodes);
          // In development, log but don't block if it's a configuration issue
          if (process.env.NODE_ENV === 'development' && 
              errorCodes?.includes('invalid-input-response')) {
            console.warn('⚠️  reCAPTCHA verification failed, but allowing registration in development mode.');
            console.warn('⚠️  Make sure your site key and secret key match, and localhost is added to domains.');
          } else {
            const errorMessage = errorCodes && errorCodes.length > 0 
              ? `reCAPTCHA verification failed: ${errorCodes.join(', ')}`
              : 'reCAPTCHA verification failed. Please try again.';
            throw new CustomError(
              errorMessage,
              400,
              'RECAPTCHA_FAILED'
            );
          }
        }

        // For v3, check score (0.0 to 1.0)
        // Score closer to 1.0 is more likely human
        if (score !== undefined && score < 0.5) {
          throw new CustomError(
            'reCAPTCHA verification failed. Please try again.',
            400,
            'RECAPTCHA_LOW_SCORE'
          );
        }
      } catch (error: any) {
        if (error instanceof CustomError) {
          throw error;
        }
        console.error('reCAPTCHA verification error:', error.message);
        // In development, allow registration to proceed if reCAPTCHA fails
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️  reCAPTCHA verification error, but allowing registration in development mode.');
        } else {
          throw new CustomError(
            'reCAPTCHA verification failed. Please try again.',
            400,
            'RECAPTCHA_VERIFICATION_ERROR'
          );
        }
      }
    } else if (skipRecaptcha) {
      console.log('⚠️  reCAPTCHA verification disabled in development mode');
    }

    // Check if user exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      throw new CustomError('User already exists', 409, 'USER_EXISTS');
    }

    // Determine role based on adminCode
    const role = adminCode ? 'admin' : 'user';
    
    // If adminCode is provided, validate it (for now, any non-empty string is accepted)
    if (adminCode && adminCode.trim() === '') {
      throw new CustomError('Admin code is required for admin registration', 400, 'VALIDATION_ERROR');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role',
      [email, passwordHash, role]
    );

    const user = result.rows[0];

    // Generate JWT
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new CustomError('JWT_SECRET not configured', 500, 'CONFIG_ERROR');
    }
    
    const payload = { userId: user.id, role: user.role };
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    const token = jwt.sign(payload, jwtSecret, {
      expiresIn
    } as any);

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new CustomError('Email and password are required', 400, 'VALIDATION_ERROR');
    }

    // Find user (try to include theme_preference, but don't fail if column doesn't exist)
    let result;
    try {
      // Try to select with theme_preference
      result = await pool.query(
        'SELECT id, email, password_hash, role, COALESCE(theme_preference, \'light\') as theme_preference FROM users WHERE email = $1',
        [email]
      );
    } catch (error: any) {
      // If theme_preference column doesn't exist, fall back to basic query
      if (error.code === '42703' || error.message?.includes('theme_preference')) {
        result = await pool.query(
          'SELECT id, email, password_hash, role FROM users WHERE email = $1',
          [email]
        );
        // Add default theme_preference to result
        if (result.rows.length > 0) {
          result.rows[0].theme_preference = 'light';
        }
      } else {
        throw error;
      }
    }

    if (result.rows.length === 0) {
      throw new CustomError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    const user = result.rows[0];

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      throw new CustomError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    // Generate JWT
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new CustomError('JWT_SECRET not configured', 500, 'CONFIG_ERROR');
    }
    
    const payload = { userId: user.id, role: user.role };
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    const token = jwt.sign(payload, jwtSecret, {
      expiresIn
    } as any);

    // Check if user has accepted terms and which version
    const termsResult = await pool.query(
      'SELECT terms_accepted, terms_accepted_at, terms_version FROM users WHERE id = $1',
      [user.id]
    );
    const termsAccepted = termsResult.rows[0]?.terms_accepted || false;
    const termsAcceptedAt = termsResult.rows[0]?.terms_accepted_at || null;
    const termsVersion = termsResult.rows[0]?.terms_version || 0;
    const currentTermsVersion = parseInt(process.env.TERMS_VERSION || '1', 10);

    // User needs to accept terms if:
    // 1. They haven't accepted at all (termsAccepted = false)
    // 2. They accepted an older version (termsVersion < currentTermsVersion)
    const needsToAcceptTerms = !termsAccepted || termsVersion < currentTermsVersion;

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        termsAccepted: !needsToAcceptTerms, // Only true if they have the current version
        termsAcceptedAt,
        termsVersion,
        themePreference: user.theme_preference || 'light'
      }
    });
  } catch (error) {
    next(error);
  }
};

export const acceptTerms = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.userId) {
      throw new CustomError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    // Get current terms version (default to 1)
    const currentTermsVersion = parseInt(process.env.TERMS_VERSION || '1', 10);

    // Update user's terms acceptance with current version
    const result = await pool.query(
      `UPDATE users 
       SET terms_accepted = TRUE, 
           terms_accepted_at = NOW(),
           terms_version = $1
       WHERE id = $2 
       RETURNING id, email, terms_accepted, terms_accepted_at, terms_version`,
      [currentTermsVersion, req.userId]
    );

    if (result.rows.length === 0) {
      throw new CustomError('User not found', 404, 'NOT_FOUND');
    }

    res.json({
      message: 'Terms and conditions accepted successfully',
      user: {
        id: result.rows[0].id,
        email: result.rows[0].email,
        termsAccepted: result.rows[0].terms_accepted,
        termsAcceptedAt: result.rows[0].terms_accepted_at,
        termsVersion: result.rows[0].terms_version
      }
    });
  } catch (error) {
    next(error);
  }
};
