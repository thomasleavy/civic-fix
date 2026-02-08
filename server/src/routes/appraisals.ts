import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import { toggleAppraisal, getAppraisalStatus, getAppraisalCounts } from '../controllers/appraisalController';

const router = Router();

// Toggle like/appraisal (requires authentication)
router.post('/:id/toggle', authenticate, toggleAppraisal);

// Get appraisal status (optional auth - shows count to everyone, liked status to authenticated users)
router.get('/:id/status', optionalAuthenticate, getAppraisalStatus);

// Get multiple appraisal counts (for civic space)
router.post('/counts', getAppraisalCounts);

export default router;
