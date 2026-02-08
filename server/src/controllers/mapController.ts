import { Request, Response, NextFunction } from 'express';
import pool from '../config/database';
import { CustomError } from '../middleware/errorHandler';

// County coordinates for Ireland (approximate center points)
const COUNTY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'Carlow': { lat: 52.8408, lng: -6.9261 },
  'Cavan': { lat: 53.9908, lng: -7.3606 },
  'Clare': { lat: 52.9045, lng: -9.2766 },
  'Cork': { lat: 51.8985, lng: -8.4756 },
  'Donegal': { lat: 54.6541, lng: -8.1043 },
  'Dublin': { lat: 53.3498, lng: -6.2603 },
  'Galway': { lat: 53.2707, lng: -9.0568 },
  'Kerry': { lat: 52.2689, lng: -9.7028 },
  'Kildare': { lat: 53.1561, lng: -6.9144 },
  'Kilkenny': { lat: 52.6542, lng: -7.2522 },
  'Laois': { lat: 53.0328, lng: -7.3000 },
  'Leitrim': { lat: 54.1167, lng: -8.0833 },
  'Limerick': { lat: 52.6638, lng: -8.6268 },
  'Longford': { lat: 53.7257, lng: -7.7983 },
  'Louth': { lat: 53.9917, lng: -6.5417 },
  'Mayo': { lat: 53.9000, lng: -9.3000 },
  'Meath': { lat: 53.6500, lng: -6.6833 },
  'Monaghan': { lat: 54.2500, lng: -6.9667 },
  'Offaly': { lat: 53.2739, lng: -7.4889 },
  'Roscommon': { lat: 53.6333, lng: -8.1833 },
  'Sligo': { lat: 54.2667, lng: -8.4833 },
  'Tipperary': { lat: 52.4736, lng: -8.1619 },
  'Waterford': { lat: 52.2583, lng: -7.1119 },
  'Westmeath': { lat: 53.5333, lng: -7.3500 },
  'Wexford': { lat: 52.3369, lng: -6.4633 },
  'Wicklow': { lat: 53.0000, lng: -6.4167 }
};

// Get county statistics (count of issues and suggestions per county)
export const getCountyStatistics = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get count of public issues per county
    const issuesResult = await pool.query(
      `SELECT 
        county,
        COUNT(*) as issues_count
      FROM issues
      WHERE is_public = TRUE
        AND county IS NOT NULL
        AND title IS NOT NULL 
        AND title != ''
        AND description IS NOT NULL 
        AND description != ''
        AND category IS NOT NULL 
        AND category != ''
      GROUP BY county
      ORDER BY county`,
      []
    );

    // Get count of public suggestions per county
    const suggestionsResult = await pool.query(
      `SELECT 
        county,
        COUNT(*) as suggestions_count
      FROM suggestions
      WHERE is_public = TRUE
        AND county IS NOT NULL
        AND title IS NOT NULL 
        AND title != ''
        AND description IS NOT NULL 
        AND description != ''
        AND category IS NOT NULL 
        AND category != ''
      GROUP BY county
      ORDER BY county`,
      []
    );

    // Combine results
    const countyStats: Record<string, { issuesCount: number; suggestionsCount: number; totalCount: number; coordinates: { lat: number; lng: number } }> = {};

    // Process issues
    issuesResult.rows.forEach((row: any) => {
      const county = row.county;
      if (county && COUNTY_COORDINATES[county]) {
        countyStats[county] = {
          issuesCount: parseInt(row.issues_count),
          suggestionsCount: 0,
          totalCount: parseInt(row.issues_count),
          coordinates: COUNTY_COORDINATES[county]
        };
      }
    });

    // Process suggestions
    suggestionsResult.rows.forEach((row: any) => {
      const county = row.county;
      if (county && COUNTY_COORDINATES[county]) {
        if (countyStats[county]) {
          countyStats[county].suggestionsCount = parseInt(row.suggestions_count);
          countyStats[county].totalCount += parseInt(row.suggestions_count);
        } else {
          countyStats[county] = {
            issuesCount: 0,
            suggestionsCount: parseInt(row.suggestions_count),
            totalCount: parseInt(row.suggestions_count),
            coordinates: COUNTY_COORDINATES[county]
          };
        }
      }
    });

    // Convert to array format
    const counties = Object.keys(countyStats).map(county => ({
      county,
      ...countyStats[county]
    }));

    res.json({
      counties,
      totalCounties: counties.length
    });
  } catch (error) {
    next(error);
  }
};
