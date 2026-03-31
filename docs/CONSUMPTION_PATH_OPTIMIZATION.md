# Credits 消费路径优化方案

## 1. 目标

本文档用于沉淀下一阶段的消费扣 Credits 优化方案，目标是把当前实现从：

- 锁全账户所有活跃 grants

演进到：

- 按可消费优先级分批获取
- 尽量只锁本次真正会扣减的 grants
- 让热路径尽量走单表、有序、可索引的查询

本文档是设计方案，不代表当前代码已经完成改造。

## 2. 当前实现摘要

当前消费主路径：

1. 根据账户绑定的 `rate_card_id` 查动作成本
2. 从 `credit_grants` 查询该账户所有 `remaining_amount > 0` 且未过期的 grant
3. 通过 `JOIN grant_types` 和 `CASE` 排出消费顺序
4. 对整批结果执行 `FOR UPDATE`
5. Java 侧循环扣减，扣够后退出
6. 写 `credit_transactions`
7. 更新 `credit_balances`

当前关键 SQL 在 `CreditGrantMapper.selectAvailableGrantsForUpdate`。

## 3. 当前瓶颈

### 3.1 锁范围过大

当前 SQL 会把某个账户下所有可用 grant 一次性锁住，而不是只锁本次真正需要扣减的那几条。

后果：

- grant 数量越多，单次消费越慢
- 同一账户并发消费时锁冲突明显
- 很容易把“账户粒度的串行化”放大成“账户所有可用额度池全部串行化”

### 3.2 热路径依赖跨表排序

当前排序依赖：

- `grant_types.is_revenue_bearing`
- `CASE gt.code WHEN ...`
- `credit_grants.expires_at`

这意味着消费热路径不能靠 `credit_grants` 单表索引完整支持排序。

后果：

- 排序更容易退化为 filesort
- `FOR UPDATE` 配合排序时更容易放大锁扫描成本

### 3.3 可用性判断依赖动态条件

当前“可消费”由以下条件共同决定：

- `remaining_amount > 0`
- `expires_at IS NULL OR expires_at > NOW()`

这对业务是正确的，但对索引不友好，尤其是在 grant 历史增长后。

## 4. 优化目标

第一阶段优化目标：

- 消费热路径不再依赖 `JOIN grant_types` 排序
- 单次消费只锁一小批 grant，而不是锁全量活跃 grant
- grant 数量增大后，单次消费的性能退化保持平缓
- 保持现有业务规则不变：
  - promotional 优先
  - bonus 次之
  - purchased 最后
  - 即将过期的先消耗

第二阶段优化目标：

- 在单账户高并发消费时进一步降低锁冲突
- 为后续精细化账务拆分保留演进空间

## 5. 推荐方案

## 5.1 新增面向消费热路径的字段

建议在 `credit_grants` 增加以下字段：

- `consumption_priority TINYINT NOT NULL`
- `grant_status VARCHAR(20) NOT NULL`
- `sort_expires_at TIMESTAMP NOT NULL`

字段含义：

- `consumption_priority`
  - 0 = promotional
  - 1 = bonus
  - 2 = purchased
  - 在授予时写入，不在消费时临时计算

- `grant_status`
  - `available`
  - `depleted`
  - `expired`
  - 用于把“剩余为 0”从范围判断转成等值判断

- `sort_expires_at`
  - 推荐语义：`COALESCE(expires_at, '2038-01-19 03:14:07')`
  - 目的：让永不过期的 grant 在排序时自然排到最后

## 5.2 推荐索引

建议增加消费专用索引：

```sql
KEY idx_cg_consume_pick (
  account_id,
  grant_status,
  consumption_priority,
  sort_expires_at,
  id
)
```

设计原因：

- `account_id`：账户粒度过滤
- `grant_status`：只拿可消费 grant
- `consumption_priority`：支持优先级排序
- `sort_expires_at`：支持过期顺序排序
- `id`：稳定排序并辅助最小批次扫描

## 5.3 新消费 SQL 形态

推荐把当前“全量拉取 + 全量加锁”改成“小批量获取 + 小批量加锁”。

基础 SQL 形态：

```sql
SELECT id, remaining_amount, cost_basis_per_unit, grant_type_id
FROM credit_grants
WHERE account_id = ?
  AND grant_status = 'available'
  AND sort_expires_at > NOW()
ORDER BY consumption_priority ASC, sort_expires_at ASC, id ASC
LIMIT ?
FOR UPDATE
```

说明：

- `LIMIT` 推荐从 `8` 或 `16` 这样的批量开始
- 当前代码已经先落地了 `LIMIT + FOR UPDATE` 的低风险版本
- `SKIP LOCKED` 适用于 MySQL 8 的后续并发优化路径

## 5.4 新消费流程

推荐流程：

1. 计算总消费成本
2. 初始化 `remainingToDeduct`
3. 执行“小批量候选 grant 查询”
4. 只锁住本批 grant
5. 按顺序逐条扣减
6. 如果 `remainingToDeduct` 仍大于 0，则继续拉下一批
7. 扣完后写交易流水
8. 更新余额快照
9. 对被扣空的 grant，把 `grant_status` 更新为 `depleted`

与当前实现最大的差异：

- 当前是“一次锁全量，再只用其中一部分”
- 新方案是“按需分批锁定，只锁本次大概率会用到的集合”

## 6. DDL 变更建议

推荐新增字段：

```sql
ALTER TABLE credit_grants
  ADD COLUMN consumption_priority TINYINT NOT NULL DEFAULT 2,
  ADD COLUMN grant_status VARCHAR(20) NOT NULL DEFAULT 'available',
  ADD COLUMN sort_expires_at TIMESTAMP NOT NULL DEFAULT '2038-01-19 03:14:07';
```

推荐增加约束：

```sql
ALTER TABLE credit_grants
  ADD CONSTRAINT ck_credit_grants_status
    CHECK (grant_status IN ('available', 'depleted', 'expired'));
```

推荐增加索引：

```sql
CREATE INDEX idx_cg_consume_pick
ON credit_grants (
  account_id,
  grant_status,
  consumption_priority,
  sort_expires_at,
  id
);
```

## 7. 数据回填方案

历史数据回填建议分 3 步：

1. 回填 `consumption_priority`

```sql
UPDATE credit_grants cg
JOIN grant_types gt ON gt.id = cg.grant_type_id
SET cg.consumption_priority =
  CASE gt.code
    WHEN 'promotional' THEN 0
    WHEN 'bonus' THEN 1
    ELSE 2
  END;
```

2. 回填 `grant_status`

```sql
UPDATE credit_grants
SET grant_status =
  CASE
    WHEN remaining_amount <= 0 THEN 'depleted'
    WHEN expires_at IS NOT NULL AND expires_at <= NOW() THEN 'expired'
    ELSE 'available'
  END;
```

3. 回填 `sort_expires_at`

```sql
UPDATE credit_grants
SET sort_expires_at = COALESCE(expires_at, '2038-01-19 03:14:07');
```

## 8. 代码改造点

需要同步修改的代码点：

- `grantCredits`
  - 新增 grant 时写入 `consumption_priority`
  - 初始化 `grant_status`
  - 初始化 `sort_expires_at`

- `consumeCredits`
  - 替换当前 `selectAvailableGrantsForUpdate`
  - 改为循环拉取小批量候选 grant
  - grant 扣空时同步更新 `grant_status`

- 过期处理
  - 当前系统还没有专门的 grant 过期任务
  - 如果后续引入定时任务，需要同时维护 `grant_status = 'expired'`

## 9. 验证指标

优化完成后，建议至少观察以下指标：

- 单账户消费 P95 / P99 延迟
- 单账户并发消费成功率
- `credit_grants` 热查询平均扫描行数
- 锁等待时间
- 死锁次数
- 单次消费平均锁定 grant 数量

理想结果：

- grant 数量增长时，单次消费的扫描行数不再接近“全部活跃 grants”
- 同一账户下的并发消费锁等待明显下降

## 10. 回归测试建议

必须补的测试：

- promotional / bonus / purchased 的优先级顺序测试
- 永不过期 grant 必须排在有过期时间 grant 之后
- grant 扣空后状态切换测试
- 批量拉取多轮扣减测试
- 并发消费测试
- 幂等消费测试

## 11. 风险与边界

### 11.1 `SKIP LOCKED` 不是第一步必选项

如果团队更偏向保守改造，可以先：

- 增字段
- 增索引
- 把查询改成 `LIMIT`
- 暂不启用 `SKIP LOCKED`

这样先把“锁全量”缩成“锁小批量”，风险最低。

### 11.2 `credit_balances` 仍是热点行

即使 grant 锁范围缩小了，`credit_balances` 依然是每账户一行的热点更新点。

这意味着：

- grant 级锁冲突会下降
- 但账户余额快照更新仍然会串行化

如果未来出现“同一超大客户高并发消费”的极端场景，再评估是否把 `credit_balances` 改为异步投影。

## 12. 推荐落地顺序

建议按以下顺序实施：

1. DDL 增字段与索引
2. 回填历史数据
3. 改授予逻辑，确保新数据写入完整
4. 改消费查询为“小批量拉取”
5. 补回归测试
6. 观察锁等待和扫描行数
7. 再决定是否引入 `SKIP LOCKED`

## 13. 一句话总结

这次优化的核心，不是“把扣减逻辑写得更复杂”，而是把消费热路径从“跨表排序 + 全量加锁”改成“单表排序 + 小批量锁定”，让数据库真正只为本次会被消费的 grant 集合付出代价。
