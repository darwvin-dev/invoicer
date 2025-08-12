import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import pinoHttp from 'pino-http';
import { logger } from './config/logger.js';
import { env } from './config/env.js';
import apiRoutes from '@/routes/api.js'

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(express.json({ limit: '2mb' }));
  app.use(cors({
    origin: env.CORS_ORIGINS === '*' ? true : env.CORS_ORIGINS.split(','),
    credentials: true
  }));
  app.use(pinoHttp({ logger }));

  app.get('/test', (_req, res) => res.json({ test: true }));

  app.use('/api/v1', apiRoutes);

  app.use((_req, res) => res.status(404).json({ error: 'Not Found' }));

  app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const status = err?.statusCode ?? 500;
    const code = err?.code ?? 'INTERNAL_ERROR';
    req?.log?.error?.({ err }, 'Unhandled error');
    res.status(status).json({ error: { code, message: err?.message ?? 'Server Error' } });
  });

  return app;
}
