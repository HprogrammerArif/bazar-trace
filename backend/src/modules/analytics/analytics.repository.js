import { withConnection } from '../../config/database.js';

export async function counts() {
  return withConnection(async (conn) => {
    const result = await conn.execute(
      `SELECT
         (SELECT COUNT(*) FROM products WHERE is_active = 1) AS active_products,
         (SELECT COUNT(*) FROM products WHERE is_active = 1 AND expiry_date IS NOT NULL AND expiry_date < SYSDATE + 7) AS expiring_soon,
         (SELECT COUNT(*) FROM products WHERE is_active = 1 AND expiry_date IS NOT NULL AND expiry_date < SYSDATE) AS expired,
         (SELECT COUNT(*) FROM v_product_stock v JOIN products p ON p.id = v.product_id WHERE p.is_active = 1 AND v.current_qty <= p.low_stock_threshold) AS low_stock
       FROM dual`,
    );
    const r = result.rows[0] ?? {};
    return {
      activeProducts: Number(r.ACTIVE_PRODUCTS ?? 0),
      expiringSoon:   Number(r.EXPIRING_SOON ?? 0),
      expired:        Number(r.EXPIRED ?? 0),
      lowStock:       Number(r.LOW_STOCK ?? 0),
    };
  });
}

export async function dailySales(days = 7) {
  return withConnection(async (conn) => {
    const result = await conn.execute(
      `SELECT TRUNC(occurred_at) AS day,
              SUM(quantity * unit_price) AS revenue,
              SUM(quantity) AS units
         FROM transactions
        WHERE txn_type = 'OUT'
          AND occurred_at >= TRUNC(SYSDATE) - :days + 1
        GROUP BY TRUNC(occurred_at)
        ORDER BY day`,
      { days },
    );
    return result.rows.map((r) => ({
      day: r.DAY,
      revenue: Number(r.REVENUE ?? 0),
      units:   Number(r.UNITS ?? 0),
    }));
  });
}

export async function expiringProducts(days = 14) {
  return withConnection(async (conn) => {
    const result = await conn.execute(
      `SELECT id, sku, name, barcode, expiry_date
         FROM products
        WHERE is_active = 1
          AND expiry_date IS NOT NULL
          AND expiry_date < SYSDATE + :days
        ORDER BY expiry_date`,
      { days },
    );
    return result.rows.map((r) => ({
      id: r.ID,
      sku: r.SKU,
      name: r.NAME,
      barcode: r.BARCODE,
      expiryDate: r.EXPIRY_DATE,
    }));
  });
}

export async function lowStockProducts() {
  return withConnection(async (conn) => {
    const result = await conn.execute(
      `SELECT v.product_id, v.sku, v.name, v.current_qty, p.low_stock_threshold
         FROM v_product_stock v
         JOIN products p ON p.id = v.product_id
        WHERE p.is_active = 1 AND v.current_qty <= p.low_stock_threshold
        ORDER BY v.current_qty`,
    );
    return result.rows.map((r) => ({
      productId: r.PRODUCT_ID,
      sku: r.SKU,
      name: r.NAME,
      stock: Number(r.CURRENT_QTY ?? 0),
      threshold: Number(r.LOW_STOCK_THRESHOLD ?? 5),
    }));
  });
}

export async function profitLoss({ from, to } = {}) {
  return withConnection(async (conn) => {
    const where = ["t.txn_type = 'OUT'"];
    const binds = {};
    if (from) {
      where.push('t.occurred_at >= :from');
      binds.from = new Date(from);
    }
    if (to) {
      where.push('t.occurred_at <= :to');
      binds.to = new Date(to);
    }
    const result = await conn.execute(
      `SELECT NVL(SUM(t.quantity * t.unit_price), 0) AS revenue,
              NVL(SUM(t.quantity * p.cost_price), 0) AS cost,
              NVL(SUM(t.quantity * t.unit_price) - SUM(t.quantity * p.cost_price), 0) AS profit
         FROM transactions t
         JOIN products p ON p.id = t.product_id
        WHERE ${where.join(' AND ')}`,
      binds,
    );
    const r = result.rows[0] ?? {};
    const revenue = Number(r.REVENUE ?? 0);
    const cost = Number(r.COST ?? 0);
    const profit = Number(r.PROFIT ?? 0);
    const marginPercent = revenue > 0 ? Number(((profit / revenue) * 100).toFixed(2)) : 0;
    return { revenue, cost, profit, marginPercent };
  });
}
