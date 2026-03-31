-- ============================================================================
-- Seed Data — 初始化字典 + 演示数据
-- ============================================================================

-- 1. Grant Types
INSERT INTO grant_types (id, name, code, is_revenue_bearing, accounting_treatment, default_expiry_days) VALUES
('gt-001', 'Purchased Credits',  'purchased',   TRUE,  'ASC 606: Recognize revenue upon consumption based on cost_basis_per_unit', 365),
('gt-002', 'Promotional Credits','promotional', FALSE, 'No revenue recognition — marketing expense at grant time', 90),
('gt-003', 'Bonus Credits',      'bonus',       FALSE, 'No revenue recognition — customer incentive', 180);

-- 2. Fee Categories
INSERT INTO fee_categories (id, code, name, is_revenue, is_refundable, gl_account_code) VALUES
('fc-001', 'platform_fee',   'Platform Fee',          TRUE,  FALSE, '4010-001'),
('fc-002', 'processing_fee', 'Processing Fee',        TRUE,  TRUE,  '4010-002'),
('fc-003', 'overage_fee',    'Overage Fee',           TRUE,  FALSE, '4010-003'),
('fc-004', 'support_fee',    'Premium Support Fee',   TRUE,  TRUE,  '4010-004');

-- 3. Rate Cards
INSERT INTO rate_cards (id, name, currency, status, effective_from, effective_to) VALUES
('rc-001', 'Standard Plan 2025',   'USD', 'active',   '2025-01-01 00:00:00', NULL),
('rc-002', 'Enterprise Plan 2025', 'USD', 'active',   '2025-01-01 00:00:00', NULL),
('rc-003', 'Startup Plan 2025',    'USD', 'draft',    '2025-07-01 00:00:00', NULL);

-- 4. Rate Card Items — Standard Plan
INSERT INTO rate_card_items (id, rate_card_id, action_code, action_name, unit_of_measure, base_credit_cost, fee_credit_cost, fee_category_id) VALUES
('rci-001', 'rc-001', 'api_call',     'API Call',               'request',    1,  0, NULL),
('rci-002', 'rc-001', 'embedding',    'Text Embedding',         '1k_tokens',  5,  1, 'fc-001'),
('rci-003', 'rc-001', 'completion',   'Chat Completion',        '1k_tokens', 10,  2, 'fc-001'),
('rci-004', 'rc-001', 'image_gen',    'Image Generation',       'request',   20,  5, 'fc-002'),
('rci-005', 'rc-001', 'storage',      'File Storage',           'gb_month',   3,  0, NULL);

-- Rate Card Items — Enterprise Plan (lower rates)
INSERT INTO rate_card_items (id, rate_card_id, action_code, action_name, unit_of_measure, base_credit_cost, fee_credit_cost, fee_category_id) VALUES
('rci-006', 'rc-002', 'api_call',     'API Call',               'request',    1,  0, NULL),
('rci-007', 'rc-002', 'embedding',    'Text Embedding',         '1k_tokens',  3,  0, NULL),
('rci-008', 'rc-002', 'completion',   'Chat Completion',        '1k_tokens',  7,  1, 'fc-001'),
('rci-009', 'rc-002', 'image_gen',    'Image Generation',       'request',   15,  3, 'fc-002'),
('rci-010', 'rc-002', 'storage',      'File Storage',           'gb_month',   2,  0, NULL),
('rci-011', 'rc-002', 'fine_tuning',  'Model Fine-tuning',      '1k_tokens', 50, 10, 'fc-003');

-- 5. Accounts
INSERT INTO accounts (id, name, billing_email, rate_card_id, status, created_at) VALUES
('acc-001', 'Acme Corp',        'billing@acme.com',       'rc-001', 'active',    '2025-01-15 10:00:00'),
('acc-002', 'Globex Inc',       'finance@globex.io',      'rc-002', 'active',    '2025-02-01 09:30:00'),
('acc-003', 'Initech LLC',      'ap@initech.com',         'rc-001', 'active',    '2025-03-10 14:00:00'),
('acc-004', 'Umbrella Corp',    'billing@umbrella.co',    'rc-002', 'suspended', '2025-01-20 11:00:00'),
('acc-005', 'Stark Industries', 'credits@stark.tech',     'rc-001', 'active',    '2025-04-01 08:00:00');

-- 6. Credit Balances (one per account)
INSERT INTO credit_balances (id, account_id, total_balance, purchased_balance, promotional_balance, bonus_balance) VALUES
('cb-001', 'acc-001', 6500,  5000, 0, 1500),
('cb-002', 'acc-002', 45000, 40000, 3000, 2000),
('cb-003', 'acc-003', 3000,  2000, 1000, 0),
('cb-004', 'acc-004', 0,     0,    0,    0),
('cb-005', 'acc-005', 12000, 10000, 1000, 1000);

-- 7. Credit Grants (1 USD = 1 Credit — purchased cost_basis_per_unit = 1.00)
--    Grants with remaining balance expire in the future; depleted/expired grants in the past
INSERT INTO credit_grants (id, account_id, grant_type_id, source_reference, original_amount, remaining_amount, cost_basis_per_unit, currency, expires_at, created_at) VALUES
('cg-001', 'acc-001', 'gt-001', 'ORD-2025-001', 10000, 5000,  1.000000, 'USD', '2027-01-15 10:00:00', '2025-01-15 10:00:00'),
('cg-002', 'acc-001', 'gt-002', 'PROMO-NEW',     2000, 2000,  0.000000, 'USD', '2025-04-15 10:00:00', '2025-01-15 10:05:00'),
('cg-003', 'acc-001', 'gt-003', 'REFERRAL-001',  1500, 1500,  0.000000, 'USD', '2026-07-15 10:00:00', '2025-01-15 10:10:00'),
('cg-004', 'acc-002', 'gt-001', 'ORD-2025-010', 50000, 40000, 1.000000, 'USD', '2027-02-01 09:30:00', '2025-02-01 09:30:00'),
('cg-005', 'acc-002', 'gt-002', 'PROMO-ENT',     3000, 3000,  0.000000, 'USD', '2026-11-01 09:30:00', '2025-02-01 09:35:00'),
('cg-006', 'acc-002', 'gt-003', 'MILESTONE-Q1',  2000, 2000,  0.000000, 'USD', '2026-08-01 09:30:00', '2025-02-01 09:40:00'),
('cg-007', 'acc-003', 'gt-001', 'ORD-2025-020',  5000, 2000,  1.000000, 'USD', '2027-03-10 14:00:00', '2025-03-10 14:00:00'),
('cg-008', 'acc-003', 'gt-002', 'PROMO-SPRING',  1000, 1000,  0.000000, 'USD', '2026-09-10 14:00:00', '2025-03-10 14:05:00'),
('cg-009', 'acc-005', 'gt-001', 'ORD-2025-030', 12000, 10000, 1.000000, 'USD', '2027-04-01 08:00:00', '2025-04-01 08:00:00'),
('cg-010', 'acc-005', 'gt-002', 'PROMO-LAUNCH',  1000, 1000,  0.000000, 'USD', '2026-10-01 08:00:00', '2025-04-01 08:05:00'),
('cg-011', 'acc-005', 'gt-003', 'BONUS-BETA',    1000, 1000,  0.000000, 'USD', '2026-10-01 08:00:00', '2025-04-01 08:10:00');

UPDATE credit_grants
SET consumption_priority = CASE grant_type_id
    WHEN 'gt-002' THEN 0
    WHEN 'gt-003' THEN 1
    ELSE 2
END;

UPDATE credit_grants
SET sort_expires_at = COALESCE(expires_at, '2038-01-19 03:14:07');

UPDATE credit_grants
SET grant_status = CASE
    WHEN remaining_amount <= 0 THEN 'depleted'
    WHEN sort_expires_at <= CURRENT_TIMESTAMP THEN 'expired'
    ELSE 'available'
END;

-- 8. Credit Transactions (1 USD = 1 Credit — revenue_impact = |amount| × cost_basis_per_unit)
INSERT INTO credit_transactions (id, account_id, grant_id, type, amount, revenue_impact, idempotency_key, description, created_at) VALUES
-- acc-001: purchased + promotional + bonus
('ct-001', 'acc-001', 'cg-001', 'purchase',     10000, 10000.0000, 'purchase-acc001-001', 'Initial credit purchase',        '2025-01-15 10:00:00'),
('ct-002', 'acc-001', 'cg-002', 'promotional',   2000,     0.0000, 'grant-cg-002',        'New user promotional credits',   '2025-01-15 10:05:00'),
('ct-003', 'acc-001', 'cg-003', 'bonus',          1500,     0.0000, 'grant-cg-003',        'Referral bonus credits',         '2025-01-15 10:10:00'),
('ct-004', 'acc-001', 'cg-001', 'consumption',  -2000,  2000.0000, 'consume-acc001-001',  '200 Chat Completions',           '2025-01-20 15:30:00'),
('ct-005', 'acc-001', 'cg-001', 'consumption',  -1500,  1500.0000, 'consume-acc001-002',  '150 Image Generations',          '2025-02-05 11:00:00'),
('ct-006', 'acc-001', 'cg-001', 'consumption',   -500,   500.0000, 'consume-acc001-003',  '100 Embeddings (500 1k tokens)', '2025-02-20 09:15:00'),
('ct-007', 'acc-001', 'cg-001', 'consumption',  -1000,  1000.0000, 'consume-acc001-004',  '100 Chat Completions',           '2025-03-01 16:45:00'),
-- acc-002: purchased + promotional + bonus
('ct-008', 'acc-002', 'cg-004', 'purchase',     50000, 50000.0000, 'purchase-acc002-001', 'Enterprise credit purchase',     '2025-02-01 09:30:00'),
('ct-009', 'acc-002', 'cg-005', 'promotional',   3000,     0.0000, 'grant-cg-005',        'Enterprise promotional credits', '2025-02-01 09:35:00'),
('ct-010', 'acc-002', 'cg-006', 'bonus',          2000,     0.0000, 'grant-cg-006',        'Q1 milestone bonus',             '2025-02-01 09:40:00'),
('ct-011', 'acc-002', 'cg-004', 'consumption',  -5000,  5000.0000, 'consume-acc002-001',  'Batch fine-tuning job',          '2025-02-15 13:00:00'),
('ct-012', 'acc-002', 'cg-004', 'consumption',  -3000,  3000.0000, 'consume-acc002-002',  'API calls + completions',        '2025-03-01 10:00:00'),
('ct-013', 'acc-002', 'cg-004', 'consumption',  -2000,  2000.0000, 'consume-acc002-003',  'Image generation batch',         '2025-03-15 14:30:00'),
-- acc-003: purchased + promotional
('ct-014', 'acc-003', 'cg-007', 'purchase',      5000,  5000.0000, 'purchase-acc003-001', 'Credit purchase',                '2025-03-10 14:00:00'),
('ct-015', 'acc-003', 'cg-008', 'promotional',   1000,     0.0000, 'grant-cg-008',        'Spring promotional credits',     '2025-03-10 14:05:00'),
('ct-016', 'acc-003', 'cg-007', 'consumption',  -3000,  3000.0000, 'consume-acc003-001',  'Mixed API usage',                '2025-03-20 12:00:00'),
-- acc-005: purchased + promotional + bonus
('ct-017', 'acc-005', 'cg-009', 'purchase',     12000, 12000.0000, 'purchase-acc005-001', 'Credit purchase',                '2025-04-01 08:00:00'),
('ct-018', 'acc-005', 'cg-010', 'promotional',   1000,     0.0000, 'grant-cg-010',        'Launch promotional credits',     '2025-04-01 08:05:00'),
('ct-019', 'acc-005', 'cg-011', 'bonus',          1000,     0.0000, 'grant-cg-011',        'Beta tester bonus',              '2025-04-01 08:10:00'),
('ct-020', 'acc-005', 'cg-009', 'consumption',  -2000,  2000.0000, 'consume-acc005-001',  'API calls',                      '2025-04-10 11:00:00');
