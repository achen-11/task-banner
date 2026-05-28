import type { Notification, NotificationType } from '@/types/notification'
import { resolveMcpClientFromMetadata } from '@/utils/mcpClient'

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
  notification: Pick<Notification, 'title' | 'content' | 'source' | 'metadata'>
): string {
  if (!isAiNotification(notification)) return '人工'
  return resolveMcpClientFromMetadata(notification.metadata).label
}

/** MCP/AI 通知展示名（默认 AI，可由 metadata.client 覆盖） */
export function getNotificationActorLabel(
  notification: Pick<Notification, 'title' | 'content' | 'source' | 'metadata' | 'sender'>
): string {
  if (!isAiNotification(notification)) {
    return notification.sender?.displayName || notification.sender?.username || '系统'
  }
  return resolveMcpClientFromMetadata(notification.metadata).label
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
/** 旧版通知正文：仅描述「谁评论了哪条任务」、无评论摘要 */
export function isCommentBoilerplateContent(content: string): boolean {
  const text = content.trim()
  if (!text) return true
  return /^(?:AI 通过 MCP )?.+评论了任务「[^」]+」\s*$/.test(text)
    || /^（无文字内容）· 任务「[^」]+」\s*$/.test(text)
}

/** 消息行主文案：评论类优先展示摘要/正文 */
export function getNotificationBody(notification: Notification): string {
  const content = (notification.content || '').trim()
  if (notification.type === 'commented' || notification.type === 'mentioned') {
    if (content && !isCommentBoilerplateContent(content)) {
      return content
    }
    return '打开任务查看评论详情'
  }
  return content
}

export function extractTaskTitleFromNotification(
  notification: Pick<Notification, 'title' | 'content'>
): string | null {
  const fromContent = notification.content.match(/「([^」]+)」/)
  if (fromContent?.[1]) return fromContent[1]
  const fromTitle = notification.title.match(/[·]\s*(.+)$/)
  if (fromTitle?.[1]) return fromTitle[1].trim()
  return null
}

export function formatNotificationHeadline(
  notification: Notification,
  timeLabel: string
): string {
  const actor = getNotificationActorLabel(notification)

  if (notification.type === 'commented') {
    const taskTitle = extractTaskTitleFromNotification(notification)
    if (taskTitle) {
      return `${actor} · ${taskTitle} · ${timeLabel}`
    }
    return `${actor} · ${timeLabel}`
  }

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
