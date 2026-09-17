import { Router } from 'express';

import {
  getLeadership,
  getAllLeadership,
  createLeadership,
  updateLeadership,
  deleteLeadership
} from '@/controllers/leadershipController';

import {
  authenticate,
  authorize
} from '@/middlewares/authMiddleware';

const router = Router();

/**
 * GET /api/v1/leadership
 *
 * Public endpoint.
 * Returns only active leadership members.
 */
router.get('/', getLeadership);

/**
 * GET /api/v1/leadership/admin
 *
 * Admin only.
 * Returns all leadership members including inactive ones.
 */
router.get(
  '/admin',
  authenticate,
  authorize('admin'),
  getAllLeadership
);

/**
 * POST /api/v1/leadership
 *
 * Admin only.
 */
router.post(
  '/',
  authenticate,
  authorize('admin'),
  createLeadership
);

/**
 * PUT /api/v1/leadership/:id
 *
 * Admin only.
 */
router.put(
  '/:id',
  authenticate,
  authorize('admin'),
  updateLeadership
);

/**
 * DELETE /api/v1/leadership/:id
 *
 * Admin only.
 */
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  deleteLeadership
);

export default router;
