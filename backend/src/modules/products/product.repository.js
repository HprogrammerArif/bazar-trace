import oracledb from 'oracledb';
import { withConnection } from '../../config/database.js';

const mapProduct = (row) =>
  row && {
    id: row.ID,
    sku: row.SKU,
    barcode: row.BARCODE,
    name: row.NAME,
    category: row.CATEGORY,
    unit: row.UNIT,
    costPrice: Number(row.COST_PRICE),
    sellPrice: Number(row.SELL_PRICE),
    expiryDate: row.EXPIRY_DATE,
    lowStockThreshold: row.LOW_STOCK_THRESHOLD !== undefined ? Number(row.LOW_STOCK_THRESHOLD) : 5,
    isActive: row.IS_ACTIVE === 1,
    stock: row.CURRENT_QTY === undefined ? undefined : Number(row.CURRENT_QTY ?? 0),
    createdAt: row.CREATED_AT,
    updatedAt: row.UPDATED_AT,
  };

const SELECT_WITH_STOCK = `
  SELECT p.id, p.sku, p.barcode, p.name, p.category, p.unit,
         p.cost_price, p.sell_price, p.expiry_date, p.low_stock_threshold, p.is_active,
         p.created_at, p.updated_at,
         NVL(v.current_qty, 0) AS current_qty
    FROM products p
    LEFT JOIN v_product_stock v ON v.product_id = p.id
`;

export async function list({ search, limit, offset }) {
  return withConnection(async (conn) => {
    const where = ['p.is_active = 1'];
    const binds = { limit, offset };
    if (search) {
      where.push('(LOWER(p.name) LIKE :search OR LOWER(p.sku) LIKE :search OR p.barcode LIKE :search)');
      binds.search = `%${search.toLowerCase()}%`;
    }
    const result = await conn.execute(
      `${SELECT_WITH_STOCK}
       WHERE ${where.join(' AND ')}
       ORDER BY p.name
       OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`,
      binds,
    );
    return result.rows.map(mapProduct);
  });
}

export async function findById(id) {
  return withConnection(async (conn) => {
    const result = await conn.execute(
      `${SELECT_WITH_STOCK} WHERE p.id = :id`,
      { id },
    );
    return mapProduct(result.rows[0]);
  });
}

export async function findByBarcode(barcode) {
  return withConnection(async (conn) => {
    const result = await conn.execute(
      `${SELECT_WITH_STOCK} WHERE p.barcode = :barcode`,
      { barcode },
    );
    return mapProduct(result.rows[0]);
  });
}

export async function insert(input, createdBy) {
  return withConnection(async (conn) => {
    const result = await conn.execute(
      `INSERT INTO products (sku, barcode, name, category, unit, cost_price, sell_price, expiry_date, low_stock_threshold, created_by)
       VALUES (:sku, :barcode, :name, :category, :unit, :costPrice, :sellPrice, :expiryDate, :lowStockThreshold, :createdBy)
       RETURNING id INTO :id`,
      {
        sku: input.sku,
        barcode: input.barcode ?? null,
        name: input.name,
        category: input.category ?? null,
        unit: input.unit ?? 'pcs',
        costPrice: input.costPrice,
        sellPrice: input.sellPrice,
        expiryDate: input.expiryDate ?? null,
        lowStockThreshold: input.lowStockThreshold ?? 5,
        createdBy,
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      },
      { autoCommit: true },
    );
    return findById(result.outBinds.id[0]);
  });
}

export async function update(id, patch) {
  const fragments = [];
  const binds = { id };
  const map = {
    sku: 'sku', barcode: 'barcode', name: 'name', category: 'category',
    unit: 'unit', costPrice: 'cost_price', sellPrice: 'sell_price',
    expiryDate: 'expiry_date', lowStockThreshold: 'low_stock_threshold',
  };
  for (const [field, column] of Object.entries(map)) {
    if (patch[field] !== undefined) {
      fragments.push(`${column} = :${field}`);
      binds[field] = patch[field] ?? null;
    }
  }
  if (!fragments.length) return findById(id);
  fragments.push('updated_at = SYSTIMESTAMP');

  return withConnection(async (conn) => {
    await conn.execute(
      `UPDATE products SET ${fragments.join(', ')} WHERE id = :id`,
      binds,
      { autoCommit: true },
    );
    return findById(id);
  });
}

export async function softDelete(id) {
  return withConnection(async (conn) => {
    await conn.execute(
      `UPDATE products SET is_active = 0, updated_at = SYSTIMESTAMP WHERE id = :id`,
      { id },
      { autoCommit: true },
    );
  });
}
