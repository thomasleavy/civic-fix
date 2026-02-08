import { Request, Response, NextFunction } from 'express';
import { CustomError } from '../middleware/errorHandler';
import axios from 'axios';

// County to search query mapping for news API
const COUNTY_TO_NEWS_QUERY: Record<string, string> = {
  'Carlow': 'Carlow Ireland',
  'Cavan': 'Cavan Ireland',
  'Clare': 'Clare Ireland',
  'Cork': 'Cork Ireland',
  'Donegal': 'Donegal Ireland',
  'Dublin': 'Dublin Ireland',
  'Galway': 'Galway Ireland',
  'Kerry': 'Kerry Ireland',
  'Kildare': 'Kildare Ireland',
  'Kilkenny': 'Kilkenny Ireland',
  'Laois': 'Laois Ireland',
  'Leitrim': 'Leitrim Ireland',
  'Limerick': 'Limerick Ireland',
  'Longford': 'Longford Ireland',
  'Louth': 'Louth Ireland',
  'Mayo': 'Mayo Ireland',
  'Meath': 'Meath Ireland',
  'Monaghan': 'Monaghan Ireland',
  'Offaly': 'Offaly Ireland',
  'Roscommon': 'Roscommon Ireland',
  'Sligo': 'Sligo Ireland',
  'Tipperary': 'Tipperary Ireland',
  'Waterford': 'Waterford Ireland',
  'Westmeath': 'Westmeath Ireland',
  'Wexford': 'Wexford Ireland',
  'Wicklow': 'Wicklow Ireland'
};

// Get local news for a specific county
export const getNewsByCounty = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { county } = req.query;
    const limit = parseInt(req.query.limit as string) || 3;

    if (!county) {
      throw new CustomError('County parameter is required', 400, 'VALIDATION_ERROR');
    }

    // Validate county
    const validCounties = Object.keys(COUNTY_TO_NEWS_QUERY);
    if (!validCounties.includes(county as string)) {
      throw new CustomError('Invalid county', 400, 'VALIDATION_ERROR');
    }

    const searchQuery = COUNTY_TO_NEWS_QUERY[county as string];
    const apiKey = process.env.NEWS_API_KEY;

    if (!apiKey) {
      // Return empty array if API key is not configured
      return res.json({
        county: county as string,
        articles: [],
        error: 'News API key not configured'
      });
    }

    try {
      // Fetch news from NewsAPI.org
      // Using 'everything' endpoint for better results (free tier allows this)
      const response = await axios.get('https://newsapi.org/v2/everything', {
        params: {
          q: searchQuery,
          language: 'en',
          sortBy: 'publishedAt',
          pageSize: limit,
          apiKey: apiKey
        }
      });

      const articles = response.data.articles || [];

      // Format articles to include only what we need
      const formattedArticles = articles.slice(0, limit).map((article: any) => ({
        title: article.title,
        description: article.description,
        url: article.url,
        publishedAt: article.publishedAt,
        source: article.source?.name || 'Unknown',
        imageUrl: article.urlToImage
      }));

      res.json({
        county: county as string,
        articles: formattedArticles,
        totalResults: response.data.totalResults || 0
      });
    } catch (error: any) {
      // If API call fails, return error but don't crash
      console.error('NewsAPI error:', error.response?.data || error.message);
      
      // Check if it's a rate limit or API key error
      if (error.response?.status === 429) {
        return res.json({
          county: county as string,
          articles: [],
          error: 'News API rate limit exceeded. Please try again later.'
        });
      }
      
      if (error.response?.status === 401) {
        return res.json({
          county: county as string,
          articles: [],
          error: 'News API key is invalid'
        });
      }

      res.json({
        county: county as string,
        articles: [],
        error: 'Unable to fetch news data'
      });
    }
  } catch (error) {
    next(error);
  }
};
