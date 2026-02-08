import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import pool from '../config/database';
import { CustomError } from '../middleware/errorHandler';

// Set admin locations (counties they manage)
export const setAdminLocations = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { counties } = req.body;
    const adminId = req.userId;

    if (!adminId) {
      throw new CustomError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    if (!counties || !Array.isArray(counties) || counties.length === 0) {
      throw new CustomError('At least one county is required', 400, 'VALIDATION_ERROR');
    }

    // Validate counties
    const validCounties = [
      'Carlow', 'Cavan', 'Clare', 'Cork', 'Donegal', 'Dublin', 'Galway',
      'Kerry', 'Kildare', 'Kilkenny', 'Laois', 'Leitrim', 'Limerick',
      'Longford', 'Louth', 'Mayo', 'Meath', 'Monaghan', 'Offaly',
      'Roscommon', 'Sligo', 'Tipperary', 'Waterford', 'Westmeath',
      'Wexford', 'Wicklow'
    ];

    for (const county of counties) {
      if (!validCounties.includes(county)) {
        throw new CustomError(`Invalid county: ${county}`, 400, 'VALIDATION_ERROR');
      }
    }

    // Get current locations for this admin (to preserve counties they already manage)
    const currentLocationsResult = await pool.query(
      'SELECT county FROM admin_locations WHERE admin_id = $1',
      [adminId]
    );
    const currentCounties = currentLocationsResult.rows.map(row => row.county);

    // Check for conflicts: counties already assigned to OTHER admins
    const conflictCheck = await pool.query(
      `SELECT al.county, u.email as admin_email, u.id as admin_id
       FROM admin_locations al
       JOIN users u ON al.admin_id = u.id
       WHERE al.county = ANY($1::text[]) AND al.admin_id != $2`,
      [counties, adminId]
    );

    if (conflictCheck.rows.length > 0) {
      const conflicts = conflictCheck.rows.map(row => ({
        county: row.county,
        adminEmail: row.admin_email
      }));
      throw new CustomError(
        `The following counties are already assigned to other admins: ${conflicts.map(c => `${c.county} (${c.adminEmail})`).join(', ')}`,
        400,
        'COUNTY_CONFLICT'
      );
    }

    // Use a transaction to ensure atomicity
    await pool.query('BEGIN');

    try {
      // Delete existing locations for this admin
      await pool.query('DELETE FROM admin_locations WHERE admin_id = $1', [adminId]);

      // Insert new locations (now guaranteed to be unique per county)
      for (const county of counties) {
        await pool.query(
          'INSERT INTO admin_locations (admin_id, county) VALUES ($1, $2)',
          [adminId, county]
        );
      }

      await pool.query('COMMIT');

      // Get all locations for this admin
      const locationsResult = await pool.query(
        'SELECT county FROM admin_locations WHERE admin_id = $1 ORDER BY county',
        [adminId]
      );

      res.json({
        message: 'Admin locations updated successfully',
        locations: locationsResult.rows.map(row => row.county)
      });
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

// Get admin locations
export const getAdminLocations = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const adminId = req.userId;

    if (!adminId) {
      throw new CustomError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    const result = await pool.query(
      'SELECT county FROM admin_locations WHERE admin_id = $1 ORDER BY county',
      [adminId]
    );

    res.json({
      locations: result.rows.map(row => row.county)
    });
  } catch (error) {
    next(error);
  }
};

// Get all county assignments (which admin manages which county)
// This helps show which counties are available vs already assigned
export const getAllCountyAssignments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const adminId = req.userId;

    if (!adminId) {
      throw new CustomError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    // Get all county assignments with admin info
    const result = await pool.query(
      `SELECT 
        al.county,
        al.admin_id,
        u.email as admin_email,
        CASE WHEN al.admin_id = $1 THEN true ELSE false END as is_current_admin
       FROM admin_locations al
       JOIN users u ON al.admin_id = u.id
       ORDER BY al.county`,
      [adminId]
    );

    res.json({
      assignments: result.rows
    });
  } catch (error) {
    next(error);
  }
};
