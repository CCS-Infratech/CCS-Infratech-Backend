import { Router } from 'express';
import {
  loginUser,
  logoutUser,
  registerUser,
  getUserDetails,
} from '@/controllers/userAuthController';
import { authRateLimiter } from '@/middlewares/rateLimiter';
import { validateRequest } from '@/middlewares/validateRequest';
import {
  userLoginSchema,
  userRegisterSchema,
} from '@/schemas/userSchema';
import {
  authenticate,
  authorize,
} from '@/middlewares/authMiddleware';

const router = Router();

router.use(authRateLimiter);

// Get current logged-in user
router.get(
  '/me',
  authenticate,
  getUserDetails
);

// Only an admin can create users
router.post(
  '/register',
  authenticate,
  authorize('admin'),
  validateRequest({ body: userRegisterSchema }),
  registerUser
);

// Login remains public
router.post(
  '/login',
  validateRequest({ body: userLoginSchema }),
  loginUser
);

// Logout
router.post(
  '/logout',
  logoutUser
);

export default router;
