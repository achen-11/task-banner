# 路由 Spec

## Page 路由（Kooboo）

| URL | 文件 | 说明 |
| --- | --- | --- |
| `/` | `src/page/index.html` | Vue SPA 唯一入口，含服务端鉴权脚本 |
| `/login` | `Login.vue`（Hash） | 账号密码 / Kooboo 登录 |
| `/__kbAuthCallback` | `src/api/kbAuthCallBack.ts` | Kooboo OAuth 回调 |
| `/__kbAuthResult` | `src/page/kbAuthResult.html` | Kooboo 登录结果页 |

Page 入口通过 `<!-- @k-url / -->` 声明。所有前端路由由 Vue Router Hash 模式在客户端处理。

## 前端路由（Vue Router Hash）

基址为 `/`，实际 URL 形如 `/#/my-tasks`。

| Hash 路径 | 组件 | 说明 |
| --- | --- | --- |
| `/` | `Home.vue` | 首页 / 仪表盘 |
| `/my-tasks` | `MyTasks.vue` | 我的任务（列表 / 看板） |
| `/projects` | `Projects.vue` | 项目列表 |
| `/projects/:id` | `ProjectView.vue` | 项目详情（任务、文档、设置） |
| `/projects/:projectId/documents/:documentId` | `ProjectView.vue` | 文档详情 |
| `/messages` | `Messages.vue` | 消息通知 |
| `/login` | `Login.vue` | 登录 / 注册（无需鉴权） |

除 `/login` 外，其余路由挂载在 `MainLayout` 下，`meta.requiresAuth: true`。

## API 前缀

统一前缀 `/api/`，按资源分文件：

```text
/api/task/{action}
/api/project/{action}
/api/document/{action}
/api/notification/{action}
/api/websocket/connect
/api/upload/{action}
...
```

## 认证路由

| 场景 | 行为 |
| --- | --- |
| 未登录访问受保护页 | 前端路由守卫跳转 `/#/login` |
| 账号密码登录 | `POST /api/auth/login` → Cookie `task_banner_auth_token` |
| Kooboo 登录 | `/_Admin/login` → `/__kbAuthCallback` → JWT → `/#/` |
| API 401 | 前端跳转 `/__logout__` |
| 退出 | `/__logout__` → 清除 JWT → `/#/login` |

## API 认证端点

```text
POST /api/auth/login
POST /api/auth/register
POST /api/auth/kooboo-login
GET  /api/auth/me
POST /api/auth/logout
```

## 静态资源

| 路径 | 来源 |
| --- | --- |
| `/logo.svg` | `src/logo.svg` |
| `/index.js` | `src/js/`（Vite build，稳定文件名） |
| `/index.css` | `src/css/`（Vite build，稳定文件名） |
| `/*.js` chunk | `src/js/`（如 `Home.js`、`Login.js` 等） |
| `/__kb/kfile/...` | Kooboo 文件服务（附件等） |
