import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createProfile,
  getProfile,
  updateProfile,
  updateCounty
} from '../controllers/profileController';

const router = Router();

// All profile routes require authentication
router.use(authenticate);

router.post('/', createProfile);
router.get('/', getProfile);
router.put('/', updateProfile);
router.patch('/county', updateCounty);

export default router;
