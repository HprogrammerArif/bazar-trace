import oracledb from 'oracledb';
import { env } from './env.js';
import { logger } from './logger.js';

const POOL_ALIAS = 'bazarPool';
let dbReady = false;

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
oracledb.autoCommit = false;
oracledb.fetchAsString = [oracledb.CLOB];

export async function initDbPool() {
  if (!env.oracle.enabled) {
    logger.warn('Oracle DB integration is disabled; skipping pool initialization');
    dbReady = false;
    return false;
  }

  try {
    await oracledb.createPool({
      poolAlias: POOL_ALIAS,
      user: env.oracle.user,
      password: env.oracle.password,
      connectString: env.oracle.connectString,
      poolMin: env.oracle.poolMin,
      poolMax: env.oracle.poolMax,
      poolIncrement: env.oracle.poolIncrement,
      poolTimeout: env.oracle.poolTimeout,
    });

    logger.info(
      `Oracle pool "${POOL_ALIAS}" created (min=${env.oracle.poolMin}, max=${env.oracle.poolMax})`,
    );

    const conn = await oracledb.getConnection(POOL_ALIAS);
    await conn.execute('SELECT 1 FROM dual');
    await conn.close();
    logger.info('Oracle connectivity check passed');
    dbReady = true;
    return true;
  } catch (err) {
    dbReady = false;
    logger.error(`Failed to initialize Oracle pool: ${err.message}`);

    if (env.isProd) {
      throw err;
    }

    logger.warn('Continuing without Oracle DB because the app is not running in production');
    return false;
  }
}

export async function closeDbPool() {
  try {
    const pool = oracledb.getPool(POOL_ALIAS);
    if (pool) {
      await pool.close(10);
      dbReady = false;
      logger.info(`Oracle pool "${POOL_ALIAS}" closed`);
    }
  } catch (err) {
    logger.error(`Error closing Oracle pool: ${err.message}`);
  }
}

export function isDbEnabled() {
  return env.oracle.enabled;
}

export function isDbReady() {
  return dbReady;
}

export async function getConnection() {
  if (!env.oracle.enabled) {
    throw new Error('Oracle DB is disabled by configuration');
  }

  if (!dbReady) {
    throw new Error('Oracle DB pool is not initialized');
  }

  return oracledb.getConnection(POOL_ALIAS);
}

export async function withConnection(handler) {
  const conn = await getConnection();
  try {
    return await handler(conn);
  } finally {
    try {
      await conn.close();
    } catch (err) {
      logger.warn(`Failed to release Oracle connection: ${err.message}`);
    }
  }
}
