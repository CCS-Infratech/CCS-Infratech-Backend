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
import { blogCreateSchema, blogUpdateSchema } from '@/schemas/blogSchema';
import { authenticate } from '@/middlewares/authMiddleware';
const router = Router();

// Public routes
router.get('/', getBlogs);
router.get('/published', getPublisedBlogs);
router.get('/:identifier', getBlog);

router.post('/', authenticate, validateRequest({ body: blogCreateSchema }), createBlog);

router.put('/:id', authenticate, validateRequest({ body: blogUpdateSchema }), updateBlog);

router.delete('/:id', authenticate, deleteBlog);

// router.post(
//   '/:id/images',
//   authenticate,
//   upload.array('images', 10),
//   uploadBlogImages
// );

export default router;
