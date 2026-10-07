import { Router } from 'express';

import {
  getTestimonials,
  getAllTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
} from '@/controllers/testimonialController';

import {
  authenticate,
  authorize,
} from '@/middlewares/authMiddleware';

const router = Router();

/**
 * GET /api/v1/testimonials
 *
 * Public endpoint.
 * Returns only active testimonials.
 */
router.get('/', getTestimonials);

/**
 * GET /api/v1/testimonials/admin
 *
 * Admin only.
 * Returns all testimonials including inactive records.
 */
router.get(
  '/admin',
  authenticate,
  authorize('admin'),
  getAllTestimonials
);

/**
 * POST /api/v1/testimonials
 *
 * Admin only.
 */
router.post(
  '/',
  authenticate,
  authorize('admin'),
  createTestimonial
);

/**
 * PUT /api/v1/testimonials/:id
 *
 * Admin only.
 */
router.put(
  '/:id',
  authenticate,
  authorize('admin'),
  updateTestimonial
);

/**
 * DELETE /api/v1/testimonials/:id
 *
 * Admin only.
 */
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  deleteTestimonial
);

export default router;
