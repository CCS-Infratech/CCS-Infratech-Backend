import { z, type AnyZodObject } from 'zod';

const blogCreateSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  summary: z.string().optional(),
  published: z.boolean().optional().default(false),
});

const blogUpdateSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').optional(),
  content: z.string().min(10, 'Content must be at least 10 characters').optional(),
  summary: z.string().optional(),
  published: z.boolean().optional(),
});

export {blogCreateSchema,blogUpdateSchema}