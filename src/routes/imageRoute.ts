import { Router } from 'express';
import {
  uploadMedia,
  deleteImage,
  getImages,
  getS3Images,
  deleteS3Image,
} from '@/controllers/imageController';
import { authenticate } from '@/middlewares/authMiddleware';
const router = Router();

router.get('/', getImages);
router.get('/getAllS3Images', authenticate, getS3Images);

router.post('/upload', authenticate, uploadMedia);

router.delete('/deleteS3Image', authenticate, deleteS3Image);
router.delete('/:id', authenticate, deleteImage);

export default router;
