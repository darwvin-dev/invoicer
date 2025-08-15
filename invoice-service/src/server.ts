import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectMongo, disconnectMongo } from './config/mongo.js';
import { logger } from './config/logger.js';
import { scheduleDailyReport } from './jobs/dailyReport.cron.js';

async function bootstrap() {
  process.env.TZ = env.TZ;

  await connectMongo();
  
  const app = createApp();
  const { runOnce } = scheduleDailyReport();
  const server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT, tz: env.TZ }, 'Invoice service up');
  });

  const shutdown = async (signal: string) => {
    logger.warn({ signal }, 'Shutting down...');
    server.close(async () => {
      await disconnectMongo();
      logger.info('HTTP server closed.');
      process.exit(0);
    });
    setTimeout(() => {
      logger.error('Force exit after timeout');
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap().catch((err) => {
  logger.error({ err }, 'Bootstrap failed');
  process.exit(1);
});
