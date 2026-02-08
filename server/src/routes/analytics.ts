import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getCategoryAnalytics,
  getTrendsOverTime,
  getGeographicDistribution,
  getOverallStats
} from '../controllers/analyticsController';

const router = Router();

// All analytics routes require authentication
router.use(authenticate);

// Get category analytics
router.get('/categories', getCategoryAnalytics);

// Get trends over time
router.get('/trends', getTrendsOverTime);

// Get geographic distribution
router.get('/geographic', getGeographicDistribution);

// Get overall statistics
router.get('/overall', getOverallStats);

export default router;
