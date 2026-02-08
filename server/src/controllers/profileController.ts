import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import pool from '../config/database';
import { CustomError } from '../middleware/errorHandler';

export const createProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { firstName, surname, dateOfBirth, address, ppsn, civicInterests, county } = req.body;

    if (!req.userId) {
      throw new CustomError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    // Check if profile already exists
    const existing = await pool.query(
      'SELECT id FROM user_profiles WHERE user_id = $1',
      [req.userId]
    );

    if (existing.rows.length > 0) {
      throw new CustomError('Profile already exists. Use update instead.', 409, 'PROFILE_EXISTS');
    }

    // Validate county if provided
    if (county) {
      const validCounties = [
        'Carlow', 'Cavan', 'Clare', 'Cork', 'Donegal', 'Dublin', 'Galway',
        'Kerry', 'Kildare', 'Kilkenny', 'Laois', 'Leitrim', 'Limerick',
        'Longford', 'Louth', 'Mayo', 'Meath', 'Monaghan', 'Offaly',
        'Roscommon', 'Sligo', 'Tipperary', 'Waterford', 'Westmeath',
        'Wexford', 'Wicklow'
      ];
      if (!validCounties.includes(county)) {
        throw new CustomError('Invalid county', 400, 'VALIDATION_ERROR');
      }
    }

    // Create profile
    const result = await pool.query(
      `INSERT INTO user_profiles (user_id, first_name, surname, date_of_birth, address, ppsn, civic_interests, county)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        req.userId,
        firstName || null,
        surname || null,
        dateOfBirth || null,
        address || null,
        ppsn || null,
        civicInterests || [],
        county || null
      ]
    );

    res.status(201).json({
      message: 'Profile created successfully',
      profile: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.userId) {
      throw new CustomError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    try {
      const result = await pool.query(
        'SELECT * FROM user_profiles WHERE user_id = $1',
        [req.userId]
      );

      if (result.rows.length === 0) {
        return res.json({ profile: null });
      }

      res.json({ profile: result.rows[0] });
    } catch (dbError: any) {
      // If table doesn't exist, return null profile
      if (dbError.code === '42P01') {
        console.warn('user_profiles table does not exist. Run migrations first.');
        return res.json({ profile: null });
      }
      throw dbError;
    }
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { firstName, surname, dateOfBirth, address, ppsn, civicInterests, county } = req.body;

    if (!req.userId) {
      throw new CustomError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    // Check if profile exists
    let existing;
    try {
      existing = await pool.query(
        'SELECT * FROM user_profiles WHERE user_id = $1',
        [req.userId]
      );
    } catch (dbError: any) {
      // If table doesn't exist, return helpful error
      if (dbError.code === '42P01') {
        console.error('user_profiles table does not exist. Run migrations: npm run migrate');
        throw new CustomError('Database table missing. Please run migrations: npm run migrate', 500, 'DATABASE_ERROR');
      }
      throw dbError;
    }

    // Validate county if provided
    if (county) {
      const validCounties = [
        'Carlow', 'Cavan', 'Clare', 'Cork', 'Donegal', 'Dublin', 'Galway',
        'Kerry', 'Kildare', 'Kilkenny', 'Laois', 'Leitrim', 'Limerick',
        'Longford', 'Louth', 'Mayo', 'Meath', 'Monaghan', 'Offaly',
        'Roscommon', 'Sligo', 'Tipperary', 'Waterford', 'Westmeath',
        'Wexford', 'Wicklow'
      ];
      if (!validCounties.includes(county)) {
        throw new CustomError('Invalid county', 400, 'VALIDATION_ERROR');
      }
    }

    let result;
    if (existing.rows.length === 0) {
      // Create if doesn't exist - allow all fields on first creation
      result = await pool.query(
        `INSERT INTO user_profiles (user_id, first_name, surname, date_of_birth, address, ppsn, civic_interests, county)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          req.userId,
          firstName || null,
          surname || null,
          dateOfBirth || null,
          address || null,
          ppsn || null,
          civicInterests || [],
          county || null
        ]
      );
    } else {
      // Update existing profile
      const existingProfile = existing.rows[0];
      
      // Check if profile is complete (all required fields filled)
      const isComplete = 
        existingProfile.first_name &&
        existingProfile.surname &&
        existingProfile.date_of_birth &&
        existingProfile.address &&
        existingProfile.ppsn &&
        existingProfile.county;

      if (isComplete) {
        // Profile is complete: ONLY allow updating address, civic_interests, and county
        // Keep existing name, surname, date_of_birth, ppsn from database
        result = await pool.query(
          `UPDATE user_profiles
           SET address = $1, civic_interests = $2, county = COALESCE($3, county), updated_at = NOW()
           WHERE user_id = $4
           RETURNING *`,
          [
            address !== undefined ? address : existingProfile.address,
            civicInterests !== undefined ? civicInterests : existingProfile.civic_interests,
            county !== undefined ? county : existingProfile.county,
            req.userId
          ]
        );
      } else {
        // Profile is incomplete: allow updating missing required fields
        // Update fields if provided (not empty string), otherwise keep existing value
        // Build dynamic update query based on what's provided
        const updates: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (firstName !== undefined && firstName !== '') {
          updates.push(`first_name = $${paramIndex}`);
          values.push(firstName);
          paramIndex++;
        }

        if (surname !== undefined && surname !== '') {
          updates.push(`surname = $${paramIndex}`);
          values.push(surname);
          paramIndex++;
        }

        if (dateOfBirth !== undefined && dateOfBirth !== '') {
          updates.push(`date_of_birth = $${paramIndex}::DATE`);
          values.push(dateOfBirth);
          paramIndex++;
        }

        if (address !== undefined && address !== '') {
          updates.push(`address = $${paramIndex}`);
          values.push(address);
          paramIndex++;
        }

        if (ppsn !== undefined && ppsn !== '') {
          updates.push(`ppsn = $${paramIndex}`);
          values.push(ppsn);
          paramIndex++;
        }

        if (civicInterests !== undefined) {
          updates.push(`civic_interests = $${paramIndex}`);
          values.push(civicInterests);
          paramIndex++;
        }

        if (county !== undefined && county !== '') {
          updates.push(`county = $${paramIndex}`);
          values.push(county);
          paramIndex++;
        }

        // Always update updated_at
        updates.push(`updated_at = NOW()`);
        
        // Add user_id as the last parameter
        values.push(req.userId);

        if (updates.length > 1) { // More than just updated_at
          result = await pool.query(
            `UPDATE user_profiles
             SET ${updates.join(', ')}
             WHERE user_id = $${paramIndex}
             RETURNING *`,
            values
          );
        } else {
          // No fields to update, just return existing profile
          result = existing;
        }
      }
    }

    res.json({
      message: 'Profile updated successfully',
      profile: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

export const updateCounty = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { county } = req.body;

    if (!req.userId) {
      throw new CustomError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    if (!county) {
      throw new CustomError('County is required', 400, 'VALIDATION_ERROR');
    }

    // Validate county is one of the 32 Irish counties
    const validCounties = [
      'Carlow', 'Cavan', 'Clare', 'Cork', 'Donegal', 'Dublin', 'Galway',
      'Kerry', 'Kildare', 'Kilkenny', 'Laois', 'Leitrim', 'Limerick',
      'Longford', 'Louth', 'Mayo', 'Meath', 'Monaghan', 'Offaly',
      'Roscommon', 'Sligo', 'Tipperary', 'Waterford', 'Westmeath',
      'Wexford', 'Wicklow'
    ];

    if (!validCounties.includes(county)) {
      throw new CustomError('Invalid county', 400, 'VALIDATION_ERROR');
    }

    // Check if profile exists, create if it doesn't
    const existing = await pool.query(
      'SELECT id FROM user_profiles WHERE user_id = $1',
      [req.userId]
    );

    let result;
    if (existing.rows.length === 0) {
      // Create profile with just county
      result = await pool.query(
        `INSERT INTO user_profiles (user_id, county)
         VALUES ($1, $2)
         RETURNING *`,
        [req.userId, county]
      );
    } else {
      // Update existing profile with county
      result = await pool.query(
        `UPDATE user_profiles
         SET county = $1, updated_at = NOW()
         WHERE user_id = $2
         RETURNING *`,
        [county, req.userId]
      );
    }

    res.json({
      message: 'County updated successfully',
      profile: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};
