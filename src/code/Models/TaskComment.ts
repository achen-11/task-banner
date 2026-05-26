import { ksql, DataTypes } from 'module/k_sqlite'

/**
 * 任务评论模型
 */
export const TaskComment = ksql.define(
  'task_comments',
  {
    taskId: {
      type: DataTypes.String,
      required: true,
      index: true
    },
    userId: {
      type: DataTypes.String,
      required: true,
      index: true
    },
    content: {
      type: DataTypes.String,
      required: true
    },
    summary: {
      type: DataTypes.String,
      default: '' // AI 评论通常很长，需要摘要字段
    },
    type: {
      type: DataTypes.String,
      default: 'user', // 'user' | 'ai_completion' | 'ai_revision' | 'system'
      index: true
    },
    mentionedUsers: {
      type: DataTypes.Array, // 自动转换为 JSON
      default: () => [] // [1, 3, 5] 被 @ 的用户 ID 列表
    },
    attachments: {
      type: DataTypes.Array, // 支持附件
      default: () => []
    },
    metadata: {
      type: DataTypes.Object, // JSON 格式存储额外信息
      default: () => ({})
    }
  },
  {
    timestamps: true, // createdAt, updatedAt
    softDelete: false,
    indexes: [
      {
        columns: ['taskId', 'createdAt'],
        name: 'task_comment_task_created_idx'
      },
      {
        columns: ['taskId', 'type'],
        name: 'task_comment_task_type_idx'
      },
      {
        columns: ['type', 'createdAt'],
        name: 'task_comment_type_created_idx'
      }
    ]
  }
)

export type TaskCommentType = typeof TaskComment.$type
