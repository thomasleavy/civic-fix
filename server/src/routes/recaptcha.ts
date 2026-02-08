import { Router } from 'express';
import { verifyRecaptcha } from '../controllers/recaptchaController';

const router = Router();

// Public route for reCAPTCHA verification
router.post('/verify', verifyRecaptcha);

export default router;
