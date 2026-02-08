import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';
import {
  createSuggestion,
  getMySuggestions,
  getSuggestionById,
  updateSuggestionStatus,
  addAdminResponse
} from '../controllers/suggestionController';

const router = Router();

// Protected routes - IMPORTANT: /my must come BEFORE /:id to avoid route conflict
router.get('/my', authenticate, getMySuggestions);
router.post('/', authenticate, upload.array('images', 5), createSuggestion);

// Optional auth route - public suggestions can be viewed by anyone, private suggestions require auth
router.get('/:id', optionalAuthenticate, getSuggestionById);

// Admin routes (status updates and responses)
router.patch('/:id/status', authenticate, updateSuggestionStatus);
router.post('/:id/response', authenticate, addAdminResponse);

export default router;
