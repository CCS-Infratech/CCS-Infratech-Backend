import { Router } from 'express';
import {
  uploadMedia,
  deleteImage,
  getImages,
  getS3Images,
  deleteS3Image,
} from '@/controllers/imageController';
import {
  authenticate,
  authorize,
} from '@/middlewares/authMiddleware';

const router = Router();

// Public website route
router.get('/', getImages);

// Admin-only S3/media management
router.get(
  '/getAllS3Images',
  authenticate,
  authorize('admin'),
  getS3Images
);

router.post(
  '/upload',
  authenticate,
  authorize('admin'),
  uploadMedia
);

router.delete(
  '/deleteS3Image',
  authenticate,
  authorize('admin'),
  deleteS3Image
);

router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  deleteImage
);

export default router;
