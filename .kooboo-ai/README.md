# Task Banner — AI 协作入口

Task Banner（TaskFlow）是一个基于 Kooboo CLI 的任务管理应用，面向已登录用户，提供项目、任务、文档、消息通知等协作能力。

本目录存放**本项目特有**的约定，优先于全局 `kooboo-cli-coding` skill 的默认规则。

## 读取顺序

1. 本文件
2. `specs/frontend.md` — 前端路线与 build 约定
3. `specs/backend.md` — API、Service、Model 约定
4. `specs/routing.md` — URL 与路由映射
5. `rules/overrides.md` — 覆盖 skill 默认的项目特例

## 前端路线

**Local**（Vue 3 SPA + Hash Router）

- 单页入口：`src/page/index.html`（`@k-url /`）
- 源码目录：`frontend/`
- 不需要 SEO，后台类交互应用

## 关键约定

| 领域 | 约定 |
| --- | --- |
| 响应格式 | `{ code, message, data }`，见 `code/Utils/response` |
| API 前缀 | `/api/{resource}/{action}` |
| 认证 | Kooboo 账号体系；Page 服务端脚本注入 `__USER_INFO__` |
| 实时通信 | WebSocket `/api/websocket/connect` |
| 数据层 | Kooboo Commerce `k.commerce.product` 作为 ORM（Models 封装） |
| 同步命令 | 根目录 `pnpm dev`（`kb sync`） |

## 开发流程

```bash
# 后端 / 资源同步（监听 src/ 变化）
pnpm dev

# 前端开发（Vite HMR，代理到远端 Kooboo）
pnpm --dir frontend dev

# 前端 build → 产物写入 src/page、src/js、src/css
pnpm --dir frontend build

# 窄范围推送（示例）
kb push src/api/task.ts
kb push src/page/index.html
```

## 业务模块

- **项目** — 项目 CRUD、成员、权限
- **任务** — 看板 / 列表、拖拽排序、评论、标签
- **文档** — 项目内 Markdown 文档与版本
- **附件** — 任务 / 文档附件上传
- **通知** — 站内消息 + WebSocket 实时推送
- **仪表盘** — 统计概览
