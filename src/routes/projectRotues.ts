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
import { authenticate } from '@/middlewares/authMiddleware';

const router = Router();

// 1. Specific/Static routes first
router.get('/published', getPublishedProjects);
router.get('/published/:id', getPublishedProject);

// 2. Dynamic parameter routes last
router.get('/:id', authenticate, getProject);
router.get('/', authenticate, getProjects);

// 3. Mutation routes (POST/PUT/DELETE)
// (Order matters less here, but keep it consistent)
router.post('/', authenticate, createProject);
router.put('/:id', authenticate, updateProject);
router.delete('/:id', authenticate, deleteProject);

export default router;
