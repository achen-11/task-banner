export const meta = {
  name: 'update_task',
  description: '按 task_id 更新任务（状态、优先级、处理人、描述、模块、标签等）',
  approvalRequired: false,
  tags: ['task-banner'],
  inputSchema: {
    type: 'object',
    properties: {
      task_id: {
        type: 'string',
        description: '任务 _id'
      },
      title: {
        type: 'string',
        description: '任务标题'
      },
      content: {
        type: 'string',
        description: '任务描述，支持 Markdown'
      },
      status: {
        type: 'string',
        enum: ['todo', 'in_progress', 'review', 'completed']
      },
      priority: {
        type: 'string',
        enum: ['low', 'medium', 'high']
      },
      assignee_id: {
        type: 'string',
        description: '处理人 user _id'
      },
      module_ids: {
        type: 'array',
        items: { type: 'string' },
        description: '模块 _id 列表（会完全替换现有模块）'
      },
      tag_ids: {
        type: 'array',
        items: { type: 'string' },
        description: '标签 _id 列表（会完全替换现有标签）'
      },
      due_date: {
        type: 'integer',
        description: '截止时间戳（毫秒），传 0 表示清除'
      },
      progress: {
        type: 'integer',
        description: '进度 0-100'
      },
      summary: {
        type: 'string',
        description: '变更摘要（20-50 字）'
      }
    },
    required: ['task_id'],
    additionalProperties: false
  }
} as const

import { getCurrentAuthUser } from 'code/Services/auth'
import { checkProjectPermission } from 'code/Services/project'
import { getTaskById, getTaskDetailById, updateTask } from 'code/Services/task'
import { createMCPOperationNotification } from 'code/Services/notification'
import { pushTaskUpdated, pushNotification } from 'code/Services/websocket'
import { Notification } from 'code/Models/Notification'
import { parseMcpRequestArgs } from 'code/Utils/mcpArgs'

const args = parseMcpRequestArgs(k.request.body)
const currentUser = getCurrentAuthUser()

if (!currentUser) {
  k.response.json({ ok: false, error: 'Unauthorized' })
} else if (!args.task_id) {
  k.response.json({ ok: false, error: 'task_id 必填' })
} else {
  const taskId = String(args.task_id)
  const task = getTaskById(taskId)
  if (!task) {
    k.response.json({ ok: false, error: '任务不存在' })
  } else if (!checkProjectPermission(task.projectId, currentUser._id, 'member')) {
    k.response.json({ ok: false, error: '无权限更新该任务' })
  } else {
    const updateData: Record<string, unknown> = {}
    if (args.title !== undefined) updateData.title = String(args.title).trim()
    if (args.content !== undefined) updateData.content = String(args.content)
    if (args.status !== undefined) updateData.status = String(args.status)
    if (args.priority !== undefined) updateData.priority = String(args.priority)
    if (args.assignee_id !== undefined) updateData.assigneeId = String(args.assignee_id)
    if (args.module_ids !== undefined) {
      updateData.moduleIds = Array.isArray(args.module_ids)
        ? args.module_ids.map(String)
        : []
    }
    if (args.tag_ids !== undefined) {
      updateData.tags = Array.isArray(args.tag_ids)
        ? args.tag_ids.map(String)
        : []
    }
    if (args.due_date !== undefined) updateData.dueDate = args.due_date as number
    if (args.progress !== undefined) updateData.progress = args.progress as number
    if (args.summary !== undefined) updateData.summary = String(args.summary)

    const updated = updateTask(taskId, updateData, currentUser._id)
    if (!updated) {
      k.response.json({ ok: false, error: '更新失败' })
    } else {
      const updatedTask = getTaskDetailById(taskId)
      try {
        const changes: Record<string, unknown> = {}
        if (args.title !== undefined) changes.title = args.title
        if (args.status !== undefined) changes.status = args.status
        if (args.priority !== undefined) changes.priority = args.priority
        if (args.assignee_id !== undefined) changes.assigneeId = args.assignee_id
        if (args.progress !== undefined) changes.progress = args.progress
        pushTaskUpdated(updatedTask, task.projectId, changes)
      } catch (wsErr) {
        k.logger.warning('WebSocket', `Failed to push task updated: ${wsErr}`)
      }
      if (updatedTask) {
        try {
          const notificationId = createMCPOperationNotification(
            currentUser._id,
            'task_updated',
            updatedTask.title,
            updatedTask._id,
            task.projectId
          )
          const notification = Notification.findById(notificationId)
          if (notification) {
            pushNotification(currentUser._id, notification, task.projectId)
          }
        } catch (notifErr) {
          k.logger.warning('Notification', `Failed to create MCP notification: ${notifErr}`)
        }
      }
      k.response.json({ ok: true, data: updatedTask })
    }
  }
}
