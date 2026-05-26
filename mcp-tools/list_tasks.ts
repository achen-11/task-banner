export const meta = {
  name: 'list_tasks',
  description: '查询指定项目下的任务，支持按模块、状态、优先级、处理人、标题筛选与分页',
  approvalRequired: false,
  tags: ['task-banner'],
  inputSchema: {
    type: 'object',
    properties: {
      project_id: {
        type: 'string',
        description: '项目 _id'
      },
      module_id: {
        type: 'string',
        description: '模块 _id'
      },
      status: {
        type: 'string',
        enum: ['todo', 'in_progress', 'review', 'completed'],
        description: '任务状态'
      },
      priority: {
        type: 'string',
        enum: ['low', 'medium', 'high'],
        description: '优先级'
      },
      assignee_id: {
        type: 'string',
        description: '处理人 user _id'
      },
      title: {
        type: 'string',
        description: '标题模糊匹配'
      },
      page: {
        type: 'integer',
        description: '页码，默认 1'
      },
      limit: {
        type: 'integer',
        description: '每页条数，默认 20'
      },
      sort_field: {
        type: 'string',
        description: '排序字段，如 updatedAt、priority、status'
      },
      sort_direction: {
        type: 'string',
        enum: ['asc', 'desc'],
        description: '排序方向'
      }
    },
    required: ['project_id'],
    additionalProperties: false
  }
} as const

import { getCurrentAuthUser } from 'code/Services/auth'
import { checkProjectPermission } from 'code/Services/project'
import { getProjectTasks } from 'code/Services/task'
import { parseMcpRequestArgs } from 'code/Utils/mcpArgs'

const args = parseMcpRequestArgs(k.request.body)
const currentUser = getCurrentAuthUser()

if (!currentUser) {
  k.response.json({ ok: false, error: 'Unauthorized' })
} else if (!args.project_id) {
  k.response.json({ ok: false, error: 'project_id 必填' })
} else {
  const projectId = String(args.project_id)
  if (!checkProjectPermission(projectId, currentUser._id, 'member')) {
    k.response.json({ ok: false, error: '无权限访问该项目' })
  } else {
    const filters: Record<string, string> = {}
    if (args.module_id) filters.moduleId = String(args.module_id)
    if (args.status) filters.status = String(args.status)
    if (args.priority) filters.priority = String(args.priority)
    if (args.assignee_id) filters.assigneeId = String(args.assignee_id)

    let items = getProjectTasks(
      projectId,
      filters,
      args.sort_field ? String(args.sort_field) : undefined,
      args.sort_direction ? String(args.sort_direction) : undefined
    )

    if (args.title) {
      const q = String(args.title).toLowerCase()
      items = items.filter((t) => t.title.toLowerCase().includes(q))
    }

    const page = (args.page as number) || 1
    const limit = (args.limit as number) || 20
    const total = items.length
    const start = (page - 1) * limit
    const list = items.slice(start, start + limit)

    k.response.json({
      ok: true,
      list,
      page,
      pageSize: limit,
      total
    })
  }
}
