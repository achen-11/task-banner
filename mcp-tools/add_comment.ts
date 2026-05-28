export const meta = {
  name: 'add_comment',
  description: '为指定任务添加评论；需先通过 get_task 或 list_tasks 获取 task_id',
  approvalRequired: false,
  tags: ['task-banner'],
  inputSchema: {
    type: 'object',
    properties: {
      task_id: {
        type: 'string',
        description: '任务 _id'
      },
      content: {
        type: 'string',
        description: '评论内容，支持 Markdown'
      },
      summary: {
        type: 'string',
        description: '评论摘要（20-50 字）；长内容建议填写'
      },
      type: {
        type: 'string',
        enum: ['user', 'ai_completion', 'ai_revision', 'system'],
        description: '评论类型，MCP 调用默认 ai_completion'
      },
      mentioned_user_ids: {
        type: 'array',
        items: { type: 'string' },
        description: '被 @ 的用户 _id 列表'
      }
    },
    required: ['task_id', 'content'],
    additionalProperties: false
  }
} as const

import { getCurrentAuthUser } from 'code/Services/auth'
import { checkProjectPermission } from 'code/Services/project'
import { getTaskById } from 'code/Services/task'
import { TaskComment } from 'code/Models/TaskComment'
import { pushCommentCreated } from 'code/Services/websocket'
import { buildCommentPreview, pushAiOperationNotification } from 'code/Services/notification'
import { parseMcpRequestArgs } from 'code/Utils/mcpArgs'
import { buildMcpMetadata } from 'code/Utils/mcpClient'

const args = parseMcpRequestArgs(k.request.body)
const currentUser = getCurrentAuthUser()

if (!currentUser) {
  k.response.json({ ok: false, error: 'Unauthorized' })
} else if (!args.task_id) {
  k.response.json({ ok: false, error: 'task_id 必填' })
} else if (!args.content || !String(args.content).trim()) {
  k.response.json({ ok: false, error: 'content 必填' })
} else {
  const taskId = String(args.task_id)
  const content = String(args.content).trim()
  const task = getTaskById(taskId)

  if (!task) {
    k.response.json({ ok: false, error: '任务不存在' })
  } else if (!checkProjectPermission(task.projectId, currentUser._id, 'member')) {
    k.response.json({ ok: false, error: '无权限评论该任务' })
  } else {
    let summary = args.summary ? String(args.summary) : ''
    if (!summary && content.length > 200) {
      summary = content.substring(0, 197) + '...'
    }

    const mentionedUsers = Array.isArray(args.mentioned_user_ids)
      ? args.mentioned_user_ids.map(String)
      : []

    const commentType = args.type ? String(args.type) : 'ai_completion'

    const commentId = TaskComment.create({
      taskId,
      userId: currentUser._id,
      content,
      summary,
      type: commentType,
      mentionedUsers,
      attachments: [],
      metadata: buildMcpMetadata()
    })

    const comment = TaskComment.findById(commentId)
    if (!comment) {
      k.response.json({ ok: false, error: '评论创建失败' })
    } else {
      try {
        pushCommentCreated(
          {
            _id: comment._id,
            id: comment._id,
            type: comment.type,
            userId: comment.userId,
            content: comment.content,
            summary: comment.summary,
            mentionedUsers: comment.mentionedUsers
          },
          taskId,
          task.projectId
        )
      } catch (wsErr) {
        k.logger.warning('WebSocket', `Failed to push comment created: ${wsErr}`)
      }

      try {
        pushAiOperationNotification(
          currentUser._id,
          'task_commented',
          task.title,
          taskId,
          task.projectId,
          {
            commentId: comment._id,
            commentPreview: buildCommentPreview(comment.summary, comment.content)
          }
        )
      } catch (notifErr) {
        k.logger.warning('Notification', `Failed to create MCP comment notification: ${notifErr}`)
      }

      k.response.json({
        ok: true,
        data: {
          _id: comment._id,
          taskId: comment.taskId,
          type: comment.type,
          userId: comment.userId,
          user: {
            _id: currentUser._id,
            username: currentUser.username,
            displayName: currentUser.displayName,
            email: currentUser.email,
            avatar: currentUser.avatar
          },
          content: comment.content,
          summary: comment.summary,
          mentionedUsers: comment.mentionedUsers,
          attachments: comment.attachments,
          metadata: comment.metadata,
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt
        }
      })
    }
  }
}
