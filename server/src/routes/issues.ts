import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';
import {
  createIssue,
  getIssueById,
  getMyIssues,
  updateIssueStatus,
  addAdminResponse
} from '../controllers/issueController';

const router = Router();

// Protected routes - IMPORTANT: /my must come BEFORE /:id to avoid route conflict
router.get('/my', authenticate, getMyIssues);
router.post('/', authenticate, upload.array('images', 5), createIssue);

// Optional auth route - public issues can be viewed by anyone, private issues require auth
router.get('/:id', optionalAuthenticate, getIssueById);

// Admin routes (status updates and responses)
router.patch('/:id/status', authenticate, updateIssueStatus);
router.post('/:id/response', authenticate, addAdminResponse);

export default router;
