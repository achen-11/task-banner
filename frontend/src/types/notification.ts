/**
 * 通知类型定义
 */

/**
 * 通知类型枚举
 */
export type NotificationType = 
  | 'task_assigned'      // 任务分配
  | 'task_updated'       // 任务内容更新
  | 'task_status_changed' // 任务状态变更
  | 'mentioned'         // @提醒
  | 'commented'         // 评论通知

/**
 * 通知信息
 */
export interface Notification {
  _id: string
  userId: string
  type: NotificationType
  title: string
  content: string
  relatedTaskId?: string
  relatedCommentId?: string
  source?: 'human' | 'ai'
  isRead: boolean
  createdAt: number
  // 前端扩展字段
  sender?: {
    displayName: string
    username: string
  }
  taskTitle?: string
  timeAgo?: string
}

/**
 * 通知列表查询参数
 */
export interface NotificationListParams {
  page?: number
  size?: number
  type?: NotificationType
  isRead?: boolean
}

/**
 * 通知列表响应
 */
export interface NotificationListResponse {
  items: Notification[]
  total: number
}

/**
 * 未读数量响应
 */
export interface UnreadCountResponse {
  count: number
}
