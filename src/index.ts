import express, { type Express, type Request, type Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { corsConfig } from '@/configs/cors';
import { connectToDatabase } from '@/configs/db';
import { envConfig } from '@/configs/env';
import { errorHandler } from '@/middlewares/errorHandler';
import { applyMiddleware } from '@/middlewares/index';
import { notFound } from '@/middlewares/notFound';
import authRoutes from '@/routes/authRoute';
import blogRoutes from '@/routes/blogRoute';
import imageRoutes from '@/routes/imageRoute';
import projectRoutes from '@/routes/projectRotues';
import projectGroupRoutes from '@/routes/projectGroupRoutes';
import gallaryRoutes from '@/routes/gallaryRoute';
import pressRoutes from '@/routes/pressRoute';

const app: Express = express();

// 1. Basic middleware FIRST
app.use(cookieParser());
app.use(cors(corsConfig));
app.use(express.json({ limit: '1mb' }));

applyMiddleware(app);

app.get('/', (_req: Request, res: Response) => {
  res.send('Phew-Phew, API is running! 🚀');
});

app.get('/api/v1/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'API is healthy! 🏥',
    uptime: process.uptime(),
  });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/blog', blogRoutes);
app.use('/api/v1/images', imageRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/project-groups', projectGroupRoutes);
app.use('/api/v1/gallary', gallaryRoutes);
app.use('/api/v1/press', pressRoutes);

app.use(notFound);

app.use(errorHandler);

const initializeApp = async () => {
  try {
    await connectToDatabase();

    const PORT = envConfig.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Error initializing app:', error);
    process.exit(1);
  }
};

initializeApp();

export default app;
