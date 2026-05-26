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

export function isHumanNotification(
  notification: Pick<Notification, 'title' | 'content' | 'source'>
): boolean {
  return !isAiNotification(notification)
}
