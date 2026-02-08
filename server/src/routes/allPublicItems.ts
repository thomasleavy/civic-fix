import { Router } from 'express';
import { getAllPublicItems } from '../controllers/allPublicItemsController';

const router = Router();

// Public route - anyone can view all public items
router.get('/', getAllPublicItems);

export default router;
