export const meta = {
  name: 'create_task',
  description: '在指定项目下创建任务；需先通过 list_projects 获取 project_id、module_ids、tag_ids',
  approvalRequired: false,
  tags: ['task-banner'],
  inputSchema: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: '任务标题'
      },
      project_id: {
        type: 'string',
        description: '项目 _id'
      },
      module_ids: {
        type: 'array',
        items: { type: 'string' },
        description: '模块 _id 列表（可多选）'
      },
      content: {
        type: 'string',
        description: '任务描述，支持 Markdown'
      },
      status: {
        type: 'string',
        enum: ['todo', 'in_progress', 'review', 'completed'],
        description: '默认 todo'
      },
      priority: {
        type: 'string',
        enum: ['low', 'medium', 'high'],
        description: '默认 medium'
      },
      assignee_id: {
        type: 'string',
        description: '处理人 user _id'
      },
      due_date: {
        type: 'integer',
        description: '截止时间戳（毫秒）'
      },
      progress: {
        type: 'integer',
        description: '进度 0-100'
      },
      tag_ids: {
        type: 'array',
        items: { type: 'string' },
        description: '标签 _id 列表'
      },
      summary: {
        type: 'string',
        description: '变更摘要（20-50 字）'
      }
    },
    required: ['title', 'project_id'],
    additionalProperties: false
  }
} as const

import { getCurrentAuthUser } from 'code/Services/auth'
import { checkProjectPermission } from 'code/Services/project'
import { createTask, getTaskDetailById } from 'code/Services/task'
import { createMCPOperationNotification } from 'code/Services/notification'
import { pushTaskCreated, pushNotification } from 'code/Services/websocket'
import { Notification } from 'code/Models/Notification'
import { parseMcpRequestArgs } from 'code/Utils/mcpArgs'

const args = parseMcpRequestArgs(k.request.body)
const currentUser = getCurrentAuthUser()

if (!currentUser) {
  k.response.json({ ok: false, error: 'Unauthorized' })
} else if (!args.title || !args.project_id) {
  k.response.json({ ok: false, error: 'title 与 project_id 必填' })
} else {
  const projectId = String(args.project_id)
  const title = String(args.title).trim()
  if (!title) {
    k.response.json({ ok: false, error: 'title 不能为空' })
  } else if (!checkProjectPermission(projectId, currentUser._id, 'member')) {
    k.response.json({ ok: false, error: '无权限在该项目创建任务' })
  } else {
    const moduleIds = Array.isArray(args.module_ids)
      ? args.module_ids.map(String)
      : []
    const tagIds = Array.isArray(args.tag_ids)
      ? args.tag_ids.map(String)
      : []

    const taskId = createTask({
      projectId,
      moduleIds,
      title,
      content: args.content ? String(args.content) : '',
      status: args.status ? String(args.status) : undefined,
      priority: args.priority ? String(args.priority) : undefined,
      assigneeId: args.assignee_id ? String(args.assignee_id) : undefined,
      creatorId: currentUser._id,
      dueDate: args.due_date as number | undefined,
      progress: args.progress as number | undefined,
      tags: tagIds,
      summary: args.summary ? String(args.summary) : undefined
    })

    const task = getTaskDetailById(taskId)
    if (!task) {
      k.response.json({ ok: false, error: '创建失败' })
    } else {
      try {
        pushTaskCreated(task, projectId)
      } catch (wsErr) {
        k.logger.warning('WebSocket', `Failed to push task created: ${wsErr}`)
      }
      try {
        const notificationId = createMCPOperationNotification(
          currentUser._id,
          'task_created',
          task.title,
          task._id,
          projectId
        )
        const notification = Notification.findById(notificationId)
        if (notification) {
          pushNotification(currentUser._id, notification, projectId)
        }
      } catch (notifErr) {
        k.logger.warning('Notification', `Failed to create MCP notification: ${notifErr}`)
      }
      k.response.json({ ok: true, data: task })
    }
  }
}
