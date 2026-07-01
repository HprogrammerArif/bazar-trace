import oracledb from 'oracledb';
import { withConnection } from '../../config/database.js';

const mapTxn = (row) =>
  row && {
    id: row.ID,
    clientTxnId: row.CLIENT_TXN_ID,
    productId: row.PRODUCT_ID,
    userId: row.USER_ID,
    type: row.TXN_TYPE,
    quantity: Number(row.QUANTITY),
    unitPrice: Number(row.UNIT_PRICE),
    note: row.NOTE,
    occurredAt: row.OCCURRED_AT,
    syncedAt: row.SYNCED_AT,
  };

const SELECT_BASE = `
  SELECT id, client_txn_id, product_id, user_id, txn_type,
         quantity, unit_price, note, occurred_at, synced_at
    FROM transactions
`;

export async function findByClientId(clientTxnId) {
  return withConnection(async (conn) => {
    const result = await conn.execute(
      `${SELECT_BASE} WHERE client_txn_id = :clientTxnId`,
      { clientTxnId },
    );
    return mapTxn(result.rows[0]);
  });
}

export async function findById(id) {
  return withConnection(async (conn) => {
    const result = await conn.execute(`${SELECT_BASE} WHERE id = :id`, { id });
    return mapTxn(result.rows[0]);
  });
}

export async function list({ productId, type, from, to, limit, offset }) {
  return withConnection(async (conn) => {
    const where = [];
    const binds = { limit, offset };
    if (productId) { where.push('product_id = :productId'); binds.productId = productId; }
    if (type)      { where.push('txn_type = :type'); binds.type = type; }
    if (from)      { where.push('occurred_at >= :from'); binds.from = new Date(from); }
    if (to)        { where.push('occurred_at < :to');    binds.to = new Date(to); }
    const result = await conn.execute(
      `${SELECT_BASE}
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
       ORDER BY occurred_at DESC
       OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`,
      binds,
    );
    return result.rows.map(mapTxn);
  });
}

export async function currentStock(productId) {
  return withConnection(async (conn) => {
    const result = await conn.execute(
      `SELECT NVL(current_qty, 0) AS qty FROM v_product_stock WHERE product_id = :productId`,
      { productId },
    );
    return result.rows[0] ? Number(result.rows[0].QTY) : 0;
  });
}

export async function insert(input) {
  return withConnection(async (conn) => {
    try {
      const result = await conn.execute(
        `INSERT INTO transactions
            (client_txn_id, product_id, user_id, txn_type, quantity, unit_price, note, occurred_at, synced_at)
         VALUES
            (:clientTxnId, :productId, :userId, :type, :quantity, :unitPrice, :note,
             NVL(:occurredAt, SYSTIMESTAMP), SYSTIMESTAMP)
         RETURNING id INTO :id`,
        {
          clientTxnId: input.clientTxnId,
          productId: input.productId,
          userId: input.userId,
          type: input.type,
          quantity: input.quantity,
          unitPrice: input.unitPrice,
          note: input.note ?? null,
          occurredAt: input.occurredAt ? new Date(input.occurredAt) : null,
          id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
        },
        { autoCommit: true },
      );
      return findById(result.outBinds.id[0]);
    } catch (err) {
      // Idempotency: if the unique key is hit, return the existing row instead of failing
      if (err.errorNum === 1) {
        const existing = await findByClientId(input.clientTxnId);
        if (existing) return existing;
      }
      throw err;
    }
  });
}
