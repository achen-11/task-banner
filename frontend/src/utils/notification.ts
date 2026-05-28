import type { Notification, NotificationType } from '@/types/notification'

export function isAiNotification(
  notification: Pick<Notification, 'title' | 'content' | 'source'>
): boolean {
  if (notification.source === 'ai') return true
  if (notification.source === 'human') return false

  const title = notification.title || ''
  const content = notification.content || ''
  return content.includes('AI 通过 MCP') || title.startsWith('AI ')
}

export function getNotificationSourceLabel(
  notification: Pick<Notification, 'title' | 'content' | 'source'>
): string {
  return isAiNotification(notification) ? 'AI' : '人工'
}

const ACTION_LABELS: Record<NotificationType, string> = {
  task_assigned: '分配任务',
  task_updated: '更新任务',
  task_status_changed: '状态变更',
  commented: '评论',
  mentioned: '@提醒'
}

export function getNotificationActionLabel(type: NotificationType): string {
  return ACTION_LABELS[type] ?? '通知'
}

/** 展开行标题：AI 分配任务 · 10:00 */
export function formatNotificationHeadline(
  notification: Notification,
  timeLabel: string
): string {
  const actor = isAiNotification(notification)
    ? 'AI'
    : notification.sender?.displayName || notification.sender?.username || '系统'
  return `${actor} ${getNotificationActionLabel(notification.type)} · ${timeLabel}`
}

export function formatPriorityShort(priority: string): string {
  const map: Record<string, string> = { high: 'P0', medium: 'P1', low: 'P2' }
  return map[priority] ?? priority.toUpperCase()
}

/** 消息行时间：10:00 / 昨天 10:00 */
export function formatNotificationTimeLabel(timestamp: number): string {
  const now = new Date()
  const d = new Date(timestamp)
  const time = d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const startOfMsgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const dayDiff = Math.floor((startOfToday - startOfMsgDay) / 86400000)
  if (dayDiff === 0) return time
  if (dayDiff === 1) return `昨天 ${time}`
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return `${date} ${time}`
}

export function formatTaskDueMeta(dueDate?: number | null): string | null {
  if (!dueDate) return null
  const d = new Date(dueDate)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day} 截止`
}
