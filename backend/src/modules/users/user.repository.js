import { withConnection } from '../../config/database.js';

const mapUser = (row) =>
  row && {
    id: row.ID,
    fullName: row.FULL_NAME,
    email: row.EMAIL,
    role: row.ROLE,
    isActive: row.IS_ACTIVE === 1,
    createdAt: row.CREATED_AT,
    updatedAt: row.UPDATED_AT,
  };

export async function listAll() {
  return withConnection(async (conn) => {
    const result = await conn.execute(
      `SELECT id, full_name, email, role, is_active, created_at, updated_at
         FROM users
         ORDER BY created_at DESC`,
    );
    return result.rows.map(mapUser);
  });
}

export async function findById(id) {
  return withConnection(async (conn) => {
    const result = await conn.execute(
      `SELECT id, full_name, email, role, is_active, created_at, updated_at
         FROM users WHERE id = :id`,
      { id },
    );
    return mapUser(result.rows[0]);
  });
}

export async function update(id, patch) {
  const fragments = [];
  const binds = { id };
  if (patch.fullName !== undefined) { fragments.push('full_name = :fullName'); binds.fullName = patch.fullName; }
  if (patch.role !== undefined)     { fragments.push('role = :role');           binds.role = patch.role; }
  if (patch.isActive !== undefined) { fragments.push('is_active = :isActive');  binds.isActive = patch.isActive ? 1 : 0; }

  if (!fragments.length) return findById(id);
  fragments.push('updated_at = SYSTIMESTAMP');

  return withConnection(async (conn) => {
    await conn.execute(
      `UPDATE users SET ${fragments.join(', ')} WHERE id = :id`,
      binds,
      { autoCommit: true },
    );
    return findById(id);
  });
}
