# Credits

企业级额度管理系统 — 基于 ASC 606 收入确认标准，支持额度授予、FIFO 消耗、退款和递延收入核算。

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | Java 21 · Spring Boot 4.0.5 · MyBatis-Plus 3.5.15 |
| 数据库 | H2 内存数据库（MySQL 兼容模式），开发环境自动初始化 |
| 前端 | React 19 · TypeScript · Vite 8 · TailwindCSS v4 |
| 运行时 | Bun（前端） · JDK 21（后端） |

## 项目结构

```
credits/
├── src/main/java/com/credits/
│   ├── config/          # 跨域、Swagger 等配置
│   ├── controller/      # REST API 控制器
│   ├── mapper/          # MyBatis-Plus 数据访问层
│   ├── model/
│   │   ├── dto/         # 请求/响应 DTO
│   │   └── entity/      # 数据库实体
│   └── service/         # 业务逻辑层
│       └── impl/
├── src/main/resources/
│   ├── schema-h2.sql    # H2 建表（含 CHECK 约束）
│   ├── schema.sql       # MySQL 生产建表
│   └── data.sql         # 开发种子数据
├── src/test/            # 集成测试
├── frontend/
│   └── src/
│       ├── api/         # Axios 客户端
│       ├── components/  # 通用组件（Modal, DataTable, StatusBadge...）
│       ├── hooks/       # useApi 等自定义 Hook
│       ├── pages/       # 页面（accounts, grant-types, fee-categories, rate-cards）
│       └── types/       # TypeScript 类型定义
└── pom.xml
```

## 数据模型

```
grant_types          费率类型字典（purchased / promotional / bonus）
fee_categories       费用类目（收入类 / 非收入 / 可退款）
rate_cards           费率卡主表
rate_card_items      费率卡明细（action → credit cost 映射）
accounts             客户账户（active / suspended / closed）
credit_grants        额度授予记录（FIFO 消耗，优先级排序）
credit_balances      账户余额快照（purchased + promotional + bonus = total）
credit_transactions  交易流水（幂等键防重复）
transaction_line_items  交易行项目明细
refund_records       退款记录（防超额退款）
```

## 快速开始

### 前置要求

- JDK 21+
- [Bun](https://bun.sh)（前端运行时）
- Maven 3.9+

### 启动后端

```bash
mvn spring-boot:run
```

后端启动在 `http://localhost:8080`，H2 控制台在 `/h2-console`。

### 启动前端

```bash
cd frontend
bun install
bun run dev
```

前端启动在 `http://localhost:5173`，API 请求自动代理到后端 8080 端口。

### 构建前端

```bash
cd frontend
bun run build
```

## 核心业务流程

### 额度消耗路径

1. 验证账户状态为 `active`
2. 查找关联费率卡，匹配 action_code 获取单价
3. 按优先级分批锁定可用 grants（promotional → bonus → purchased，同级按到期时间 FIFO）
4. 逐笔扣减并记录交易流水，计算收入影响
5. 更新余额快照（分桶：purchased / promotional / bonus）

### 账户生命周期

| 状态 | 消耗 | 充值 | API | 说明 |
|------|------|------|-----|------|
| Active 正常 | ✓ | ✓ | ✓ | 全功能可用 |
| Suspended 冻结 | ✗ | ✓ | ✗ | 临时冻结，余额保留，可充值 |
| Closed 注销 | ✗ | ✗ | ✗ | 永久终止，余额冻结 |

### 收入确认（ASC 606）

- 1 Credit = 1 USD
- 购买型 grant 的 `cost_basis_per_unit = 1.00`，消耗时确认收入
- 推广/奖励型 grant 的 `cost_basis_per_unit = 0`，无收入影响
- 递延收入 = 有效 grants 的 `remaining_amount × cost_basis_per_unit` 之和

## API 概览

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/accounts` | 账户列表（分页、筛选、排序） |
| POST | `/api/accounts` | 创建账户 |
| GET | `/api/accounts/{id}` | 账户详情 |
| PUT | `/api/accounts/{id}` | 更新账户（含状态变更） |
| GET | `/api/accounts/{id}/balance` | 账户余额 |
| POST | `/api/credits/grant` | 授予额度 |
| POST | `/api/credits/consume` | 消耗额度 |
| POST | `/api/credits/refund` | 退款 |
| GET | `/api/credits/grants` | 授予记录 |
| GET | `/api/credits/transactions` | 交易流水 |
| GET/POST | `/api/grant-types` | 授予类型管理 |
| GET/POST | `/api/fee-categories` | 费用类目管理 |
| GET/POST | `/api/rate-cards` | 费率卡管理 |
| GET | `/api/dashboard/stats` | 仪表盘统计 |

## License

Private
