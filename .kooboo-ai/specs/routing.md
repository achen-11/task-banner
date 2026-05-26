# 路由 Spec

## Page 路由（Kooboo）

| URL | 文件 | 说明 |
| --- | --- | --- |
| `/` | `src/page/index.html` | Vue SPA 唯一入口，含服务端鉴权脚本 |
| `/__logout` | `src/api/__logout.ts` | 退出登录 |

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

所有路由挂载在 `MainLayout` 下，`meta.requiresAuth: true`。

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
| 未登录访问 `/` | Page 服务端脚本重定向 `/_Admin/login?permission=u&returnurl=/` |
| API 401 | 前端 `request.ts` 拦截，生产环境跳转 `/__logout__` |
| 开发模式 | Vite proxy + Cookie `jwt_token`，401 仅 console 警告 |

## 静态资源

| 路径 | 来源 |
| --- | --- |
| `/logo.svg` | `src/logo.svg` |
| `/index-{hash}.js` | `src/js/`（Vite build） |
| `/index-{hash}.css` | `src/css/`（Vite build） |
| `/__kb/kfile/...` | Kooboo 文件服务（附件等） |
