import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import { getThemePreference, setThemePreference } from '../controllers/themeController';

const router = Router();

// Get theme preference (optional auth - works for both authenticated and non-authenticated)
router.get('/preference', optionalAuthenticate, getThemePreference);

// Set theme preference (requires auth)
router.post('/preference', authenticate, setThemePreference);

export default router;
