import 'dotenv/config';
import { z } from 'zod';

const truthy = new Set(['true', '1', 'yes', 'on']);
const falsy = new Set(['false', '0', 'no', 'off', '']);

const optionalBoolean = z
  .string()
  .optional()
  .transform((v) => {
    if (v === undefined) return undefined;
    const s = String(v).toLowerCase();
    if (truthy.has(s)) return true;
    if (falsy.has(s)) return false;
    throw new Error(`expected boolean, got "${v}"`);
  });

const numberFromString = (defaultValue, { min = 0 } = {}) =>
  z
    .string()
    .optional()
    .transform((v) => (v === undefined || v === '' ? defaultValue : Number(v)))
    .refine((n) => Number.isFinite(n) && n >= min, `must be a number >= ${min}`);

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: numberFromString(5000, { min: 1 }),
  API_PREFIX: z.string().default('/api/v1'),
  LOG_LEVEL: z
    .enum(['error', 'warn', 'info', 'http', 'debug'])
    .default('info'),

  CORS_ORIGIN: z.string().default('*'),

  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 chars').default('dev-only-secret-change-me-please'),
  JWT_EXPIRES_IN: z.string().default('12h'),
  BCRYPT_ROUNDS: numberFromString(10, { min: 4 }),

  ORACLE_ENABLED: optionalBoolean,
  ORACLE_USER: z.string().optional().default(''),
  ORACLE_PASSWORD: z.string().optional().default(''),
  ORACLE_CONNECT_STRING: z.string().optional().default(''),
  ORACLE_POOL_MIN: numberFromString(2),
  ORACLE_POOL_MAX: numberFromString(10, { min: 1 }),
  ORACLE_POOL_INCREMENT: numberFromString(1),
  ORACLE_POOL_TIMEOUT: numberFromString(60),
});

export function createEnv(rawEnv = process.env) {
  const parsed = envSchema.safeParse(rawEnv);

  const issues = parsed.success
    ? []
    : parsed.error.issues.map((i) => `"${i.path.join('.')}": ${i.message}`);

  const value = parsed.success ? parsed.data : {};

  const oracleEnabled =
    typeof value.ORACLE_ENABLED === 'boolean'
      ? value.ORACLE_ENABLED
      : value.NODE_ENV === 'production';

  if (oracleEnabled) {
    for (const key of ['ORACLE_USER', 'ORACLE_PASSWORD', 'ORACLE_CONNECT_STRING']) {
      if (!value[key]) issues.push(`"${key}" is required when Oracle is enabled`);
    }
  }

  if (value.NODE_ENV === 'production' && value.JWT_SECRET === 'dev-only-secret-change-me-please') {
    issues.push('"JWT_SECRET" must be set explicitly in production');
  }

  if (issues.length) {
    throw new Error(`Invalid environment configuration:\n${issues.map((m) => `  - ${m}`).join('\n')}`);
  }

  return Object.freeze({
    nodeEnv: value.NODE_ENV,
    isProd: value.NODE_ENV === 'production',
    isDev: value.NODE_ENV === 'development',
    isTest: value.NODE_ENV === 'test',

    port: value.PORT,
    apiPrefix: value.API_PREFIX,
    logLevel: value.LOG_LEVEL,

    corsOrigin: value.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean),

    jwt: {
      secret: value.JWT_SECRET,
      expiresIn: value.JWT_EXPIRES_IN,
    },
    bcryptRounds: value.BCRYPT_ROUNDS,

    oracle: {
      enabled: oracleEnabled,
      user: value.ORACLE_USER || null,
      password: value.ORACLE_PASSWORD || null,
      connectString: value.ORACLE_CONNECT_STRING || null,
      poolMin: value.ORACLE_POOL_MIN,
      poolMax: value.ORACLE_POOL_MAX,
      poolIncrement: value.ORACLE_POOL_INCREMENT,
      poolTimeout: value.ORACLE_POOL_TIMEOUT,
    },
  });
}

export const env = createEnv();
