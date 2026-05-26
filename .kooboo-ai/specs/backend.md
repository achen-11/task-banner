# 后端 Spec

## 架构分层

```text
src/api/{resource}.ts       # API 端点：路由、鉴权、参数校验、调用 Service
src/code/Services/{name}.ts # 业务逻辑
src/code/Models/{Name}.ts   # 数据模型（Kooboo Commerce ORM 封装）
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
if (!k.account.isLogin) {
  return error('Unauthorized', 401)
}
const username = k.account.user.current.userName
const currentUser = getUserInfo(username)
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
| `task.ts` | `/api/task/{action}` | 任务 CRUD、评论、排序 |
| `project.ts` | `/api/project/{action}` | 项目与成员 |
| `module.ts` | `/api/module/{action}` | 项目模块 |
| `tag.ts` | `/api/tag/{action}` | 标签 |
| `document.ts` | `/api/document/{action}` | 文档与版本 |
| `attachment.ts` | `/api/attachment/{action}` | 附件 |
| `notification.ts` | `/api/notification/{action}` | 通知 |
| `dashboard.ts` | `/api/dashboard/{action}` | 统计 |
| `search.ts` | `/api/search/{action}` | 全局搜索 |
| `user.ts` | `/api/user/{action}` | 用户信息 |
| `websocket.ts` | `/api/websocket/connect` | WebSocket 连接 |
| `api_upload.ts` | `/api/upload/{action}` | 文件上传 |
| `__logout.ts` | `/__logout` | 退出登录 |

## 数据模型

Models 基于 Kooboo Commerce Product 封装，统一从 `code/Models/index.ts` 导出。

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
