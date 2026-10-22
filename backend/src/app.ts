import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import type { Config } from './config.js';
import type { Repository } from './repositories/repository.js';
import {
  corsPolicy,
  limiter,
  originProtection,
  requireJson,
} from './middleware/security.js';
import { apiRoutes } from './routes/index.js';
import { AppError, errorHandler } from './utils/errors.js';
import { swaggerRoutes } from './swagger.js';

export function createApp(repository: Repository, config: Config) {
  const app = express();
  app.disable('x-powered-by');
  app.set('query parser', 'simple');
  app.use(helmet());
  app.use((_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });
  app.use(originProtection(config), corsPolicy(config));
  app.get('/api/health', (_req, res) => {
    res.json({ data: { status: 'ok' } });
  });
  app.get('/api/ready', async (_req, res) => {
    await repository.ready();
    res.json({ data: { status: 'ready' } });
  });
  app.use('/api', limiter(300), requireJson);
  app.use('/api', swaggerRoutes(config));
  app.use(express.json({ limit: '32kb' }), cookieParser());
  app.use('/api', apiRoutes(repository, config));
  app.use((_req, _res) => {
    throw new AppError(404, 'NOT_FOUND', 'Endpoint not found.');
  });
  app.use(errorHandler);
  return app;
}
