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

  const backendUrl = process.env.BACKEND_URL || process.env.API_URL || 'http://localhost:5000';
  const images = imagesResult.rows
    .map((row) => {
      const url = row.cloudinary_url;
      if (!url || url.trim() === '') return null;
      if (url.startsWith('/uploads')) {
        return `${backendUrl}${url}`;
      }
      if (url.startsWith('http')) {
        return url;
      }
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

  const backendUrl = process.env.BACKEND_URL || process.env.API_URL || 'http://localhost:5000';
  const images = imagesResult.rows
    .map((row) => {
      const url = row.cloudinary_url;
      if (!url || url.trim() === '') return null;
      if (url.startsWith('/uploads')) {
        return `${backendUrl}${url}`;
      }
      if (url.startsWith('http')) {
        return url;
      }
      return `${backendUrl}${url.startsWith('/') ? url : '/' + url}`;
    })
    .filter((url): url is string => url !== null);

  return {
    ...suggestion,
    images: images.length > 0 ? images : []
  };
}

// Get all public issues and suggestions with sorting options
export const getAllPublicItems = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { sort = 'newest', type = 'all' } = req.query;

    // Get all public issues
    let issuesQuery = `
      SELECT * FROM issues 
      WHERE is_public = TRUE
      AND title IS NOT NULL 
      AND title != ''
      AND description IS NOT NULL 
      AND description != ''
      AND category IS NOT NULL 
      AND category != ''
    `;

    // Get all public suggestions
    let suggestionsQuery = `
      SELECT * FROM suggestions 
      WHERE is_public = TRUE
      AND title IS NOT NULL 
      AND title != ''
      AND description IS NOT NULL 
      AND description != ''
      AND category IS NOT NULL 
      AND category != ''
    `;

    // Apply sorting
    let orderBy = '';
    switch (sort) {
      case 'newest':
        orderBy = 'ORDER BY created_at DESC';
        break;
      case 'oldest':
        orderBy = 'ORDER BY created_at ASC';
        break;
      case 'most_liked':
        // Will sort after getting appraisal counts
        orderBy = 'ORDER BY created_at DESC';
        break;
      case 'trending':
        // Will sort after calculating trending scores
        orderBy = 'ORDER BY created_at DESC';
        break;
      default:
        orderBy = 'ORDER BY created_at DESC';
    }

    const issuesResult = await pool.query(`${issuesQuery} ${orderBy}`, []);
    const suggestionsResult = await pool.query(`${suggestionsQuery} ${orderBy}`, []);

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

    // Get view counts
    const issueViewCounts: Record<string, number> = {};
    for (const issue of issuesWithImages) {
      issueViewCounts[issue.id] = issue.view_count || 0;
    }

    const suggestionViewCounts: Record<string, number> = {};
    for (const suggestion of suggestionsWithImages) {
      suggestionViewCounts[suggestion.id] = suggestion.view_count || 0;
    }

    // Calculate trending scores
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const calculateTrendingScore = (item: any, appraisalCount: number, viewCount: number) => {
      const createdAt = new Date(item.created_at);
      const daysSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
      const isRecent = createdAt >= sevenDaysAgo;
      
      const isTrending = 
        appraisalCount >= 3 || 
        viewCount >= 10 || 
        (appraisalCount >= 2 && viewCount >= 5) || 
        (appraisalCount >= 2 && isRecent);
      
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

    // Add appraisal counts, view counts, and trending status
    const issuesWithData = issuesWithImages.map(issue => {
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

    const suggestionsWithData = suggestionsWithImages.map(suggestion => {
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

    // Apply sorting based on sort parameter
    let sortedIssues = [...issuesWithData];
    let sortedSuggestions = [...suggestionsWithData];

    if (sort === 'most_liked') {
      sortedIssues.sort((a, b) => b.appraisalCount - a.appraisalCount);
      sortedSuggestions.sort((a, b) => b.appraisalCount - a.appraisalCount);
    } else if (sort === 'trending') {
      sortedIssues.sort((a, b) => {
        if (a.isTrending && !b.isTrending) return -1;
        if (!a.isTrending && b.isTrending) return 1;
        if (a.isTrending && b.isTrending) {
          return b.trendingScore - a.trendingScore;
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      sortedSuggestions.sort((a, b) => {
        if (a.isTrending && !b.isTrending) return -1;
        if (!a.isTrending && b.isTrending) return 1;
        if (a.isTrending && b.isTrending) {
          return b.trendingScore - a.trendingScore;
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    }

    // Filter by type if specified (only affects what items are returned, not counts)
    const finalIssues = type === 'all' || type === 'issues' ? sortedIssues : [];
    const finalSuggestions = type === 'all' || type === 'suggestions' ? sortedSuggestions : [];

    // Always return full counts regardless of type filter
    const totalIssuesCount = sortedIssues.length;
    const totalSuggestionsCount = sortedSuggestions.length;

    res.json({
      issues: finalIssues,
      suggestions: finalSuggestions,
      issuesCount: totalIssuesCount,
      suggestionsCount: totalSuggestionsCount,
      totalCount: totalIssuesCount + totalSuggestionsCount
    });
  } catch (error) {
    next(error);
  }
};
