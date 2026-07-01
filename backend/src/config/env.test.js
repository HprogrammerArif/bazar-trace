import test from 'node:test';
import assert from 'node:assert/strict';

import { createEnv } from './env.js';

test('development mode allows Oracle to be disabled without credentials', () => {
  const config = createEnv({
    NODE_ENV: 'development',
    CORS_ORIGIN: 'http://localhost:5173,http://localhost:4173',
  });

  assert.equal(config.oracle.enabled, false);
  assert.deepEqual(config.corsOrigin, [
    'http://localhost:5173',
    'http://localhost:4173',
  ]);
});

test('production mode requires Oracle credentials', () => {
  assert.throws(
    () =>
      createEnv({
        NODE_ENV: 'production',
        JWT_SECRET: 'a-much-longer-secret-value',
      }),
    /ORACLE_USER.*required when Oracle is enabled/,
  );
});

test('explicitly enabling Oracle without credentials fails validation', () => {
  assert.throws(
    () =>
      createEnv({
        NODE_ENV: 'development',
        ORACLE_ENABLED: 'true',
      }),
    /ORACLE_CONNECT_STRING.*required when Oracle is enabled/,
  );
});

test('production mode requires explicit JWT secret', () => {
  assert.throws(
    () =>
      createEnv({
        NODE_ENV: 'production',
        ORACLE_ENABLED: 'true',
        ORACLE_USER: 'u',
        ORACLE_PASSWORD: 'p',
        ORACLE_CONNECT_STRING: 'localhost:1521/XEPDB1',
      }),
    /JWT_SECRET.*production/,
  );
});
