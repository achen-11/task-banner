import { ksql, DataTypes } from 'module/k_sqlite'

/**
 * 任务模型
 */
export const Task = ksql.define(
  'tasks',
  {
    taskId: {
      type: DataTypes.String,
      required: true,
      unique: true,
      index: true,
      default: () => `task_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    },
    projectId: {
      type: DataTypes.String,
      required: true,
      ref: {
        tableName: 'projects',
        fieldName: '_id',
        onDelete: 'CASCADE'
      },
      index: true
    },
    moduleId: {
      type: DataTypes.String,
      default: '', // 空字符串表示未归属任何模块
      index: true
    },
    title: {
      type: DataTypes.String,
      required: true
    },
    content: {
      type: DataTypes.String,
      default: '' // Quill.js Delta JSON 格式
    },
    status: {
      type: DataTypes.String,
      default: 'todo', // todo, in_progress, completed, sent_to_ai, needs_optimization
      index: true
    },
    priority: {
      type: DataTypes.String,
      default: 'medium', // low, medium, high, urgent
      index: true
    },
    assigneeId: {
      type: DataTypes.String,
      default: '', // 空字符串表示未分配
      index: true
    },
    creatorId: {
      type: DataTypes.String,
      required: true,
      ref: {
        tableName: 'users',
        fieldName: '_id',
        onDelete: 'CASCADE'
      },
      index: true
    },
    dueDate: {
      type: DataTypes.Timestamp,
      default: 0 // 0 表示无截止日期
    },
    progress: {
      type: DataTypes.Number,
      default: 0 // 0-100
    },
    order: {
      type: DataTypes.Number,
      default: 0
    }
  },
  {
    timestamps: true,
    softDelete: false,
    indexes: [
      {
        columns: ['projectId', 'status', 'order'],
        name: 'task_project_status_order_idx'
      }
    ]
  }
)

export type TaskType = typeof Task.$type
