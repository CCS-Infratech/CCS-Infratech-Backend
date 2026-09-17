import { Router } from 'express';
import {
  createPress,
  deletePress,
  deletePressItem,
  getAllPress,
  getPressById,
  updatePress,
  getPublishedPress,
} from '@/controllers/pressController';
import {
  authenticate,
  authorize,
} from '@/middlewares/authMiddleware';

const router = Router();

// Public website routes
router.get('/', getAllPress);
router.get('/published', getPublishedPress);
router.get('/:id', getPressById);

// Admin-only management
router.post(
  '/',
  authenticate,
  authorize('admin'),
  createPress
);

router.put(
  '/:id',
  authenticate,
  authorize('admin'),
  updatePress
);

router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  deletePress
);

router.delete(
  '/press-items/:id',
  authenticate,
  authorize('admin'),
  deletePressItem
);

export default router;
