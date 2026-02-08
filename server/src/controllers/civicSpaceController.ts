import { Request, Response, NextFunction } from 'express';
import pool from '../config/database';
import { CustomError } from '../middleware/errorHandler';

// Helper function to get issue with images
async function getIssueWithImages(issueId: string) {
  const issueResult = await pool.query('SELECT * FROM issues WHERE id = $1', [issueId]);

  if (issueResult.rows.length === 0) {
    return null;
  }

  const issue = issueResult.rows[0];

  // Get images
  const imagesResult = await pool.query(
    'SELECT cloudinary_url FROM issue_images WHERE issue_id = $1 ORDER BY created_at',
    [issueId]
  );

  // Filter out empty URLs and construct full URLs for local storage
  // Backend serves static files, so use backend URL (not frontend URL)
  const backendUrl = process.env.BACKEND_URL || process.env.API_URL || 'http://localhost:5000';
  const images = imagesResult.rows
    .map((row) => {
      const url = row.cloudinary_url;
      if (!url || url.trim() === '') return null;
      // If it's a relative path (starts with /uploads), prepend the backend URL
      if (url.startsWith('/uploads')) {
        return `${backendUrl}${url}`;
      }
      // If it's already a full URL (Cloudinary), return as is
      if (url.startsWith('http')) {
        return url;
      }
      // Otherwise, assume it's a relative path and prepend backend URL
      return `${backendUrl}${url.startsWith('/') ? url : '/' + url}`;
    })
    .filter((url): url is string => url !== null);

  return {
    ...issue,
    images: images.length > 0 ? images : []
  };
}

// Helper function to get suggestion with images
async function getSuggestionWithImages(suggestionId: string) {
  const suggestionResult = await pool.query(
    'SELECT * FROM suggestions WHERE id = $1',
    [suggestionId]
  );

  if (suggestionResult.rows.length === 0) {
    return null;
  }

  const suggestion = suggestionResult.rows[0];

  // Get images
  const imagesResult = await pool.query(
    'SELECT cloudinary_url FROM suggestion_images WHERE suggestion_id = $1 ORDER BY created_at',
    [suggestionId]
  );

  // Filter out empty URLs and construct full URLs for local storage
  // Backend serves static files, so use backend URL (not frontend URL)
  const backendUrl = process.env.BACKEND_URL || process.env.API_URL || 'http://localhost:5000';
  const images = imagesResult.rows
    .map((row) => {
      const url = row.cloudinary_url;
      if (!url || url.trim() === '') return null;
      // If it's a relative path (starts with /uploads), prepend the backend URL
      if (url.startsWith('/uploads')) {
        return `${backendUrl}${url}`;
      }
      // If it's already a full URL (Cloudinary), return as is
      if (url.startsWith('http')) {
        return url;
      }
      // Otherwise, assume it's a relative path and prepend backend URL
      return `${backendUrl}${url.startsWith('/') ? url : '/' + url}`;
    })
    .filter((url): url is string => url !== null);

  return {
    ...suggestion,
    images: images.length > 0 ? images : []
  };
}

// Get public issues and suggestions for a specific county
export const getCivicSpaceContent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { county } = req.query;

    if (!county) {
      throw new CustomError('County parameter is required', 400, 'VALIDATION_ERROR');
    }

    // Validate county is one of the valid Irish counties
    const validCounties = [
      'Carlow', 'Cavan', 'Clare', 'Cork', 'Donegal', 'Dublin', 'Galway',
      'Kerry', 'Kildare', 'Kilkenny', 'Laois', 'Leitrim', 'Limerick',
      'Longford', 'Louth', 'Mayo', 'Meath', 'Monaghan', 'Offaly',
      'Roscommon', 'Sligo', 'Tipperary', 'Waterford', 'Westmeath',
      'Wexford', 'Wicklow'
    ];

    if (!validCounties.includes(county as string)) {
      throw new CustomError('Invalid county', 400, 'VALIDATION_ERROR');
    }

    // Get public issues for this county
    const issuesResult = await pool.query(
      `SELECT * FROM issues 
       WHERE county = $1 
       AND is_public = TRUE
       AND title IS NOT NULL 
       AND title != ''
       AND description IS NOT NULL 
       AND description != ''
       AND category IS NOT NULL 
       AND category != ''
       ORDER BY created_at DESC`,
      [county]
    );

    // Get public suggestions for this county
    const suggestionsResult = await pool.query(
      `SELECT * FROM suggestions 
       WHERE county = $1 
       AND is_public = TRUE
       AND title IS NOT NULL 
       AND title != ''
       AND description IS NOT NULL 
       AND description != ''
       AND category IS NOT NULL 
       AND category != ''
       ORDER BY created_at DESC`,
      [county]
    );

    // Get images for issues
    const issuesWithImages = await Promise.all(
      issuesResult.rows.map(async (issue) => await getIssueWithImages(issue.id))
    );

    // Get images for suggestions
    const suggestionsWithImages = await Promise.all(
      suggestionsResult.rows.map(async (suggestion) => await getSuggestionWithImages(suggestion.id))
    );

    // Get appraisal counts for all issues
    const issueAppraisalCounts: Record<string, number> = {};
    for (const issue of issuesWithImages) {
      const countResult = await pool.query(
        'SELECT COUNT(*) as count FROM appraisals WHERE issue_id = $1',
        [issue.id]
      );
      issueAppraisalCounts[issue.id] = parseInt(countResult.rows[0].count);
    }

    // Get appraisal counts for all suggestions
    const suggestionAppraisalCounts: Record<string, number> = {};
    for (const suggestion of suggestionsWithImages) {
      const countResult = await pool.query(
        'SELECT COUNT(*) as count FROM appraisals WHERE suggestion_id = $1',
        [suggestion.id]
      );
      suggestionAppraisalCounts[suggestion.id] = parseInt(countResult.rows[0].count);
    }

    // Get view counts for all issues
    const issueViewCounts: Record<string, number> = {};
    for (const issue of issuesWithImages) {
      issueViewCounts[issue.id] = issue.view_count || 0;
    }

    // Get view counts for all suggestions
    const suggestionViewCounts: Record<string, number> = {};
    for (const suggestion of suggestionsWithImages) {
      suggestionViewCounts[suggestion.id] = suggestion.view_count || 0;
    }

    // Calculate trending score and determine if trending
    // Trending criteria now includes both likes (appraisals) and views
    // Trending if: (3+ appraisals OR 10+ views) OR (2+ appraisals AND 5+ views) OR (2+ appraisals AND created within 7 days)
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const calculateTrendingScore = (item: any, appraisalCount: number, viewCount: number) => {
      const createdAt = new Date(item.created_at);
      const daysSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
      const isRecent = createdAt >= sevenDaysAgo;
      
      // Trending if: 
      // - 3+ appraisals OR 10+ views, OR
      // - 2+ appraisals AND 5+ views, OR
      // - 2+ appraisals AND created within 7 days
      const isTrending = 
        appraisalCount >= 3 || 
        viewCount >= 10 || 
        (appraisalCount >= 2 && viewCount >= 5) || 
        (appraisalCount >= 2 && isRecent);
      
      // Calculate trending score: (appraisals * 2 + views) * recency factor
      // Appraisals weighted more heavily (x2) as they indicate active engagement
      // Recency factor: 1.0 if within 7 days, 0.5 if within 30 days, 0.25 otherwise
      let recencyFactor = 0.25;
      if (daysSinceCreation <= 7) {
        recencyFactor = 1.0;
      } else if (daysSinceCreation <= 30) {
        recencyFactor = 0.5;
      }
      
      const trendingScore = (appraisalCount * 2 + viewCount) * recencyFactor;
      
      return {
        isTrending,
        trendingScore
      };
    };

    // Add appraisal counts, view counts, and trending status to issues
    const issuesWithAppraisals = issuesWithImages.map(issue => {
      const appraisalCount = issueAppraisalCounts[issue.id] || 0;
      const viewCount = issueViewCounts[issue.id] || 0;
      const { isTrending, trendingScore } = calculateTrendingScore(issue, appraisalCount, viewCount);
      return {
        ...issue,
        appraisalCount,
        viewCount,
        isTrending,
        trendingScore
      };
    });

    // Add appraisal counts, view counts, and trending status to suggestions
    const suggestionsWithAppraisals = suggestionsWithImages.map(suggestion => {
      const appraisalCount = suggestionAppraisalCounts[suggestion.id] || 0;
      const viewCount = suggestionViewCounts[suggestion.id] || 0;
      const { isTrending, trendingScore } = calculateTrendingScore(suggestion, appraisalCount, viewCount);
      return {
        ...suggestion,
        appraisalCount,
        viewCount,
        isTrending,
        trendingScore
      };
    });

    // Sort: trending items first (by trending score descending), then by date descending
    const sortByTrending = (a: any, b: any) => {
      if (a.isTrending && !b.isTrending) return -1;
      if (!a.isTrending && b.isTrending) return 1;
      if (a.isTrending && b.isTrending) {
        // Both trending, sort by trending score
        return b.trendingScore - a.trendingScore;
      }
      // Neither trending, sort by date
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    };

    const sortedIssues = [...issuesWithAppraisals].sort(sortByTrending);
    const sortedSuggestions = [...suggestionsWithAppraisals].sort(sortByTrending);

    res.json({
      county: county as string,
      issues: sortedIssues,
      suggestions: sortedSuggestions,
      issuesCount: sortedIssues.length,
      suggestionsCount: sortedSuggestions.length
    });
  } catch (error) {
    next(error);
  }
};
