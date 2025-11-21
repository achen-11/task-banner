/**
 * 通知 API
 */
import request from '@/utils/request'
import type {
  Notification,
  NotificationListParams,
  NotificationListResponse,
  UnreadCountResponse
} from '@/types/notification'

/**
 * 获取通知列表
 * @param params 查询参数
 */
export function getNotifications(params: NotificationListParams = {}): Promise<NotificationListResponse> {
  return request.get('/api/notification/list', {
    params
  })
}

/**
 * 获取未读通知数量
 */
export function getUnreadCount(): Promise<UnreadCountResponse> {
  return request.get('/api/notification/unread-count')
}

/**
 * 标记通知为已读
 * @param id 通知 ID
 */
export function markNotificationAsRead(id: string): Promise<void> {
  return request.put('/api/notification/read', { id })
}

/**
 * 标记所有通知为已读
 */
export function markAllNotificationsAsRead(): Promise<{ count: number }> {
  return request.put('/api/notification/read-all')
}
