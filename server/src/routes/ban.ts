import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getBanDetails } from '../controllers/banController';

const router = Router();

// Get ban details for authenticated user
router.get('/details', authenticate, getBanDetails);

export default router;
