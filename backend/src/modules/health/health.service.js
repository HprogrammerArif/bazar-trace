import { isDbEnabled, isDbReady, withConnection } from '../../config/database.js';
import { logger } from '../../config/logger.js';

export async function checkHealth() {
  const startedAt = Date.now();
  let dbStatus = 'disabled';

  if (isDbEnabled()) {
    dbStatus = isDbReady() ? 'up' : 'down';
  }

  try {
    if (isDbEnabled()) {
      await withConnection(async (conn) => {
        await conn.execute('SELECT 1 FROM dual');
      });
      dbStatus = 'up';
    }
  } catch (err) {
    logger.warn(`Health check: DB probe failed - ${err.message}`);
    dbStatus = 'down';
  }

  return {
    status: dbStatus === 'up' || dbStatus === 'disabled' ? 'ok' : 'degraded',
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    dependencies: { oracle: dbStatus },
    responseTimeMs: Date.now() - startedAt,
  };
}
