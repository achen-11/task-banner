# Task Banner

基于 Kooboo CLI 的任务协作应用，提供项目、任务看板、文档、附件、通知与 MCP 工具。前端使用 Vue 3、Vite、Element Plus 和 Tailwind CSS；后端运行于 Kooboo KScript，使用 `k_sqlite` 数据层。

## 本地开发

使用 pnpm 管理依赖，Node.js 版本需满足 `frontend/package.json` 的 `engines`。

```bash
pnpm install
pnpm --dir frontend install

# 前端开发服务器
pnpm --dir frontend dev

# 监听资源并同步到 Kooboo（会更新远端站点）
pnpm dev
```

根目录 `.env` 保存 Kooboo CLI 连接配置，不提交账号、密码或 token。前端开发代理见 `frontend/vite.config.ts`。

## 构建与同步

```bash
# 仅编译前端，不运行全量类型检查，也不复制到 Kooboo 资源目录
pnpm --dir frontend build-only

# 完整构建并将产物复制到 src/page、src/js、src/css
# 当前脚本同时运行前端类型检查，按需执行
pnpm build

# 完整构建并推送静态资源到远端
pnpm build:push

# 后端与 MCP 工具按文件推送
kb push src/api/task.ts
kb push mcp-tools/list_tasks.ts
```

## 目录与规范

| 路径 | 用途 |
| --- | --- |
| `frontend/` | Vue SPA 源码，使用 Hash 路由 |
| `src/api/` | HTTP API 路由与参数校验 |
| `src/code/` | Models、Services、Utils |
| `mcp-tools/` | 复用业务服务的 MCP 工具 |
| `images/mcp-clients/` | 同步到 Kooboo 媒体库的客户端图标 |
| `kooboo.d.ts` | Kooboo CLI 生成的运行时类型声明 |
| `.kooboo-ai/` | 项目规范、协作流程和任务模板 |

项目规范入口：[`.kooboo-ai/README.md`](.kooboo-ai/README.md)。后端约定、认证与路由分别见 `specs/backend.md`、`rules/overrides.md` 和 `specs/routing.md`。

认证使用应用 JWT：前端通过 `X-Task-Banner-Token` 请求头传递，后端也支持 `task_banner_auth_token` Cookie 和 Kooboo 会话。API 返回 `{ code, message, data }`。

`src/page/`、`src/js/`、`src/css/` 是构建与同步资源，已被 Git 忽略；请修改 `frontend/` 源码后重新构建。`pnpm test` 使用 Kooboo 测试插件，依赖本地测试配置和站点环境，并非纯离线单元测试。
