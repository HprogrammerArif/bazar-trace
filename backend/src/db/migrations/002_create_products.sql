CREATE TABLE products (
    id              NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    sku             VARCHAR2(64)        NOT NULL UNIQUE,
    barcode         VARCHAR2(64),
    name            VARCHAR2(200)       NOT NULL,
    category        VARCHAR2(80),
    unit            VARCHAR2(20)        DEFAULT 'pcs' NOT NULL,
    cost_price      NUMBER(12,2)        NOT NULL,
    sell_price      NUMBER(12,2)        NOT NULL,
    expiry_date     DATE,
    is_active       NUMBER(1)           DEFAULT 1 NOT NULL,
    created_by      NUMBER              NOT NULL,
    created_at      TIMESTAMP           DEFAULT SYSTIMESTAMP NOT NULL,
    updated_at      TIMESTAMP           DEFAULT SYSTIMESTAMP NOT NULL,
    CONSTRAINT fk_products_creator   FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT chk_products_prices   CHECK (cost_price >= 0 AND sell_price >= 0),
    CONSTRAINT chk_products_active   CHECK (is_active IN (0,1))
);

CREATE UNIQUE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_expiry ON products(expiry_date);
