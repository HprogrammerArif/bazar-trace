ALTER TABLE products ADD low_stock_threshold NUMBER DEFAULT 5 NOT NULL;
ALTER TABLE products ADD CONSTRAINT chk_products_threshold CHECK (low_stock_threshold >= 0);
