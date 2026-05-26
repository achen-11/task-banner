# 后端 Spec

## 架构分层

```text
src/api/{resource}.ts       # API 端点：路由、鉴权、参数校验、调用 Service
src/code/Services/{name}.ts # 业务逻辑
src/code/Models/{Name}.ts   # 数据模型（k_sqlite / ksql ORM）
src/code/Utils/             # 通用工具（response、mitt、useSocket）
```

**依赖方向：** `api` → `Services` → `Models`，禁止 Model 反向依赖 Service。

## API 约定

### 路由声明

每个 API 文件首行用 `@k-url` 注释声明路由前缀：

```typescript
// @k-url /api/task/{action}
```

### 端点注册

```typescript
k.api.get("list", () => { ... })
k.api.post("create", () => { ... })
k.api.put("update", () => { ... })
k.api.delete("delete", () => { ... })
```

实际 URL：`/api/task/list`、`/api/task/create` 等。

### 响应格式

统一使用 `code/Utils/response`：

```typescript
import { success, error } from 'code/Utils/response'

// 成功
return success({ items, total, page, pageSize })

// 失败
return error('Unauthorized', 401)
return error('Not found', 404)
return error('Internal server error', 500, err)
```

响应体结构：

```json
{ "code": 200, "message": "Success", "data": { ... } }
```

### 鉴权模式

API 层统一检查：

```typescript
import { getCurrentAuthUser } from 'code/Services/auth'

const currentUser = getCurrentAuthUser()
if (!currentUser) {
  return error('Unauthorized', 401)
}
```

项目级权限通过 `checkProjectPermission(projectId, userId, role)` 校验。

### 导入路径

使用 `tsconfig.json` 别名，不用相对路径跨层引用：

```typescript
import { success, error } from 'code/Utils/response'
import { getTaskById } from 'code/Services/task'
import { Task } from 'code/Models/Task'
```

## 现有 API 资源

| 文件 | 路由前缀 | 职责 |
| --- | --- | --- |
| `auth.ts` | `/api/auth/{action}` | 登录、注册、资料、改密 |
| `task.ts` | `/api/task/{action}` | 任务 CRUD、评论、排序、导入评论 |
| `project.ts` | `/api/project/{action}` | 项目与成员 |
| `module.ts` | `/api/module/{action}` | 项目模块 |
| `tag.ts` | `/api/tag/{action}` | 标签 |
| `document.ts` | `/api/document/{action}` | 文档与版本 |
| `attachment.ts` | `/api/attachment/{action}` | 附件上传与关联 |
| `notification.ts` | `/api/notification/{action}` | 通知 |
| `dashboard.ts` | `/api/dashboard/{action}` | 统计 |
| `search.ts` | `/api/search/{action}` | 全局搜索 |
| `user.ts` | `/api/user/{action}` | 用户信息与跨项目任务 |
| `websocket.ts` | `/api/websocket/connect` | WebSocket 连接 |
| `__logout.ts` | `/__logout__` | 退出登录 |
| `kbAuthCallBack.ts` | `/__kbAuthCallback` | Kooboo OAuth 回调 |

### auth 端点

| 方法 | Action | 说明 |
| --- | --- | --- |
| POST | `login` | 账号密码登录 |
| POST | `register` | 注册 |
| POST | `kooboo-login` | Kooboo 登录 |
| POST | `logout` | 退出 |
| GET | `me` | 当前用户 |
| PUT | `profile` | 更新资料 |
| POST | `change-password` | 修改密码 |

### 开发/调试 API

| 文件 | 路由 | 说明 |
| --- | --- | --- |
| `test.ts` | `GET /api/test/websocket` | 手动触发 WebSocket 广播（开发用，非生产） |

## 已废弃

| 原文件 | 原路由 | 替代 |
| --- | --- | --- |
| ~~`api_upload.ts`~~ | `/api/upload/{action}` | `attachment.ts` → `/api/attachment/upload` 等 |

本地已删除 `api_upload.ts`；若远端仍存在旧脚本，可手动清理。

## 数据模型

Models 通过 `k_sqlite` 模块的 `ksql` 定义表结构，统一从 `code/Models/index.ts` 导出：

```typescript
import { ksql, DataTypes } from 'module/k_sqlite'

export const Task = ksql.define('tasks', { ... }, { timestamps: true })
```

`module/k_sqlite` 为站点已安装的 Kooboo 模块（`tsconfig` alias `module/*`），本地 `src/module/` 无源码副本。

| Model | 说明 |
| --- | --- |
| User | 用户 |
| Project / ProjectMember | 项目与成员 |
| Module | 项目模块（任务分组） |
| Task / TaskTag / TaskModule | 任务及关联 |
| TaskHistory / TaskComment / CommentReaction | 活动与评论 |
| Tag | 标签 |
| Document / DocumentVersion | 文档 |
| Attachment | 附件 |
| Notification | 通知 |

新增 Model 时：在 `code/Models/` 创建文件，并在 `index.ts` 注册导出。

## WebSocket

- 连接端点：`/api/websocket/connect`
- 工具：`code/Utils/useSocket.ts`（SocketParser）
- 服务：`code/Services/websocket.ts`
- 事件类型：`task_created/updated/deleted`、`comment_*`、`document_*`、`notification`

API 层在数据变更后调用 `pushTaskCreated` 等函数推送实时消息。

## 测试

```bash
pnpm test   # vitest + @kooboo/vitest-plugin
```

测试文件与 API 同目录或按 vitest 配置放置。
