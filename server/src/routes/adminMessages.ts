import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import {
  createMessage,
  getAdminMessages,
  getUserMessages,
  markMessageAsViewed,
  updateMessageStatus,
  deleteMessage,
  getUserProfileByAdmin,
  updateUserProfileByAdmin,
  ISSUE_TYPES
} from '../controllers/adminMessagesController';

const router = Router();

// Get issue types (public - for form dropdown)
router.get('/issue-types', (req, res) => {
  res.json({ issueTypes: ISSUE_TYPES });
});

// User routes (require authentication)
router.post('/messages', authenticate, createMessage);
router.get('/messages', authenticate, getUserMessages);

// Admin routes (require authentication and admin role)
router.get('/admin/messages', authenticate, requireAdmin, getAdminMessages);
router.patch('/admin/messages/:messageId/viewed', authenticate, requireAdmin, markMessageAsViewed);
router.patch('/admin/messages/:messageId/status', authenticate, requireAdmin, updateMessageStatus);
router.delete('/admin/messages/:messageId', authenticate, requireAdmin, deleteMessage);
router.get('/admin/users/:userId/profile', authenticate, requireAdmin, getUserProfileByAdmin);
router.patch('/admin/users/:userId/profile', authenticate, requireAdmin, updateUserProfileByAdmin);

export default router;
