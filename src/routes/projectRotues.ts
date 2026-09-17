import { Router } from 'express';
import {
  createProject,
  getProjects,
  getPublishedProjects,
  getProject,
  updateProject,
  deleteProject,
  getPublishedProject,
} from '@/controllers/projectController';
import {
  authenticate,
  authorize,
} from '@/middlewares/authMiddleware';

const router = Router();

// Public website routes
router.get('/published', getPublishedProjects);
router.get('/published/:id', getPublishedProject);

// Admin-only management
router.get(
  '/:id',
  authenticate,
  authorize('admin'),
  getProject
);

router.get(
  '/',
  authenticate,
  authorize('admin'),
  getProjects
);

router.post(
  '/',
  authenticate,
  authorize('admin'),
  createProject
);

router.put(
  '/:id',
  authenticate,
  authorize('admin'),
  updateProject
);

router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  deleteProject
);

export default router;
