import { createApp } from './app';
import { env } from './config/env';
import { logger } from './utils/logger';
import { prisma } from './utils/prisma';
import { startReminderWorker, stopReminderWorker } from './jobs/reminderWorker';

async function main(): Promise<void> {
  await prisma.$connect();
  logger.info('database connected');

  const app = createApp();
  startReminderWorker();

  const server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT, env: env.NODE_ENV }, `Harbour Desk API listening on http://localhost:${env.PORT}/api`);
  });

  const shutdown = (signal: string): void => {
    logger.info({ signal }, 'shutting down');
    stopReminderWorker();
    server.close(() => {
      void prisma.$disconnect().finally(() => process.exit(0));
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
  logger.error({ err }, 'failed to start server');
  process.exit(1);
});
