import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();
dotenv.config({ path: `.env.${process.env.NODE_ENV || 'development'}`, override: true });

const envSchema = z.object({
  PORT: z.coerce.number().default(8000),
  DATABASE_URL: z.string().url().or(z.string().startsWith('sqlite://')),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid or missing environment variables:\n', parsed.error.issues);
  console.error(parsed.error.format());
  process.exit(1);
}

export const envConfig = parsed.data;
