# Changelog - 2026-03-31

## 基线

- 基线提交：`bd0ebcb10c6f84149228c3a937a4981ba7ba9b10`
- 提交时间：`2026-03-31 20:50:46 +0800`
- 提交说明：`rm jsx and redesign customer list`

本文档记录的是自上述提交到当前工作区之间的所有变更，包括已修改文件、新增测试以及新增文档。

## 变更总览

本轮变更主要集中在 5 个方面：

1. 修复 Credits 核心流程中的 3 个高优先级业务问题
2. 统一代码、DTO、H2、MySQL 之间的数据契约
3. 落地消费路径第一阶段性能优化
4. 收敛与消费路径相关的统计查询和索引设计
5. 补充集成测试与数据库/架构文档

## 1. 业务修复

### 1.1 停用账户不可再消耗 Credits

调整内容：

- `consumeCredits` 新增账户状态校验
- 只有 `active` 账户允许执行消费

效果：

- 避免前端“停用后不可用”和后端“仍可扣费”之间的语义不一致

涉及文件：

- `src/main/java/com/credits/service/impl/CreditServiceImpl.java`

### 1.2 退款不再允许累计超过 100%

调整内容：

- 新增 `RefundRecordMapper.sumRefundedAmountByOriginalTxnId`
- 退款前先计算原交易已退款金额
- 基于原交易金额和累计已退款金额判断剩余可退额度

效果：

- 防止同一笔消费被多次退款到超过原值

涉及文件：

- `src/main/java/com/credits/mapper/RefundRecordMapper.java`
- `src/main/java/com/credits/service/impl/CreditServiceImpl.java`

### 1.3 退款回补到正确的余额桶

调整内容：

- 退款时不再一律回补到 `purchased_balance`
- 改为依据原始 grant 类型，分别回补 `purchased/promotional/bonus`

效果：

- 修复赠送额度、奖励额度退款后余额结构被污染的问题

涉及文件：

- `src/main/java/com/credits/service/impl/CreditServiceImpl.java`

## 2. 数据契约与 DDL 对齐

### 2.1 统一接口层校验

调整内容：

- `AccountUpdateRequest` 增加邮箱与状态校验
- `RefundRequest.reason` 改为受控取值校验
- `StatusChangeRequest.status` 改为受控取值校验
- `AccountController.updateAccount` 增加 `@Valid`

效果：

- 避免请求先通过应用层，再被数据库约束拒绝

涉及文件：

- `src/main/java/com/credits/controller/AccountController.java`
- `src/main/java/com/credits/model/dto/AccountUpdateRequest.java`
- `src/main/java/com/credits/model/dto/RefundRequest.java`
- `src/main/java/com/credits/model/dto/StatusChangeRequest.java`

### 2.2 统一 MySQL / H2 数据契约

调整内容：

- `schema.sql` 与 `schema-h2.sql` 统一采用受控取值设计
- `credit_transactions.type` 明确纳入 `promotional`、`bonus`
- `refund_records.reason` 固定为：
  - `customer_request`
  - `service_error`
  - `policy`
  - `other`
- 补充金额、余额、一致性相关 `CHECK`

效果：

- 避免 H2 和 MySQL 规则不一致导致“本地通过、上线失败”

涉及文件：

- `src/main/resources/schema.sql`
- `src/main/resources/schema-h2.sql`

## 3. `credit_grants` 模型增强

### 3.1 新增消费热路径字段

为 `credit_grants` 新增以下字段：

- `consumption_priority`
- `grant_status`
- `sort_expires_at`

用途：

- 把消费优先级固化到单表字段
- 把可用性判断从部分动态条件转成受控状态
- 把永不过期 grant 统一映射到可排序的远未来时间

涉及文件：

- `src/main/java/com/credits/model/entity/CreditGrant.java`
- `src/main/resources/schema.sql`
- `src/main/resources/schema-h2.sql`
- `src/main/resources/data.sql`

### 3.2 初始化与回填逻辑补齐

调整内容：

- `grantCredits` 创建 grant 时写入：
  - `consumption_priority`
  - `grant_status`
  - `sort_expires_at`
- `data.sql` 对演示数据回填这 3 个字段

效果：

- 新老数据都能使用同一套消费排序与统计语义

涉及文件：

- `src/main/java/com/credits/service/impl/CreditServiceImpl.java`
- `src/main/resources/data.sql`

## 4. 消费路径第一阶段优化

### 4.1 从“锁全量”改成“小批量加锁”

调整内容：

- 旧思路：一次性锁住账户下全部活跃 grant
- 新思路：按优先级和过期顺序，小批量 `LIMIT + FOR UPDATE` 读取 grant

当前核心行为：

- 按 `account_id + grant_status + consumption_priority + sort_expires_at + id` 顺序选取
- 每轮最多取固定批量
- 扣减完本批后，如仍不足，再继续拉下一批

效果：

- 缩小锁范围
- 降低 grant 数量增长时的退化速度
- 为后续 `SKIP LOCKED` 做准备

涉及文件：

- `src/main/java/com/credits/mapper/CreditGrantMapper.java`
- `src/main/java/com/credits/service/impl/CreditServiceImpl.java`
- `src/main/resources/schema.sql`
- `src/main/resources/schema-h2.sql`

### 4.2 热路径 SQL 瘦身

调整内容：

- 消费挑选 grant 时只读取必要列
- 新增 `updateRemainingAmountAndStatus`，只更新：
  - `remaining_amount`
  - `grant_status`
- grant 列表查询改为显式走 `account_id + created_at + id`

效果：

- 避免热路径上的整行读取和整行回写
- 让 SQL 与索引设计更一致

涉及文件：

- `src/main/java/com/credits/mapper/CreditGrantMapper.java`
- `src/main/java/com/credits/service/impl/CreditServiceImpl.java`

## 5. 统计查询与索引收敛

### 5.1 统计查询切换到新语义

调整内容：

- `GrantTypeMapper.selectGrantCountsByType`
- `DashboardMapper.sumDeferredRevenue`

两者都从旧条件：

- `remaining_amount > 0`
- `expires_at IS NULL OR expires_at > NOW()`

切换到新条件：

- `grant_status = 'available'`
- `sort_expires_at > NOW()/CURRENT_TIMESTAMP`

效果：

- 统计口径与消费热路径一致
- 不再依赖旧字段组合语义

涉及文件：

- `src/main/java/com/credits/mapper/GrantTypeMapper.java`
- `src/main/java/com/credits/mapper/DashboardMapper.java`

### 5.2 索引调整

调整内容：

- 新增消费热路径索引：`idx_cg_consume_pick`
- 新增账户 grant 列表索引：`idx_cg_account_created`
- 收敛掉旧消费路径注释与访问路径说明

效果：

- schema 注释、索引设计、实际 SQL 三者对齐

涉及文件：

- `src/main/resources/schema.sql`
- `src/main/resources/schema-h2.sql`

## 6. 自动化测试补充

新增 `CreditServiceImplTest`，覆盖以下场景：

1. 停用账户不可消费
2. 退款按原余额桶回补
3. 超额退款被拦截
4. 授予时写入优化字段
5. 小批量 grant 选择顺序正确
6. 跨多批次消费后 grant 正确扣空
7. 过期 grant 即使状态未刷新，也会被消费查询跳过
8. 递延收入统计使用新活跃语义
9. 授予类型活跃数统计使用新活跃语义

涉及文件：

- `src/test/java/com/credits/service/CreditServiceImplTest.java`

验证结果：

- 在本轮代码变更过程中，已执行 `mvn test -q`
- 测试通过

## 7. 文档新增与更新

### 7.1 新增架构文档

新增/更新内容：

- 项目整体架构
- 目录结构
- 分层职责
- 核心业务流程
- 主要风险与边界

文件：

- `docs/ARCHITECTURE.md`

### 7.2 新增消费路径优化文档

新增/更新内容：

- 消费路径瓶颈分析
- phase 1/phase 2 优化方向
- MySQL 8.0 兼容的推荐 SQL
- 后续 `SKIP LOCKED` 方向

文件：

- `docs/CONSUMPTION_PATH_OPTIMIZATION.md`

### 7.3 新增数据库说明文档

新增内容：

- ER 模型
- 表级职责
- 关键字段语义
- 关键索引设计
- MySQL 8.0 关键路径 SQL

文件：

- `docs/DATABASE.md`

### 7.4 新增 follow-up 待办

整理了当前仍需继续推进的事项，包括：

- 费用拆账与费用级退款
- grant 过期状态维护
- 消费并发优化第二阶段
- 热路径中的 `grantType` 查询优化
- 测试补强
- SPA fallback API 边界修正

文件：

- `todo-2026-0401.md`

## 8. 当前仍未完成的 follow-up

当前代码已经完成核心修复和消费路径第一阶段优化，但以下事项仍待推进：

1. `transaction_line_items` 还未在主流程里真正写入
2. `includeFees` 还未形成费用级退款逻辑
3. 未见独立的 grant 过期状态刷新任务
4. 并发消费第二阶段优化尚未开始
5. `WebConfig` 的 SPA fallback 仍未显式排除 `/api/**`

## 9. 受影响文件范围

### 已修改的跟踪文件

- `src/main/java/com/credits/controller/AccountController.java`
- `src/main/java/com/credits/mapper/CreditGrantMapper.java`
- `src/main/java/com/credits/mapper/DashboardMapper.java`
- `src/main/java/com/credits/mapper/GrantTypeMapper.java`
- `src/main/java/com/credits/mapper/RefundRecordMapper.java`
- `src/main/java/com/credits/model/dto/AccountUpdateRequest.java`
- `src/main/java/com/credits/model/dto/RefundRequest.java`
- `src/main/java/com/credits/model/dto/StatusChangeRequest.java`
- `src/main/java/com/credits/model/entity/CreditGrant.java`
- `src/main/java/com/credits/service/impl/CreditServiceImpl.java`
- `src/main/resources/data.sql`
- `src/main/resources/schema-h2.sql`
- `src/main/resources/schema.sql`

### 新增文件

- `src/test/java/com/credits/service/CreditServiceImplTest.java`
- `docs/ARCHITECTURE.md`
- `docs/CONSUMPTION_PATH_OPTIMIZATION.md`
- `docs/DATABASE.md`
- `todo-2026-0401.md`

## 10. 一句话总结

从上次提交到现在，这一轮变更把 Credits 核心链路从“能跑的原型”往“规则更严谨、数据契约更一致、消费热路径更可优化、文档更完整”的方向推进了一大步。
