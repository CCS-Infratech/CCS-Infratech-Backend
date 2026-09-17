import { Router } from 'express';
import {
  createLead,
  getLeads,
  getLead,
  updateLead,
  deleteLead,
} from '@/controllers/leadController';
import {
  authenticate,
  authorize,
} from '@/middlewares/authMiddleware';

const router = Router();

// Public: website forms create leads
router.post('/', createLead);

// Admin + Sales: view leads
router.get(
  '/',
  authenticate,
  authorize('admin', 'sales'),
  getLeads
);

router.get(
  '/:id',
  authenticate,
  authorize('admin', 'sales'),
  getLead
);

// Admin + Sales: update lead status
router.patch(
  '/:id',
  authenticate,
  authorize('admin', 'sales'),
  updateLead
);

// Admin only: delete leads
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  deleteLead
);

export default router;
