import { Router } from 'express';
import {
  getSettings,
  updateSettings,
} from '@/controllers/settingsController';
import {
  authenticate,
  authorize,
} from '@/middlewares/authMiddleware';

const router = Router();

/**
 * GET /api/v1/settings
 *
 * Public:
 * Used by the CCS website to read the current settings.
 */
router.get('/', getSettings);

/**
 * PUT /api/v1/settings
 *
 * Admin only:
 * Used by the CCS Admin panel to update website settings.
 */
router.put(
  '/',
  authenticate,
  authorize('admin'),
  updateSettings
);

export default router;
