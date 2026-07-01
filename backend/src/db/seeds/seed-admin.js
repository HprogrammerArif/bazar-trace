import { closeDbPool, initDbPool } from '../../config/database.js';
import { logger } from '../../config/logger.js';
import * as authRepository from '../../modules/auth/auth.repository.js';
import { ROLES } from '../../shared/constants/roles.js';
import { hashPassword } from '../../utils/password.js';

const SEED_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@bazar-trace.local';
const SEED_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'Admin@123';
const SEED_NAME = process.env.SEED_ADMIN_NAME || 'Bazar Admin';

async function run() {
  await initDbPool();

  const existing = await authRepository.findByEmail(SEED_EMAIL);
  if (existing) {
    logger.info(
      `Seed admin already exists (id=${existing.id}, email=${existing.email}) — skipping`,
    );
    return;
  }

  const passwordHash = await hashPassword(SEED_PASSWORD);
  const user = await authRepository.insertUser({
    fullName: SEED_NAME,
    email: SEED_EMAIL,
    passwordHash,
    role: ROLES.ADMIN,
  });

  logger.info(`Seed admin created: id=${user.id}, email=${user.email}`);
  logger.info(`Sign in with: ${SEED_EMAIL} / ${SEED_PASSWORD}`);
  logger.warn('Rotate this password on first login.');
}

run()
  .catch((err) => {
    logger.error(`Seed failed: ${err.message}`);
    process.exitCode = 1;
  })
  .finally(closeDbPool);
