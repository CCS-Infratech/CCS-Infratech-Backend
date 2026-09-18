import { Router } from 'express';
import {
  createWalkthrough,
  deleteWalkthrough,
  getAllWalkthroughs,
  getPublishedWalkthroughs,
  getWalkthroughById,
  updateWalkthrough,
} from '@/controllers/walkthroughController';
import {
  authenticate,
  authorize,
} from '@/middlewares/authMiddleware';

const router = Router();

// Public website route
router.get('/published', getPublishedWalkthroughs);

// Admin-only management/read routes
router.get(
  '/',
  authenticate,
  authorize('admin'),
  getAllWalkthroughs
);

router.get(
  '/:id',
  authenticate,
  authorize('admin'),
  getWalkthroughById
);

router.post(
  '/',
  authenticate,
  authorize('admin'),
  createWalkthrough
);

router.put(
  '/:id',
  authenticate,
  authorize('admin'),
  updateWalkthrough
);

router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  deleteWalkthrough
);

export default router;
