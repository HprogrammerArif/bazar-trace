CREATE TABLE users (
    id              NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    full_name       VARCHAR2(120)       NOT NULL,
    email           VARCHAR2(160)       NOT NULL,
    password_hash   VARCHAR2(255)       NOT NULL,
    role            VARCHAR2(20)        DEFAULT 'STAFF' NOT NULL,
    is_active       NUMBER(1)           DEFAULT 1 NOT NULL,
    created_at      TIMESTAMP           DEFAULT SYSTIMESTAMP NOT NULL,
    updated_at      TIMESTAMP           DEFAULT SYSTIMESTAMP NOT NULL,
    CONSTRAINT uk_users_email   UNIQUE (email),
    CONSTRAINT chk_users_role   CHECK (role IN ('ADMIN','STAFF')),
    CONSTRAINT chk_users_active CHECK (is_active IN (0,1))
);
