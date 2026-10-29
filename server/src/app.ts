import express, { type RequestHandler } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env, isTest } from './config/env';
import { logger } from './utils/logger';
import { prisma } from './utils/prisma';
import { asyncHandler } from './middleware/validate';
import { errorHandler, notFoundHandler } from './middleware/error';

import { authRouter } from './modules/auth/auth.routes';
import { boatsRouter } from './modules/boats/boats.routes';
import { documentsRouter } from './modules/documents/documents.routes';
import { attachmentsRouter } from './modules/attachments/attachments.routes';
import { remindersRouter } from './modules/reminders/reminders.routes';
import { settingsRouter } from './modules/settings/settings.routes';
import { dashboardRouter } from './modules/dashboard/dashboard.routes';

const requestLogger: RequestHandler = (req, res, next) => {
  if (isTest) return next();
  const start = Date.now();
  res.on('finish', () => {
    logger.info(
      { method: req.method, path: req.originalUrl, status: res.statusCode, durationMs: Date.now() - start },
      'request',
    );
  });
  next();
};

const corsOrigin = (): string | string[] => {
  const raw = env.CORS_ORIGIN.trim();
  if (raw === '' || raw === '*') return '*';
  return raw.split(',').map((o) => o.trim()).filter(Boolean);
};

export function createApp(): express.Express {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: corsOrigin(), credentials: false }));
  app.use(express.json({ limit: '1mb' }));
  app.use(requestLogger);

  // Base path is /api — the contract's server URL is http://localhost:4000/api
  app.get(
    '/api/health',
    asyncHandler(async (_req, res) => {
      try {
        await prisma.$queryRaw`SELECT 1`;
        res.json({ status: 'ok' });
      } catch (err) {
        logger.error({ err }, 'health check failed');
        res.status(503).json({ error: { code: 'INTERNAL_ERROR', message: 'Database unavailable' } });
      }
    }),
  );

  app.use('/api', authRouter);
  app.use('/api', boatsRouter);
  app.use('/api', documentsRouter);
  app.use('/api', attachmentsRouter); // /documents/:id/file — never shadowed: extra path segment
  app.use('/api', remindersRouter);
  app.use('/api', settingsRouter);
  app.use('/api', dashboardRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
