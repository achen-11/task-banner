export const meta = {
  name: 'list_comments',
  description: '获取任务评论列表，支持分页与类型筛选',
  approvalRequired: false,
  tags: ['task-banner'],
  inputSchema: {
    type: 'object',
    properties: {
      task_id: {
        type: 'string',
        description: '任务 _id'
      },
      page: {
        type: 'integer',
        description: '页码，默认 1'
      },
      limit: {
        type: 'integer',
        description: '每页条数，默认 20'
      },
      type: {
        type: 'string',
        enum: ['all', 'user', 'ai_completion', 'ai_revision', 'system'],
        description: '评论类型筛选，默认 all'
      }
    },
    required: ['task_id'],
    additionalProperties: false
  }
} as const

import { getCurrentAuthUser } from 'code/Services/auth'
import { checkProjectPermission } from 'code/Services/project'
import { getTaskById } from 'code/Services/task'
import { getUserById } from 'code/Services/user'
import { TaskComment } from 'code/Models/TaskComment'
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
    k.response.json({ ok: false, error: '无权限查看该任务评论' })
  } else {
    const pageNum = Math.max(1, Number(args.page) || 1)
    const sizeNum = Math.min(100, Math.max(1, Number(args.limit) || 20))
    const commentType = args.type ? String(args.type) : 'all'

    const whereCondition: Record<string, string> = { taskId }
    if (commentType !== 'all') {
      whereCondition.type = commentType
    }

    const comments = TaskComment.findAll(whereCondition, {
      order: [{ prop: 'createdAt', order: 'descending' }]
    })

    const total = comments.length
    const start = (pageNum - 1) * sizeNum
    const end = start + sizeNum
    const items = comments.slice(start, end).map(comment => {
      const user = getUserById(comment.userId)
      return {
        _id: comment._id,
        taskId: comment.taskId,
        type: comment.type,
        userId: comment.userId,
        user: user
          ? {
              _id: user._id,
              username: user.username,
              displayName: user.displayName,
              email: user.email
            }
          : null,
        content: comment.content,
        summary: comment.summary,
        mentionedUsers: comment.mentionedUsers,
        attachments: comment.attachments,
        metadata: comment.metadata,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt
      }
    })

    k.response.json({
      ok: true,
      data: {
        items,
        total,
        page: pageNum,
        limit: sizeNum,
        hasMore: end < total
      }
    })
  }
}
