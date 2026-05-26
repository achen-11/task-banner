export const meta = {
  name: 'list_attachments',
  description: '获取任务或评论的附件列表',
  approvalRequired: false,
  tags: ['task-banner'],
  inputSchema: {
    type: 'object',
    properties: {
      related_type: {
        type: 'string',
        enum: ['task', 'comment'],
        description: '关联类型，默认 task'
      },
      related_id: {
        type: 'string',
        description: '关联 _id（任务 _id 或评论 _id）'
      },
      task_id: {
        type: 'string',
        description: '任务 _id（related_type=task 时可与 related_id 二选一）'
      }
    },
    additionalProperties: false
  }
} as const

import { getCurrentAuthUser } from 'code/Services/auth'
import { checkProjectPermission } from 'code/Services/project'
import { getTaskById } from 'code/Services/task'
import { getAttachmentsByRelation } from 'code/Services/attachment'
import { TaskComment } from 'code/Models/TaskComment'
import { parseMcpRequestArgs } from 'code/Utils/mcpArgs'

const args = parseMcpRequestArgs(k.request.body)
const currentUser = getCurrentAuthUser()

if (!currentUser) {
  k.response.json({ ok: false, error: 'Unauthorized' })
} else {
  const relatedType = (args.related_type ? String(args.related_type) : 'task') as 'task' | 'comment'
  const relatedId = String(args.related_id || args.task_id || '')

  if (!relatedId) {
    k.response.json({ ok: false, error: 'related_id 或 task_id 必填' })
  } else if (relatedType !== 'task' && relatedType !== 'comment') {
    k.response.json({ ok: false, error: 'related_type 必须为 task 或 comment' })
  } else {
    let projectId = ''

    if (relatedType === 'task') {
      const task = getTaskById(relatedId)
      if (!task) {
        k.response.json({ ok: false, error: '任务不存在' })
      } else if (!checkProjectPermission(task.projectId, currentUser._id, 'member')) {
        k.response.json({ ok: false, error: '无权限查看该任务附件' })
      } else {
        projectId = task.projectId
      }
    } else {
      const comment = TaskComment.findById(relatedId) as { taskId?: string } | null
      if (!comment?.taskId) {
        k.response.json({ ok: false, error: '评论不存在' })
      } else {
        const task = getTaskById(comment.taskId)
        if (!task) {
          k.response.json({ ok: false, error: '关联任务不存在' })
        } else if (!checkProjectPermission(task.projectId, currentUser._id, 'member')) {
          k.response.json({ ok: false, error: '无权限查看该评论附件' })
        } else {
          projectId = task.projectId
        }
      }
    }

    if (projectId) {
      const attachments = getAttachmentsByRelation(relatedType, relatedId)
      k.response.json({
        ok: true,
        data: {
          items: attachments,
          total: attachments.length,
          relatedType,
          relatedId
        }
      })
    }
  }
}
