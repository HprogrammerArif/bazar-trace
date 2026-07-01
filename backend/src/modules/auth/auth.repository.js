import oracledb from 'oracledb';
import { withConnection } from '../../config/database.js';

const mapUser = (row) =>
  row && {
    id: row.ID,
    fullName: row.FULL_NAME,
    email: row.EMAIL,
    role: row.ROLE,
    isActive: row.IS_ACTIVE === 1,
  };

const mapUserWithHash = (row) => row && { ...mapUser(row), passwordHash: row.PASSWORD_HASH };

export async function findByEmail(email) {
  return withConnection(async (conn) => {
    const result = await conn.execute(
      `SELECT id, full_name, email, password_hash, role, is_active
         FROM users
        WHERE LOWER(email) = LOWER(:email)`,
      { email },
    );
    return mapUserWithHash(result.rows[0]);
  });
}

export async function findById(id) {
  return withConnection(async (conn) => {
    const result = await conn.execute(
      `SELECT id, full_name, email, role, is_active FROM users WHERE id = :id`,
      { id },
    );
    return mapUser(result.rows[0]);
  });
}

export async function insertUser({ fullName, email, passwordHash, role }) {
  return withConnection(async (conn) => {
    const result = await conn.execute(
      `INSERT INTO users (full_name, email, password_hash, role)
       VALUES (:fullName, :email, :passwordHash, :role)
       RETURNING id INTO :id`,
      {
        fullName,
        email,
        passwordHash,
        role,
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      },
      { autoCommit: true },
    );
    return findById(result.outBinds.id[0]);
  });
}

export async function findByIdWithHash(id) {
  return withConnection(async (conn) => {
    const result = await conn.execute(
      `SELECT id, full_name, email, password_hash, role, is_active FROM users WHERE id = :id`,
      { id },
    );
    return mapUserWithHash(result.rows[0]);
  });
}

export async function updatePassword(id, passwordHash) {
  return withConnection(async (conn) => {
    await conn.execute(
      `UPDATE users SET password_hash = :passwordHash, updated_at = SYSTIMESTAMP WHERE id = :id`,
      { id, passwordHash },
      { autoCommit: true },
    );
  });
}
