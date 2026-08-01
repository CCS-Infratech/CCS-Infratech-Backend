import { z, type AnyZodObject } from 'zod';

export const userRegisterSchema: AnyZodObject = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'user']).optional().default('user'),
});

export const userLoginSchema: AnyZodObject = z.object({
  identifier: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
});
