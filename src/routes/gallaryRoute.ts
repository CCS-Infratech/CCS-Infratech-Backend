import { Router } from 'express';
import {
  createGallery,
  deleteGallery,
  deleteGalleryImage,
  getAllGalleries,
  getGalleryById,
  updateGallery,
  getPublishedGalleries,
  getPublishedGalleryById,
} from '@/controllers/gallaryController';
import {
  authenticate,
  authorize,
} from '@/middlewares/authMiddleware';

const router = Router();

// Public website routes
router.get('/', getAllGalleries);
router.get('/published', getPublishedGalleries);
router.get('/:id', getGalleryById);
router.get('/:id/published', getPublishedGalleryById);

// Admin-only management
router.post(
  '/',
  authenticate,
  authorize('admin'),
  createGallery
);

router.put(
  '/:id',
  authenticate,
  authorize('admin'),
  updateGallery
);

router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  deleteGallery
);

router.delete(
  '/gallary-images/:id',
  authenticate,
  authorize('admin'),
  deleteGalleryImage
);

export default router;

