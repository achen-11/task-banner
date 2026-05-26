export const meta = {
  name: 'delete_task',
  description: '删除任务（需项目管理员或任务创建者权限）',
  approvalRequired: false,
  tags: ['task-banner'],
  inputSchema: {
    type: 'object',
    properties: {
      task_id: {
        type: 'string',
        description: '任务 _id'
      }
    },
    required: ['task_id'],
    additionalProperties: false
  }
} as const

import { getCurrentAuthUser } from 'code/Services/auth'
import { checkProjectPermission } from 'code/Services/project'
import { getTaskById, deleteTask } from 'code/Services/task'
import { pushTaskDeleted } from 'code/Services/websocket'
import { pushAiOperationNotification } from 'code/Services/notification'
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
  } else {
    const isAdmin = checkProjectPermission(task.projectId, currentUser._id, 'admin')
    const isCreator = task.creatorId === currentUser._id

    if (!isAdmin && !isCreator) {
      k.response.json({ ok: false, error: '无权限删除该任务' })
    } else {
      const projectId = task.projectId
      const taskTitle = task.title

      const deleted = deleteTask(taskId)
      if (!deleted) {
        k.response.json({ ok: false, error: '删除失败' })
      } else {
        try {
          pushTaskDeleted(taskId, projectId)
        } catch (wsErr) {
          k.logger.warning('WebSocket', `Failed to push task deleted: ${wsErr}`)
        }

        try {
          pushAiOperationNotification(
            currentUser._id,
            'task_deleted',
            taskTitle,
            taskId,
            projectId
          )
        } catch (notifErr) {
          k.logger.warning('Notification', `Failed to create MCP delete notification: ${notifErr}`)
        }

        k.response.json({
          ok: true,
          data: { task_id: taskId, deleted: true }
        })
      }
    }
  }
}
