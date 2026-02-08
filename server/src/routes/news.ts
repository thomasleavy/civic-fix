import { Router } from 'express';
import { getNewsByCounty } from '../controllers/newsController';

const router = Router();

// Public route - anyone can view news
router.get('/', getNewsByCounty);

export default router;
