import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { CustomError } from '../middleware/errorHandler';

// Verify reCAPTCHA token with Google
export const verifyRecaptcha = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token } = req.body;

    if (!token) {
      throw new CustomError('reCAPTCHA token is required', 400, 'VALIDATION_ERROR');
    }

    const secretKey = process.env.RECAPTCHA_SECRET_KEY;

    if (!secretKey) {
      // If secret key is not configured, skip verification (for development)
      console.warn('RECAPTCHA_SECRET_KEY not configured, skipping verification');
      return res.json({ success: true, message: 'reCAPTCHA verification skipped (not configured)' });
    }

    try {
      // Verify token with Google reCAPTCHA API
      const response = await axios.post(
        'https://www.google.com/recaptcha/api/siteverify',
        null,
        {
          params: {
            secret: secretKey,
            response: token
          }
        }
      );

      const { success, score, action, 'error-codes': errorCodes } = response.data;

      if (!success) {
        console.error('reCAPTCHA verification failed:', errorCodes);
        throw new CustomError(
          'reCAPTCHA verification failed. Please try again.',
          400,
          'RECAPTCHA_FAILED'
        );
      }

      // For v3, you might want to check the score (0.0 to 1.0)
      // Score closer to 1.0 is more likely human, closer to 0.0 is more likely bot
      // For v2, score will be undefined
      if (score !== undefined && score < 0.5) {
        throw new CustomError(
          'reCAPTCHA verification failed. Please try again.',
          400,
          'RECAPTCHA_LOW_SCORE'
        );
      }

      res.json({
        success: true,
        score: score || null,
        action: action || null
      });
    } catch (error: any) {
      if (error instanceof CustomError) {
        throw error;
      }
      console.error('reCAPTCHA API error:', error.message);
      throw new CustomError(
        'reCAPTCHA verification service unavailable. Please try again later.',
        503,
        'RECAPTCHA_SERVICE_ERROR'
      );
    }
  } catch (error) {
    next(error);
  }
};
