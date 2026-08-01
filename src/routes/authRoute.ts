import { Router } from 'express';
import {
  loginUser,
  logoutUser,
  registerUser,
  getUserDetails,
} from '@/controllers/userAuthController';
import { authRateLimiter } from '@/middlewares/rateLimiter';
import { validateRequest } from '@/middlewares/validateRequest';
import { userLoginSchema, userRegisterSchema } from '@/schemas/userSchema';
import { authenticate } from '@/middlewares/authMiddleware';

const router = Router();

router.use(authRateLimiter);

router.get('/me', authenticate, getUserDetails);

router.post('/register', validateRequest({ body: userRegisterSchema }), registerUser);

router.post('/login', validateRequest({ body: userLoginSchema }), loginUser);

router.post('/logout', logoutUser);

export default router;
