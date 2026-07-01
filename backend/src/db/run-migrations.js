import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { closeDbPool, initDbPool, withConnection } from '../config/database.js';
import { logger } from '../config/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

const splitStatements = (sql) =>
  sql
    .split(/;\s*\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

async function ensureMigrationsTable(conn) {
  try {
    await conn.execute(`
      CREATE TABLE schema_migrations (
        id        VARCHAR2(255) PRIMARY KEY,
        applied_at TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL
      )
    `);
    await conn.commit();
  } catch (err) {
    if (err.errorNum !== 955) throw err; // ORA-00955: name already used
  }
}

async function alreadyApplied(conn, id) {
  const r = await conn.execute(
    'SELECT 1 FROM schema_migrations WHERE id = :id',
    { id },
  );
  return r.rows.length > 0;
}

async function recordApplied(conn, id) {
  await conn.execute(
    'INSERT INTO schema_migrations (id) VALUES (:id)',
    { id },
    { autoCommit: true },
  );
}

async function run() {
  await initDbPool();
  const files = (await fs.readdir(MIGRATIONS_DIR))
    .filter((f) => f.endsWith('.sql'))
    .sort();

  await withConnection(async (conn) => {
    await ensureMigrationsTable(conn);
    for (const file of files) {
      if (await alreadyApplied(conn, file)) {
        logger.info(`migration: ${file} (skipped — already applied)`);
        continue;
      }
      const sql = await fs.readFile(path.join(MIGRATIONS_DIR, file), 'utf8');
      for (const stmt of splitStatements(sql)) {
        await conn.execute(stmt);
      }
      await conn.commit();
      await recordApplied(conn, file);
      logger.info(`migration: ${file} applied`);
    }
  });
}

run()
  .catch((err) => {
    logger.error(`Migration failed: ${err.message}`);
    process.exitCode = 1;
  })
  .finally(closeDbPool);
