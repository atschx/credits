-- ============================================================================
-- Credit System DDL (H2 compatible, MODE=MySQL)
-- ============================================================================

CREATE TABLE IF NOT EXISTS grant_types (
    id                  CHAR(36)        NOT NULL,
    name                VARCHAR(100)    NOT NULL,
    code                VARCHAR(50)     NOT NULL,
    is_revenue_bearing  BOOLEAN         NOT NULL DEFAULT FALSE,
    accounting_treatment TEXT           NULL,
    default_expiry_days INT             NOT NULL DEFAULT 365,
    PRIMARY KEY (id),
    CONSTRAINT uk_grant_types_code UNIQUE (code)
);

CREATE TABLE IF NOT EXISTS fee_categories (
    id              CHAR(36)        NOT NULL,
    code            VARCHAR(50)     NOT NULL,
    name            VARCHAR(100)    NOT NULL,
    is_revenue      BOOLEAN         NOT NULL DEFAULT TRUE,
    is_refundable   BOOLEAN         NOT NULL DEFAULT FALSE,
    gl_account_code VARCHAR(50)     NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_fee_categories_code UNIQUE (code)
);

CREATE TABLE IF NOT EXISTS rate_cards (
    id              CHAR(36)        NOT NULL,
    name            VARCHAR(200)    NOT NULL,
    currency        CHAR(3)         NOT NULL DEFAULT 'USD',
    status          VARCHAR(20)     NOT NULL DEFAULT 'draft',
    effective_from  TIMESTAMP       NOT NULL,
    effective_to    TIMESTAMP       NULL,
    PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS idx_rc_status_effective ON rate_cards (status, effective_from, effective_to);

CREATE TABLE IF NOT EXISTS rate_card_items (
    id              CHAR(36)        NOT NULL,
    rate_card_id    CHAR(36)        NOT NULL,
    action_code     VARCHAR(50)     NOT NULL,
    action_name     VARCHAR(200)    NOT NULL,
    unit_of_measure VARCHAR(50)     NOT NULL DEFAULT 'request',
    base_credit_cost INT            NOT NULL,
    fee_credit_cost  INT            NOT NULL DEFAULT 0,
    fee_category_id  CHAR(36)       NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_rci_card_action UNIQUE (rate_card_id, action_code),
    CONSTRAINT fk_rci_rate_card FOREIGN KEY (rate_card_id) REFERENCES rate_cards (id),
    CONSTRAINT fk_rci_fee_category FOREIGN KEY (fee_category_id) REFERENCES fee_categories (id)
);

CREATE TABLE IF NOT EXISTS accounts (
    id              CHAR(36)        NOT NULL,
    name            VARCHAR(200)    NOT NULL,
    billing_email   VARCHAR(255)    NULL,
    rate_card_id    CHAR(36)        NULL,
    status          VARCHAR(20)     NOT NULL DEFAULT 'active',
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_accounts_rate_card FOREIGN KEY (rate_card_id) REFERENCES rate_cards (id)
);
CREATE INDEX IF NOT EXISTS idx_accounts_rate_card ON accounts (rate_card_id);
CREATE INDEX IF NOT EXISTS idx_accounts_status ON accounts (status);

CREATE TABLE IF NOT EXISTS credit_grants (
    id                  CHAR(36)    NOT NULL,
    account_id          CHAR(36)    NOT NULL,
    grant_type_id       CHAR(36)    NOT NULL,
    source_reference    VARCHAR(200) NULL,
    original_amount     BIGINT      NOT NULL,
    remaining_amount    BIGINT      NOT NULL,
    cost_basis_per_unit DECIMAL(10,6) NOT NULL DEFAULT 0,
    currency            CHAR(3)     NOT NULL DEFAULT 'USD',
    expires_at          TIMESTAMP   NULL,
    created_at          TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metadata            CLOB        NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_cg_account FOREIGN KEY (account_id) REFERENCES accounts (id),
    CONSTRAINT fk_cg_grant_type FOREIGN KEY (grant_type_id) REFERENCES grant_types (id)
);
CREATE INDEX IF NOT EXISTS idx_cg_account_remaining_expires ON credit_grants (account_id, remaining_amount, expires_at);
CREATE INDEX IF NOT EXISTS idx_cg_grant_type ON credit_grants (grant_type_id);

CREATE TABLE IF NOT EXISTS credit_balances (
    id                  CHAR(36)    NOT NULL,
    account_id          CHAR(36)    NOT NULL,
    total_balance       BIGINT      NOT NULL DEFAULT 0,
    purchased_balance   BIGINT      NOT NULL DEFAULT 0,
    promotional_balance BIGINT      NOT NULL DEFAULT 0,
    bonus_balance       BIGINT      NOT NULL DEFAULT 0,
    updated_at          TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uk_cb_account UNIQUE (account_id),
    CONSTRAINT fk_cb_account FOREIGN KEY (account_id) REFERENCES accounts (id)
);

CREATE TABLE IF NOT EXISTS credit_transactions (
    id              CHAR(36)        NOT NULL,
    account_id      CHAR(36)        NOT NULL,
    grant_id        CHAR(36)        NULL,
    type            VARCHAR(20)     NOT NULL,
    amount          BIGINT          NOT NULL,
    revenue_impact  DECIMAL(12,4)   NOT NULL DEFAULT 0,
    idempotency_key VARCHAR(200)    NOT NULL,
    description     VARCHAR(500)    NULL,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uk_ct_idempotency UNIQUE (idempotency_key),
    CONSTRAINT fk_ct_account FOREIGN KEY (account_id) REFERENCES accounts (id),
    CONSTRAINT fk_ct_grant FOREIGN KEY (grant_id) REFERENCES credit_grants (id)
);
CREATE INDEX IF NOT EXISTS idx_ct_account_created ON credit_transactions (account_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ct_grant ON credit_transactions (grant_id);
CREATE INDEX IF NOT EXISTS idx_ct_type_created ON credit_transactions (type, created_at);

CREATE TABLE IF NOT EXISTS transaction_line_items (
    id              CHAR(36)        NOT NULL,
    transaction_id  CHAR(36)        NOT NULL,
    fee_category_id CHAR(36)        NOT NULL,
    amount          BIGINT          NOT NULL,
    revenue_impact  DECIMAL(12,4)   NOT NULL DEFAULT 0,
    label           VARCHAR(200)    NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_tli_transaction FOREIGN KEY (transaction_id) REFERENCES credit_transactions (id),
    CONSTRAINT fk_tli_fee_category FOREIGN KEY (fee_category_id) REFERENCES fee_categories (id)
);
CREATE INDEX IF NOT EXISTS idx_tli_transaction ON transaction_line_items (transaction_id);
CREATE INDEX IF NOT EXISTS idx_tli_fee_category ON transaction_line_items (fee_category_id);

CREATE TABLE IF NOT EXISTS refund_records (
    id              CHAR(36)        NOT NULL,
    original_txn_id CHAR(36)        NOT NULL,
    refund_txn_id   CHAR(36)        NOT NULL,
    reason          VARCHAR(30)     NOT NULL,
    refund_pct      DECIMAL(5,2)    NOT NULL,
    include_fees    BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_rr_original_txn FOREIGN KEY (original_txn_id) REFERENCES credit_transactions (id),
    CONSTRAINT fk_rr_refund_txn FOREIGN KEY (refund_txn_id) REFERENCES credit_transactions (id)
);
CREATE INDEX IF NOT EXISTS idx_rr_original_txn ON refund_records (original_txn_id);
CREATE INDEX IF NOT EXISTS idx_rr_refund_txn ON refund_records (refund_txn_id);
