import { Router } from 'express';
import { getCountyStatistics } from '../controllers/mapController';

const router = Router();

// Public route - anyone can view county statistics
router.get('/county-stats', getCountyStatistics);

export default router;
