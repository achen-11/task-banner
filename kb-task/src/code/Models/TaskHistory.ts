import { ksql, DataTypes } from 'module/k_sqlite'

/**
 * 任务历史模型（用于记录任务的所有变更，实现迭代历史功能）
 */
export const TaskHistory = ksql.define(
  'task_history',
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
    field: {
      type: DataTypes.String,
      required: true // title, status, assignee, content, etc.
    },
    oldValue: {
      type: DataTypes.String,
      default: '' // JSON 格式
    },
    newValue: {
      type: DataTypes.String,
      default: '' // JSON 格式
    },
    action: {
      type: DataTypes.String,
      required: true // create, update, delete
    },
    summary: {
      type: DataTypes.String,
      default: '' // 任务摘要（20-50字的简短总结）
    },
    createdAt: {
      type: DataTypes.Timestamp,
      default: () => Date.now()
    }
  },
  {
    timestamps: false, // 只使用 createdAt
    softDelete: false,
    indexes: [
      {
        columns: ['taskId', 'createdAt'],
        name: 'task_history_task_created_idx'
      }
    ]
  }
)

export type TaskHistoryType = typeof TaskHistory.$type
