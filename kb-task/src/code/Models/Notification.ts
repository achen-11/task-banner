import { ksql, DataTypes } from 'module/k_sqlite'

/**
 * 通知模型
 */
export const Notification = ksql.define(
  'notifications',
  {
    id: {
      type: DataTypes.Number,
      primaryKey: true,
      autoincrement: true
    },
    userId: {
      type: DataTypes.Number,
      required: true,
      ref: {
        tableName: 'users',
        fieldName: 'id',
        onDelete: 'CASCADE'
      },
      index: true
    },
    type: {
      type: DataTypes.String,
      required: true, // task_assigned, task_status_changed, mentioned, commented
      index: true
    },
    title: {
      type: DataTypes.String,
      required: true
    },
    content: {
      type: DataTypes.String,
      default: ''
    },
    relatedTaskId: {
      type: DataTypes.Number,
      default: 0,
      index: true
    },
    relatedCommentId: {
      type: DataTypes.Number,
      default: 0
    },
    isRead: {
      type: DataTypes.Boolean,
      default: false
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
        columns: ['userId', 'isRead'],
        name: 'notification_user_read_idx'
      }
    ]
  }
)

export type NotificationType = typeof Notification.$type
