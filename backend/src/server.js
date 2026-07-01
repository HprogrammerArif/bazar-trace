import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { initDbPool, closeDbPool } from './config/database.js';

async function bootstrap() {
  await initDbPool();

  const app = createApp();
  const server = app.listen(env.port, () => {
    logger.info(
      `Bazar-Trace API listening on http://localhost:${env.port}${env.apiPrefix} [${env.nodeEnv}]`,
    );
  });

  const shutdown = async (signal) => {
    logger.info(`Received ${signal}. Shutting down gracefully…`);
    server.close(async (err) => {
      if (err) logger.error(`HTTP server close error: ${err.message}`);
      await closeDbPool();
      process.exit(err ? 1 : 0);
    });
    setTimeout(() => {
      logger.error('Forced shutdown after 10s timeout');
      process.exit(1);
    }, 10_000).unref();
  };

  ['SIGINT', 'SIGTERM'].forEach((sig) => process.on(sig, () => shutdown(sig)));

  process.on('unhandledRejection', (reason) => {
    logger.error(`Unhandled rejection: ${reason?.message || reason}`);
  });
  process.on('uncaughtException', (err) => {
    logger.error(`Uncaught exception: ${err.message}`, { stack: err.stack });
    shutdown('uncaughtException');
  });
}

bootstrap().catch((err) => {
  logger.error(`Fatal bootstrap error: ${err.message}`, { stack: err.stack });
  process.exit(1);
});
