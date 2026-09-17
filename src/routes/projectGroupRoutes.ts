import { Router } from 'express';
import {
  createProjectGroup,
  getProjectGroups,
  getPublishedProjectGroups,
  getProjectGroup,
  getPublishedProjectGroup,
  updateProjectGroup,
  deleteProjectGroup,
} from '@/controllers/projectGroupController';
import {
  authenticate,
  authorize,
} from '@/middlewares/authMiddleware';

const router = Router();

// Public website routes
router.get('/published', getPublishedProjectGroups);
router.get('/published/:id', getPublishedProjectGroup);

// Admin-only management
router.get(
  '/',
  authenticate,
  authorize('admin'),
  getProjectGroups
);

router.get(
  '/:id',
  authenticate,
  authorize('admin'),
  getProjectGroup
);

router.post(
  '/',
  authenticate,
  authorize('admin'),
  createProjectGroup
);

router.put(
  '/:id',
  authenticate,
  authorize('admin'),
  updateProjectGroup
);

router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  deleteProjectGroup
);

export default router;
