import { Router } from 'express';
import {
  createVideoUploadUrl,
  deleteVideo,
  listVideos,
} from '@/controllers/videoController';
import {
  authenticate,
  authorize,
} from '@/middlewares/authMiddleware';

const router = Router();

// Admin-only: list videos already uploaded to S3.
router.get(
  '/',
  authenticate,
  authorize('admin'),
  listVideos
);

// Admin-only: hand out a short-lived pre-signed S3 upload URL.
router.post(
  '/presign',
  authenticate,
  authorize('admin'),
  createVideoUploadUrl
);

router.delete(
  '/',
  authenticate,
  authorize('admin'),
  deleteVideo
);

export default router;
