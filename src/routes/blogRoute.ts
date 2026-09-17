import { Router } from 'express';
import {
  createBlog,
  getBlogs,
  getBlog,
  updateBlog,
  deleteBlog,
  uploadBlogImages,
  getPublisedBlogs,
} from '@/controllers/blogController';
import { validateRequest } from '@/middlewares/validateRequest';
import {
  blogCreateSchema,
  blogUpdateSchema,
} from '@/schemas/blogSchema';
import {
  authenticate,
  authorize,
} from '@/middlewares/authMiddleware';

const router = Router();

// Public routes
router.get('/', getBlogs);
router.get('/published', getPublisedBlogs);
router.get('/:identifier', getBlog);

// Admin-only management
router.post(
  '/',
  authenticate,
  authorize('admin'),
  validateRequest({ body: blogCreateSchema }),
  createBlog
);

router.put(
  '/:id',
  authenticate,
  authorize('admin'),
  validateRequest({ body: blogUpdateSchema }),
  updateBlog
);

router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  deleteBlog
);

// router.post(
//   '/:id/images',
//   authenticate,
//   upload.array('images', 10),
//   uploadBlogImages
// );

export default router;
