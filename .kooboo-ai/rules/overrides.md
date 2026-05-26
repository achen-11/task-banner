# 项目特例规则

以下规则**覆盖** `kooboo-cli-coding` skill 的默认约定。与 CLI 编译规则冲突的 override 无效。

## 响应格式

- 统一使用 `{ code, message, data }`，helper 为 `code/Utils/response` 的 `success()` / `error()`
- 前端 Axios 拦截器自动解包 `data.data`（`code === 200` 时返回 `data` 字段）

## API 路径

- 前缀固定 `/api/{resource}/{action}`，用 `@k-url` 注释声明
- 不使用 `/api/v1/` 版本号

## 前端

- **Local 路线**，不用 SSR layout / view 模板
- Vue Router 必须使用 **Hash 模式**（`createWebHashHistory`）
- 前端源码在 `frontend/`，禁止直接编辑 `src/js/`、`src/css/` build 产物
- 样式用 **Tailwind CSS**，不用 UnoCSS
- 默认不用 `<k-data>`；Page 入口用 `<script env="server">` 做鉴权与用户注入

## 认证

- 依赖 Kooboo 内置账号（`k.account`），不自建 JWT 签发
- 生产环境用户信息通过 `k.utils.clientJS.setVariable('__USER_INFO__', userInfo)` 注入
- 开发环境通过 Vite proxy + Cookie `jwt_token` 对接远端

## 数据层

- 使用 `k_sqlite` 模块的 `ksql` ORM（SQLite），**不使用 Commerce**
- Model 通过 `ksql.define()` 定义，命名 PascalCase 单数（`Task.ts`），Service 命名 camelCase（`task.ts`）

## 实时通信

- WebSocket 走 Kooboo `k.net.webSocket` API
- 消息格式由 `code/Utils/useSocket` 的 `SocketParser` 统一序列化

## 同步策略

- 日常开发：`pnpm dev`（`kb sync`）监听全量 `src/`
- AI 改动后端/API 时：优先窄范围 `kb push src/api/xxx.ts`
- 前端改动后：先 `pnpm --dir frontend build`，再 sync / push page 与静态资源

## 禁止事项

- 不使用 Kooboo AI Chat 的 `read_object_text`、`create_page` 等对象 API
- 不在 API 层写复杂业务逻辑，应下沉到 Services
- 不引入 k-data
- 不在回复或 spec 中暴露 `.env` 里的账号密码
