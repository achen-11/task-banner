import type { Notification } from '@/types/notification'

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
