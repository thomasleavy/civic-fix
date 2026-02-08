import { Router } from 'express';
import { register, login, acceptTerms } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/accept-terms', authenticate, acceptTerms);

export default router;
