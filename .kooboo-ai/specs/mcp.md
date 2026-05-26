# MCP Tools Spec

Task Banner 通过 Kooboo 站点 MCP 暴露任务管理能力，供 AI 客户端（如 Cursor）调用。

## 目录

- 工具文件：`mcp-tools/*.ts`（项目根目录，不在 `src/` 下）
- 入参解析：`code/Utils/mcpArgs.ts`
- 业务逻辑：复用 `code/Services/*`，MCP Tool 做薄封装

## 响应格式

MCP 工具使用 `{ ok, data | error }`，与 HTTP API 的 `{ code, message, data }` 区分：

```json
{ "ok": true, "data": { ... } }
{ "ok": false, "error": "Unauthorized" }
```

## 鉴权

- 调用 `getCurrentAuthUser()`（JWT 或 Kooboo 会话）
- 写操作前 `checkProjectPermission(projectId, userId, 'member')`

## 工具列表

| 工具 | 说明 |
| --- | --- |
| `list_projects` | 列出用户项目及模块、标签 |
| `list_tasks` | 按项目查询任务（支持筛选与分页） |
| `get_task` | 单条任务详情 |
| `create_task` | 创建任务（含 WebSocket + MCP 通知） |
| `update_task` | 更新任务（含 WebSocket + MCP 通知） |
| `add_comment` | 为任务添加评论（含 WebSocket 推送） |
| `list_comments` | 获取任务评论列表（分页、类型筛选） |
| `list_attachments` | 获取任务/评论附件列表 |
| `delete_task` | 删除任务（管理员或创建者） |

## 领域字段

| MCP 参数 | 对应 Service 字段 |
| --- | --- |
| `project_id` | `projectId` |
| `task_id` | 任务 `_id` |
| `module_ids` | `moduleIds` |
| `tag_ids` | `tags` |
| `assignee_id` | `assigneeId` |
| `due_date` | `dueDate` |

状态：`todo` | `in_progress` | `review` | `completed`  
优先级：`low` | `medium` | `high`

## 同步

```bash
kb push mcp-tools/              # 推送全部
kb push mcp-tools/list_tasks.ts # 推送单个
pnpm dev                        # kb sync 自动监听
```

## Agent 协作

人与 Agent 通过 Task Banner 管理任务、通过 MCP 执行任务的完整流程见：

**`.kooboo-ai/specs/agent-sop.md`**

要点：

- 任务以 Task Banner 为准；Agent 用 `k_list_tasks` / `k_get_task` 拉取
- 开工 → `in_progress` + `k_add_comment`；完工 → 验证后 `completed`
- 代码实现遵循 `kooboo-cli-coding` skill + 本仓库 `.kooboo-ai` spec
- 附件/评论/删除任务已提供 MCP：`list_comments`、`list_attachments`、`delete_task`
- 活动流仍用 `GET /api/task/activities?taskId=`
