import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import {
  getAllIssuesAdmin,
  deleteIssue,
  getStats,
  triggerWeeklyEmails
} from '../controllers/adminController';
import {
      setAdminLocations,
      getAdminLocations,
      getAllCountyAssignments
    } from '../controllers/adminLocationController';
import {
  getIssuesForAdmin,
  updateIssueStatus
} from '../controllers/adminIssuesController';
import {
  getSuggestionsForAdmin,
  updateSuggestionStatus
} from '../controllers/adminSuggestionsController';
import {
  getAllUsers,
  banUser,
  unbanUser
} from '../controllers/adminUsersController';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

    // Admin locations
    router.post('/locations', setAdminLocations);
    router.get('/locations', getAdminLocations);
    router.get('/locations/all', getAllCountyAssignments);

// Admin issues and suggestions (filtered by their counties)
router.get('/issues', getIssuesForAdmin);
router.get('/suggestions', getSuggestionsForAdmin);
router.patch('/issues/:id/status', updateIssueStatus);
router.patch('/suggestions/:id/status', updateSuggestionStatus);

// Admin user management
router.get('/users', getAllUsers);
router.post('/users/ban', banUser);
router.delete('/users/:userId/ban', unbanUser);

// Legacy admin routes (keep for backward compatibility)
router.get('/stats', getStats);
router.delete('/issues/:id', deleteIssue);
router.post('/trigger-weekly-emails', triggerWeeklyEmails);

export default router;
