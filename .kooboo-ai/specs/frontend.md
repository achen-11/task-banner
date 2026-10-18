# 前端 Spec

## 路线

- [ ] SSR
- [x] Local

Task Banner 是需登录的后台协作应用，含看板拖拽、实时消息、图表等复杂交互，采用 Vue 3 SPA。

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
├── vite.config.ts           # outDir: dist；稳定文件名；Kooboo 注入插件

.build-manifest.json         # build 产物清单（gitignore，用于清理旧文件）
build.sh                     # 根目录 build：dist → src/page|js|css，可选 --push

src/                         # Kooboo CLI 资源目录（build 产物 + 后端）
├── page/index.html          # SPA 入口（含 @k-url 与服务端鉴权脚本）
├── js/                      # Vite 打包 JS（稳定文件名，如 index.js）
├── css/                     # Vite 打包 CSS（稳定文件名，如 index.css）
├── api/                     # Kooboo API 端点
└── code/                    # KScript 业务逻辑
```

### Build 命令

```bash
# 开发（Vite dev server，代理 /api 到远端 Kooboo）
pnpm --dir frontend dev

# 生产 build（type-check → vite build → build.sh 复制到 src/）
pnpm build

# 或仅前端编译（不复制到 src/，一般由 build.sh 调用）
pnpm --dir frontend build

# build 并推送到 Kooboo
pnpm build:push
```

**Build 流程：**

1. Vite `outDir: frontend/dist`，JS/CSS 使用**稳定文件名**（无 hash）
2. `addKoobooUrlPlugin`（closeBundle）在 `dist/index.html` 注入 `@k-url /` 和服务端鉴权脚本
3. `build.sh` 按 `.build-manifest.json` 清理旧产物，再从 `dist/` 复制到 `src/page/`、`src/js/`、`src/css/`
4. 根目录 `pnpm dev`（`kb sync`）同步到远端；或 `pnpm build:push` 窄范围推送 manifest 内文件

### 代码规范

- 组件文件 PascalCase（`TaskDetailDrawer.vue`）
- composable 以 `use` 前缀（`useWebSocket.ts`）
- API 封装与后端 `src/api/` 资源一一对应，放 `frontend/src/api/`
- 路径别名 `@` → `frontend/src/`

### 认证与环境

| 环境 | 认证方式 | API 基址 |
| --- | --- | --- |
| 开发 | 应用 JWT 请求头 + Vite proxy | `/`（同源请求，走 proxy） |
| 生产 | 应用 JWT / Cookie，Page 可注入 `__USER_INFO__` | `/`（同源请求） |

- API 基址以 `frontend/src/utils/request.ts` 为准，当前为 `/`，未读取 `VITE_API_BASE_URL`
- 开发代理当前目标：`https://ai_task_v2.redev.cn`，配置见 `frontend/vite.config.ts`
- 前端请求头：`X-Task-Banner-Token`；token 来源为内存、localStorage 或 Cookie `task_banner_auth_token`
- Page 服务端脚本仅在有登录态时注入用户；未登录由前端守卫跳转 `/#/login`
- 退出登录：清除前端 token，再访问 `/__logout__`（`src/api/__logout.ts`）

### 样式

- Tailwind CSS + Element Plus 主题
- 组件 scoped CSS 与 Tailwind utility 混用
- Markdown 渲染使用 `github-markdown-css`

## 禁止事项

- 不要在 CLI 本地开发中引入 `<k-data>`
- 不要直接修改 `src/js/`、`src/css/` 中的 build 产物，改 `frontend/` 后重新 build
- 不要将 Vue Router 改为 History 模式（Kooboo 单 Page 入口需 Hash 路由）
- API 保持同源相对路径；调整开发代理时修改 `vite.config.ts`
