# Credits Admin Frontend — Implementation Plan

## Context
Credits 系统目前只有后端 API，需要一个管理后台来可视化管理客户 Credits、授予类型、费用分类、费率卡。前端直接放在当前项目 `frontend/` 目录下，使用 React + TailwindCSS + Vite。

---

## Phase 1: 补全后端 CRUD API

现有 API 缺少管理后台需要的增删改接口。

### 1A. Grant Types CRUD — 新建 `/api/v1/grant-types`
- **新文件**: `GrantTypeController.java`, `GrantTypeService.java`, `GrantTypeServiceImpl.java`, `GrantTypeRequest.java`
- 端点: GET `/` (list), GET `/{id}`, POST `/`, PUT `/{id}`, DELETE `/{id}`
- 复用已有 `GrantTypeMapper` (BaseMapper 自带 CRUD)

### 1B. Fee Categories CRUD — 新建 `/api/v1/fee-categories`
- **新文件**: `FeeCategoryController.java`, `FeeCategoryService.java`, `FeeCategoryServiceImpl.java`, `FeeCategoryRequest.java`
- 同上模式

### 1C. Accounts 扩展
- **修改**: `AccountController.java`, `AccountService.java`, `AccountServiceImpl.java`
- 新增: GET `/api/v1/accounts` (分页列表, ?status= 筛选), PUT `/api/v1/accounts/{id}`
- **新文件**: `AccountUpdateRequest.java`
- 不做物理删除，通过 status=closed 实现

### 1D. Rate Cards 扩展
- **修改**: `RateCardController.java`, `RateCardService.java`, `RateCardServiceImpl.java`
- 新增: PUT `/{id}`, PUT `/{id}/status`, POST `/{id}/items`, PUT `/{id}/items/{itemId}`, DELETE `/{id}/items/{itemId}`
- **新文件**: `RateCardUpdateRequest.java`, `RateCardItemRequest.java`
- GET `/` 增加可选 `?status=` 筛选

### 1E. 全局异常处理增强
- **修改**: `GlobalExceptionHandler.java` — 捕获 `DataIntegrityViolationException` 返回友好的 FK 冲突提示

---

## Phase 2: 前端项目搭建

### 2A. 脚手架
```
frontend/
  package.json        — react, react-dom, react-router-dom, axios
  vite.config.js      — @vitejs/plugin-react + @tailwindcss/vite + proxy /api → :8080
  src/
    main.jsx
    index.css          — @import "tailwindcss"
    App.jsx            — Layout + Routes
```

### 2B. 核心目录结构
```
src/
  api/client.js           — axios instance, 自动解包 ApiResponse
  components/
    Layout.jsx            — 侧边栏 + 内容区
    Sidebar.jsx           — 导航链接
    DataTable.jsx         — 通用表格 (columns config + pagination)
    Modal.jsx             — 弹窗
    FormField.jsx         — 表单字段
    StatusBadge.jsx       — 状态标签
    ConfirmDialog.jsx     — 删除确认
  hooks/
    useApi.js             — { data, loading, error, refetch }
  pages/
    Dashboard.jsx
    accounts/AccountList.jsx, AccountDetail.jsx
    grant-types/GrantTypeList.jsx
    fee-categories/FeeCategoryList.jsx
    rate-cards/RateCardList.jsx, RateCardDetail.jsx
```

### 路由表
| Path | 页面 | 说明 |
|------|------|------|
| `/` | Dashboard | 概览卡片 |
| `/accounts` | AccountList | 客户列表，分页+状态筛选 |
| `/accounts/:id` | AccountDetail | 余额卡片 + 交易流水 |
| `/grant-types` | GrantTypeList | 授予类型 CRUD |
| `/fee-categories` | FeeCategoryList | 费用分类 CRUD |
| `/rate-cards` | RateCardList | 费率卡列表 |
| `/rate-cards/:id` | RateCardDetail | 费率卡详情 + items 管理 |

---

## Phase 3: 生产构建集成

- **修改 `pom.xml`**: 添加 `frontend-maven-plugin` 在 Maven build 时执行 `npm install` + `npm run build`
- 构建产物复制到 `src/main/resources/static/`
- **新建 `WebConfig.java`**: SPA fallback — 非 API/非静态资源请求返回 `index.html`
- `.gitignore` 追加: `frontend/node_modules/`, `src/main/resources/static/`

---

## 实施顺序

1. **前端脚手架** — Vite + React + TailwindCSS + 路由 + Layout + API client
2. **字典页面** — Grant Types & Fee Categories (后端CRUD + 前端页面，建立所有复用组件)
3. **费率卡** — 后端扩展 + 列表页 + 详情页(含 items 子表)
4. **客户管理** — 后端扩展 + 列表页 + 详情页(余额+交易流水)
5. **Dashboard** — 最后做，汇总展示
6. **Maven 构建集成** — pom.xml plugins + WebConfig + .gitignore

## 验证方式
- `cd frontend && npm run dev` — 开发服务器 :5173，代理到 Spring Boot :8080
- 每个 CRUD 页面手动验证增删改查
- `mvn clean package` — 验证前端构建集成
- `java -jar target/credits-0.1.0-SNAPSHOT.jar` — 验证生产模式 SPA 路由
