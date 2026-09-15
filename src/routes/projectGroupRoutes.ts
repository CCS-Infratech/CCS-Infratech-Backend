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
import { authenticate } from '@/middlewares/authMiddleware';

const router = Router();

router.get('/published', getPublishedProjectGroups);
router.get('/published/:id', getPublishedProjectGroup);

router.get('/', authenticate, getProjectGroups);
router.get('/:id', authenticate, getProjectGroup);
router.post('/', authenticate, createProjectGroup);
router.put('/:id', authenticate, updateProjectGroup);
router.delete('/:id', authenticate, deleteProjectGroup);

export default router;
