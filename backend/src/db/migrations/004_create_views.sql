CREATE OR REPLACE VIEW v_product_stock AS
SELECT  p.id            AS product_id,
        p.sku,
        p.name,
        NVL(SUM(CASE WHEN t.txn_type = 'IN'  THEN t.quantity ELSE 0 END), 0)
        - NVL(SUM(CASE WHEN t.txn_type = 'OUT' THEN t.quantity ELSE 0 END), 0)
                        AS current_qty
FROM    products p
LEFT JOIN transactions t ON t.product_id = p.id
GROUP BY p.id, p.sku, p.name;
