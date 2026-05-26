# 前端 Spec

## 路线

- [ ] SSR
- [x] Local

TaskFlow 是需登录的后台协作应用，含看板拖拽、实时消息、图表等复杂交互，采用 Vue 3 SPA。

## Local 路线

### 框架与工具

| 项 | 选型 |
| --- | --- |
| 框架 | Vue 3 + Composition API |
| 路由 | Vue Router 4（**Hash 模式**） |
| 状态 | Pinia |
| 组件库 | Element Plus |
| 样式 | Tailwind CSS 3 |
| 构建 | Vite 7 |
| HTTP | Axios（`frontend/src/utils/request.ts`） |

### 目录结构

```text
frontend/                    # 前端源码（开发在此）
├── src/
│   ├── views/               # 页面级组件
│   ├── components/          # 可复用组件
│   ├── layouts/             # MainLayout 等
│   ├── router/              # 路由与守卫
│   ├── stores/              # Pinia stores
│   ├── api/                 # 前端 API 封装（与 src/api 对应）
│   ├── composables/         # 组合式函数
│   └── utils/               # auth、request 等
├── vite.config.ts
└── post-build.js            # build 后整理产物目录

src/                         # Kooboo CLI 资源目录（build 产物 + 后端）
├── page/index.html          # SPA 入口（含 @k-url 与服务端鉴权脚本）
├── js/                      # Vite 打包 JS（带 hash）
├── css/                     # Vite 打包 CSS（带 hash）
├── api/                     # Kooboo API 端点
└── code/                    # KScript 业务逻辑
```

### Build 命令

```bash
# 开发（Vite dev server，代理 /api 到远端 Kooboo）
pnpm --dir frontend dev

# 生产 build（type-check → vite build → post-build 整理目录）
pnpm --dir frontend build
```

**Build 流程：**

1. Vite `outDir: ../src`，JS/CSS 输出到 `src/` 根目录
2. `addKoobooUrlPlugin`（closeBundle）在 `src/index.html` 注入 `@k-url /` 和服务端鉴权脚本
3. `post-build.js` 将产物移入 `src/page/`、`src/js/`、`src/css/`，并清理旧 hash 文件
4. 根目录 `pnpm dev`（`kb sync`）同步到远端

### 代码规范

- 组件文件 PascalCase（`TaskDetailDrawer.vue`）
- composable 以 `use` 前缀（`useWebSocket.ts`）
- API 封装与后端 `src/api/` 资源一一对应，放 `frontend/src/api/`
- 路径别名 `@` → `frontend/src/`

### 认证与环境

| 环境 | 认证方式 | API 基址 |
| --- | --- | --- |
| 开发 | Cookie `jwt_token` + Vite proxy | `VITE_API_BASE_URL=`（空，走 proxy） |
| 生产 | Page 服务端脚本注入 `__USER_INFO__` | `VITE_API_BASE_URL=https://ai_task_manage.redev.cn` |

- 开发代理目标：`https://ai_task_manage.redev.cn`（`/api`、`/__kb/kfile`）
- 生产未登录：Page 脚本重定向 `/_Admin/login?permission=u&returnurl=/`
- 退出登录：`/__logout__`（`src/api/__logout.ts`）

### 样式

- Tailwind CSS + Element Plus 主题
- 组件 scoped CSS 与 Tailwind utility 混用
- Markdown 渲染使用 `github-markdown-css`

## 禁止事项

- 不要在 CLI 本地开发中引入 `<k-data>`
- 不要直接修改 `src/js/`、`src/css/` 中的 build 产物，改 `frontend/` 后重新 build
- 不要将 Vue Router 改为 History 模式（Kooboo 单 Page 入口需 Hash 路由）
- 不要在生产前端硬编码 API 域名，使用 `VITE_API_BASE_URL`
