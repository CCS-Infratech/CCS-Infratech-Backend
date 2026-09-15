import compression from 'compression';
import { type Express } from 'express';
import helmet from 'helmet';
import hpp from 'hpp';
import morgan from 'morgan';

import { cspDirectives } from '@/configs/csp';

import { rateLimiter } from './rateLimiter';

export const applyMiddleware = (app: Express): void => {
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  app.use(helmet.contentSecurityPolicy({ directives: cspDirectives }));

  app.use(helmet.frameguard({ action: 'deny' }));

  app.use(helmet.referrerPolicy({ policy: 'strict-origin-when-cross-origin' }));

  app.use(hpp());

  app.disable('x-powered-by');

  // app.use(cookieParser());

  app.use(
    compression({
      threshold: 1024,
      level: 6,
    })
  );

  app.use(rateLimiter);

  app.use(
    morgan('combined', {
      skip: (req, res) => res.statusCode < 400 && process.env.NODE_ENV === 'production',
    })
  );
};
