import { Router } from 'express';
import { authenticate } from '@/middlewares/authMiddleware';
import {
  createPress,
  deletePress,
  deletePressItem,
  getAllPress,
  getPressById,
  updatePress,
  getPublishedPress,
} from '@/controllers/pressController';

const router = Router();

router.get('/', getAllPress);
router.get('/published', getPublishedPress);
router.get('/:id', getPressById);
router.post('/', createPress);
router.put('/:id', updatePress);
router.delete('/:id', deletePress);
router.delete('/press-items/:id', deletePressItem);

export default router;
