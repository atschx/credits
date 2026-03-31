-- ============================================================================
-- Credit System DDL (MySQL 8.0+)
-- 基于信用消耗模型 + ASC 606 收入确认需求
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. GRANT_TYPES — 信用授予类型（字典表，低频写、高频读）
-- ----------------------------------------------------------------------------
CREATE TABLE grant_types (
    id              CHAR(36)        NOT NULL,
    name            VARCHAR(100)    NOT NULL,
    code            VARCHAR(50)     NOT NULL,
    is_revenue_bearing TINYINT(1)   NOT NULL DEFAULT 0    COMMENT '是否产生收入（purchased=1, promotional/bonus=0）',
    accounting_treatment TEXT       NULL                   COMMENT 'ASC 606 会计处理说明',
    default_expiry_days INT        NOT NULL DEFAULT 365,

    PRIMARY KEY (id),
    UNIQUE KEY uk_grant_types_code (code),
    CONSTRAINT ck_grant_types_default_expiry_days CHECK (default_expiry_days > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='信用授予类型字典';


-- ----------------------------------------------------------------------------
-- 2. FEE_CATEGORIES — 费用分类（字典表）
-- ----------------------------------------------------------------------------
CREATE TABLE fee_categories (
    id              CHAR(36)        NOT NULL,
    code            VARCHAR(50)     NOT NULL,
    name            VARCHAR(100)    NOT NULL,
    is_revenue      TINYINT(1)      NOT NULL DEFAULT 1    COMMENT '是否计入收入',
    is_refundable   TINYINT(1)      NOT NULL DEFAULT 0,
    gl_account_code VARCHAR(50)     NULL                   COMMENT '总账科目编码',

    PRIMARY KEY (id),
    UNIQUE KEY uk_fee_categories_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='费用分类字典';


-- ----------------------------------------------------------------------------
-- 3. RATE_CARDS — 费率卡（版本化，通过 effective_from/to 管理生命周期）
-- ----------------------------------------------------------------------------
CREATE TABLE rate_cards (
    id              CHAR(36)        NOT NULL,
    name            VARCHAR(200)    NOT NULL,
    currency        CHAR(3)         NOT NULL DEFAULT 'USD' COMMENT 'ISO 4217 币种',
    status          VARCHAR(20)     NOT NULL DEFAULT 'draft',
    effective_from  TIMESTAMP       NOT NULL,
    effective_to    TIMESTAMP       NULL                   COMMENT 'NULL 表示无限期有效',

    PRIMARY KEY (id),
    -- 查询"当前生效的费率卡"：WHERE status='active' AND effective_from <= NOW() AND (effective_to IS NULL OR effective_to > NOW())
    KEY idx_rc_status_effective (status, effective_from, effective_to),
    CONSTRAINT ck_rate_cards_status CHECK (status IN ('draft', 'active', 'archived'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='费率卡主表';


-- ----------------------------------------------------------------------------
-- 4. RATE_CARD_ITEMS — 费率卡明细（每个计费动作的 credit 定价）
-- ----------------------------------------------------------------------------
CREATE TABLE rate_card_items (
    id              CHAR(36)        NOT NULL,
    rate_card_id    CHAR(36)        NOT NULL,
    action_code     VARCHAR(50)     NOT NULL               COMMENT '计费动作标识，如 api_call, embedding, storage',
    action_name     VARCHAR(200)    NOT NULL               COMMENT '可读名称',
    unit_of_measure VARCHAR(50)     NOT NULL DEFAULT 'request' COMMENT '计量单位：request, 1k_tokens, gb_month, seat_month',
    base_credit_cost INT            NOT NULL               COMMENT '每单位消耗的基础 credits',
    fee_credit_cost  INT            NOT NULL DEFAULT 0     COMMENT '每单位附加费用 credits',
    fee_category_id  CHAR(36)       NULL,

    PRIMARY KEY (id),
    -- 核心查询：根据 rate_card_id + action_code 定位某个动作的 credit 成本
    UNIQUE KEY uk_rci_card_action (rate_card_id, action_code),
    KEY idx_rci_fee_category (fee_category_id),

    CONSTRAINT fk_rci_rate_card FOREIGN KEY (rate_card_id) REFERENCES rate_cards (id),
    CONSTRAINT fk_rci_fee_category FOREIGN KEY (fee_category_id) REFERENCES fee_categories (id),
    CONSTRAINT ck_rate_card_items_base_credit_cost CHECK (base_credit_cost >= 0),
    CONSTRAINT ck_rate_card_items_fee_credit_cost CHECK (fee_credit_cost >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='费率卡明细';


-- ----------------------------------------------------------------------------
-- 5. ACCOUNTS — 客户账户
-- ----------------------------------------------------------------------------
CREATE TABLE accounts (
    id              CHAR(36)        NOT NULL,
    name            VARCHAR(200)    NOT NULL,
    billing_email   VARCHAR(255)    NULL,
    rate_card_id    CHAR(36)        NULL                   COMMENT '当前关联的费率卡',
    status          VARCHAR(20)     NOT NULL DEFAULT 'active',
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    KEY idx_accounts_rate_card (rate_card_id),
    KEY idx_accounts_status (status),

    CONSTRAINT fk_accounts_rate_card FOREIGN KEY (rate_card_id) REFERENCES rate_cards (id),
    CONSTRAINT ck_accounts_status CHECK (status IN ('active', 'suspended', 'closed'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='客户账户';


-- ----------------------------------------------------------------------------
-- 6. CREDIT_GRANTS — 信用授予记录（购买 / 赠送 / 奖励）
-- ----------------------------------------------------------------------------
CREATE TABLE credit_grants (
    id                  CHAR(36)    NOT NULL,
    account_id          CHAR(36)    NOT NULL,
    grant_type_id       CHAR(36)    NOT NULL,
    source_reference    VARCHAR(200) NULL                  COMMENT '来源单号（如支付订单号、活动编码）',
    original_amount     BIGINT      NOT NULL               COMMENT '初始授予 credits 数量',
    remaining_amount    BIGINT      NOT NULL               COMMENT '剩余可用 credits',
    cost_basis_per_unit DECIMAL(10,6) NOT NULL DEFAULT 0   COMMENT '每 credit 实际成本（用于 ASC 606 收入计算）',
    currency            CHAR(3)     NOT NULL DEFAULT 'USD',
    expires_at          TIMESTAMP   NULL,
    created_at          TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    consumption_priority TINYINT    NOT NULL DEFAULT 2        COMMENT '消费优先级：0 promotional, 1 bonus, 2 purchased',
    grant_status        VARCHAR(20) NOT NULL DEFAULT 'available' COMMENT 'available / depleted / expired',
    sort_expires_at     TIMESTAMP   NOT NULL DEFAULT '2038-01-19 03:14:07' COMMENT '排序用到期时间，NULL 统一映射为远未来',
    metadata            JSON        NULL,

    PRIMARY KEY (id),
    -- 账户额度列表：按账户和创建时间查看授予记录
    KEY idx_cg_account_created (account_id, created_at, id),
    KEY idx_cg_grant_type (grant_type_id),
    KEY idx_cg_consume_pick (account_id, grant_status, consumption_priority, sort_expires_at, id),

    CONSTRAINT fk_cg_account FOREIGN KEY (account_id) REFERENCES accounts (id),
    CONSTRAINT fk_cg_grant_type FOREIGN KEY (grant_type_id) REFERENCES grant_types (id),
    CONSTRAINT ck_credit_grants_original_amount CHECK (original_amount > 0),
    CONSTRAINT ck_credit_grants_remaining_amount CHECK (remaining_amount >= 0),
    CONSTRAINT ck_credit_grants_remaining_lte_original CHECK (remaining_amount <= original_amount),
    CONSTRAINT ck_credit_grants_cost_basis CHECK (cost_basis_per_unit >= 0),
    CONSTRAINT ck_credit_grants_consumption_priority CHECK (consumption_priority IN (0, 1, 2)),
    CONSTRAINT ck_credit_grants_status CHECK (grant_status IN ('available', 'depleted', 'expired'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='信用授予记录';


-- ----------------------------------------------------------------------------
-- 7. CREDIT_BALANCES — 账户余额快照（物化视图，避免每次 SUM）
-- ----------------------------------------------------------------------------
CREATE TABLE credit_balances (
    id                  CHAR(36)    NOT NULL,
    account_id          CHAR(36)    NOT NULL,
    total_balance       BIGINT      NOT NULL DEFAULT 0,
    purchased_balance   BIGINT      NOT NULL DEFAULT 0     COMMENT '付费 credits 余额',
    promotional_balance BIGINT      NOT NULL DEFAULT 0     COMMENT '赠送 credits 余额',
    bonus_balance       BIGINT      NOT NULL DEFAULT 0     COMMENT '奖励 credits 余额',
    updated_at          TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    -- 账户余额查询：一个账户只有一行
    UNIQUE KEY uk_cb_account (account_id),

    CONSTRAINT fk_cb_account FOREIGN KEY (account_id) REFERENCES accounts (id),
    CONSTRAINT ck_credit_balances_total_nonnegative CHECK (total_balance >= 0),
    CONSTRAINT ck_credit_balances_purchased_nonnegative CHECK (purchased_balance >= 0),
    CONSTRAINT ck_credit_balances_promotional_nonnegative CHECK (promotional_balance >= 0),
    CONSTRAINT ck_credit_balances_bonus_nonnegative CHECK (bonus_balance >= 0),
    CONSTRAINT ck_credit_balances_total_consistent CHECK (
        total_balance = purchased_balance + promotional_balance + bonus_balance
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='账户 credit 余额快照';


-- ----------------------------------------------------------------------------
-- 8. CREDIT_TRANSACTIONS — 信用交易流水（核心高频写入表）
-- ----------------------------------------------------------------------------
CREATE TABLE credit_transactions (
    id              CHAR(36)        NOT NULL,
    account_id      CHAR(36)        NOT NULL,
    grant_id        CHAR(36)        NULL                   COMMENT '扣减的 grant，充值类交易可为 NULL',
    type            VARCHAR(20)     NOT NULL,
    amount          BIGINT          NOT NULL               COMMENT '正数=增加，负数=扣减',
    revenue_impact  DECIMAL(12,4)   NOT NULL DEFAULT 0     COMMENT 'amount × cost_basis_per_unit，收入影响金额',
    idempotency_key VARCHAR(200)    NOT NULL               COMMENT '幂等键，防重复提交',
    description     VARCHAR(500)    NULL,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    -- 幂等校验（写入前先查）
    UNIQUE KEY uk_ct_idempotency (idempotency_key),
    -- 按账户查流水（分页、对账）
    KEY idx_ct_account_created (account_id, created_at),
    -- 按 grant 查消耗明细
    KEY idx_ct_grant (grant_id),
    -- 收入汇总报表：按类型 + 时间聚合
    KEY idx_ct_type_created (type, created_at),

    CONSTRAINT fk_ct_account FOREIGN KEY (account_id) REFERENCES accounts (id),
    CONSTRAINT fk_ct_grant FOREIGN KEY (grant_id) REFERENCES credit_grants (id),
    CONSTRAINT ck_credit_transactions_type CHECK (
        type IN ('purchase', 'promotional', 'bonus', 'consumption', 'refund', 'expiration', 'adjustment')
    ),
    CONSTRAINT ck_credit_transactions_amount_nonzero CHECK (amount <> 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='信用交易流水';


-- ----------------------------------------------------------------------------
-- 9. TRANSACTION_LINE_ITEMS — 交易行项目（一笔交易拆分到多个费用类别）
-- ----------------------------------------------------------------------------
CREATE TABLE transaction_line_items (
    id              CHAR(36)        NOT NULL,
    transaction_id  CHAR(36)        NOT NULL,
    fee_category_id CHAR(36)        NOT NULL,
    amount          BIGINT          NOT NULL,
    revenue_impact  DECIMAL(12,4)   NOT NULL DEFAULT 0,
    label           VARCHAR(200)    NULL,

    PRIMARY KEY (id),
    -- 按交易查行项目
    KEY idx_tli_transaction (transaction_id),
    -- 按费用分类汇总（收入报表）
    KEY idx_tli_fee_category (fee_category_id),

    CONSTRAINT fk_tli_transaction FOREIGN KEY (transaction_id) REFERENCES credit_transactions (id),
    CONSTRAINT fk_tli_fee_category FOREIGN KEY (fee_category_id) REFERENCES fee_categories (id),
    CONSTRAINT ck_transaction_line_items_amount_nonzero CHECK (amount <> 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='交易行项目明细';


-- ----------------------------------------------------------------------------
-- 10. REFUND_RECORDS — 退款记录
-- ----------------------------------------------------------------------------
CREATE TABLE refund_records (
    id              CHAR(36)        NOT NULL,
    original_txn_id CHAR(36)        NOT NULL               COMMENT '原始被退款的交易',
    refund_txn_id   CHAR(36)        NOT NULL               COMMENT '退款产生的新交易',
    reason          VARCHAR(30)     NOT NULL,
    refund_pct      DECIMAL(5,2)    NOT NULL               COMMENT '退款比例 0.00-100.00',
    include_fees    TINYINT(1)      NOT NULL DEFAULT 0     COMMENT '是否连同费用一起退',
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    -- 查某笔交易的退款历史
    KEY idx_rr_original_txn (original_txn_id),
    UNIQUE KEY uk_rr_refund_txn (refund_txn_id),

    CONSTRAINT fk_rr_original_txn FOREIGN KEY (original_txn_id) REFERENCES credit_transactions (id),
    CONSTRAINT fk_rr_refund_txn FOREIGN KEY (refund_txn_id) REFERENCES credit_transactions (id),
    CONSTRAINT ck_refund_records_reason CHECK (reason IN ('customer_request', 'service_error', 'policy', 'other')),
    CONSTRAINT ck_refund_records_pct CHECK (refund_pct >= 0.01 AND refund_pct <= 100.00),
    CONSTRAINT ck_refund_records_not_self CHECK (original_txn_id <> refund_txn_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='退款记录';


-- ============================================================================
-- 典型查询场景与索引对照
-- ============================================================================
--
-- 场景 1: 消费扣费 — 查账户的费率卡 → 定位 action 的 credit 成本
--   SELECT rci.base_credit_cost, rci.fee_credit_cost
--   FROM accounts a
--   JOIN rate_card_items rci ON rci.rate_card_id = a.rate_card_id
--   WHERE a.id = ? AND rci.action_code = ?
--   → 命中 accounts.PK + uk_rci_card_action
--
-- 场景 2: 优先级消费 — 小批量锁定账户下当前可消费的 grants
--   SELECT id, grant_type_id, remaining_amount, cost_basis_per_unit
--   FROM credit_grants
--   WHERE account_id = ?
--     AND grant_status = 'available'
--     AND sort_expires_at > NOW()
--   ORDER BY consumption_priority ASC, sort_expires_at ASC, id ASC
--   LIMIT ?
--   FOR UPDATE
--   → 命中 idx_cg_consume_pick
--
-- 场景 3: 幂等校验
--   SELECT id FROM credit_transactions WHERE idempotency_key = ?
--   → 命中 uk_ct_idempotency
--
-- 场景 4: 收入报表 — 按月汇总 revenue_impact
--   SELECT DATE_FORMAT(ct.created_at, '%Y-%m') AS month,
--          gt.code AS grant_type,
--          SUM(ct.revenue_impact) AS total_revenue
--   FROM credit_transactions ct
--   JOIN credit_grants cg ON cg.id = ct.grant_id
--   JOIN grant_types gt ON gt.id = cg.grant_type_id
--   WHERE ct.type = 'consumption'
--     AND ct.created_at BETWEEN ? AND ?
--   GROUP BY month, gt.code
--   → 命中 idx_ct_type_created + idx_cg_grant_type
--
-- 场景 5: 账户 grant 列表
--   SELECT * FROM credit_grants
--   WHERE account_id = ? ORDER BY created_at ASC, id ASC
--   → 命中 idx_cg_account_created
--
-- 场景 6: 账户交易流水分页
--   SELECT * FROM credit_transactions
--   WHERE account_id = ? ORDER BY created_at DESC LIMIT 20 OFFSET 0
--   → 命中 idx_ct_account_created（降序扫描）
