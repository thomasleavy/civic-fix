import { Router } from 'express';
import { getTrendingItems } from '../controllers/trendingController';

const router = Router();

// Public route - anyone can view trending items
router.get('/', getTrendingItems);

export default router;
