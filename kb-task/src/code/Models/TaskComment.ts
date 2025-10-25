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
      ref: {
        tableName: 'tasks',
        fieldName: '_id',
        onDelete: 'CASCADE'
      },
      index: true
    },
    userId: {
      type: DataTypes.String,
      required: true,
      ref: {
        tableName: 'users',
        fieldName: '_id',
        onDelete: 'CASCADE'
      },
      index: true
    },
    content: {
      type: DataTypes.String,
      required: true
    },
    mentionedUsers: {
      type: DataTypes.Array, // 自动转换为 JSON
      default: () => [] // [1, 3, 5] 被 @ 的用户 ID 列表
    }
  },
  {
    timestamps: true, // createdAt, updatedAt
    softDelete: false,
    indexes: [
      {
        columns: ['taskId', 'createdAt'],
        name: 'task_comment_task_created_idx'
      }
    ]
  }
)

export type TaskCommentType = typeof TaskComment.$type
