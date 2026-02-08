import { Router } from 'express';
import { getCivicSpaceContent } from '../controllers/civicSpaceController';

const router = Router();

// Public route - anyone can view civic space content
router.get('/', getCivicSpaceContent);

export default router;
