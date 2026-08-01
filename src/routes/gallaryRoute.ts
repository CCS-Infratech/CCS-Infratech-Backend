import { Router } from 'express';
import { authenticate } from '@/middlewares/authMiddleware';
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
const router = Router();

router.get('/', getAllGalleries);
router.get('/published', getPublishedGalleries);
router.get('/:id', getGalleryById);
router.get('/:id/published', getPublishedGalleryById);
router.post('/', createGallery);
router.put('/:id', updateGallery);
router.delete('/:id', deleteGallery);
router.delete('/gallary-images/:id', deleteGalleryImage);

export default router;
