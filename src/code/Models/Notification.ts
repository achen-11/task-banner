import { ksql, DataTypes } from 'module/k_sqlite'

/**
 * 通知模型
 */
export const Notification = ksql.define(
  'notifications',
  {
    userId: {
      type: DataTypes.String,
      required: true,
      index: true
    },
    type: {
      type: DataTypes.String,
      required: true, // task_assigned, task_updated, task_status_changed, mentioned, commented
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
      type: DataTypes.String,
      default: '',
      index: true
    },
    relatedCommentId: {
      type: DataTypes.String,
      default: ''
    },
    source: {
      type: DataTypes.String,
      default: 'human' // human | ai
    },
    metadata: {
      type: DataTypes.Object,
      default: () => ({})
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
