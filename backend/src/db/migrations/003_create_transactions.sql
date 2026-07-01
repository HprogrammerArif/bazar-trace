CREATE TABLE transactions (
    id              NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    client_txn_id   VARCHAR2(40)        NOT NULL UNIQUE,
    product_id      NUMBER              NOT NULL,
    user_id         NUMBER              NOT NULL,
    txn_type        VARCHAR2(10)        NOT NULL,
    quantity        NUMBER(12,3)        NOT NULL,
    unit_price      NUMBER(12,2)        NOT NULL,
    note            VARCHAR2(500),
    occurred_at     TIMESTAMP           DEFAULT SYSTIMESTAMP NOT NULL,
    synced_at       TIMESTAMP,
    CONSTRAINT fk_txn_product FOREIGN KEY (product_id) REFERENCES products(id),
    CONSTRAINT fk_txn_user    FOREIGN KEY (user_id)    REFERENCES users(id),
    CONSTRAINT chk_txn_type   CHECK (txn_type IN ('IN','OUT')),
    CONSTRAINT chk_txn_qty    CHECK (quantity > 0)
);

CREATE INDEX idx_txn_product_time ON transactions(product_id, occurred_at);
CREATE INDEX idx_txn_user         ON transactions(user_id);
CREATE INDEX idx_txn_type_time    ON transactions(txn_type, occurred_at);
