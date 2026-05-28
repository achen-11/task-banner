import type { Notification } from '@/types/notification'
import {
  extractTaskTitleFromNotification,
  getNotificationBody
} from '@/utils/notification'

export interface NotificationGroup {
  key: string
  relatedTaskId?: string
  title: string
  items: Notification[]
  unreadCount: number
  latestAt: number
  latestContent: string
}

export function extractTaskTitle(notification: Notification): string {
  return extractTaskTitleFromNotification(notification)
    || notification.title
    || '未关联任务'
}

export function groupNotificationsByTask(notifications: Notification[]): NotificationGroup[] {
  const map = new Map<string, Notification[]>()

  for (const notification of notifications) {
    const key = notification.relatedTaskId || `orphan:${notification._id}`
    const bucket = map.get(key)
    if (bucket) {
      bucket.push(notification)
    } else {
      map.set(key, [notification])
    }
  }

  const groups: NotificationGroup[] = []

  for (const [key, items] of map.entries()) {
    const sorted = [...items].sort((a, b) => b.createdAt - a.createdAt)
    const latest = sorted[0]!
    groups.push({
      key,
      relatedTaskId: latest.relatedTaskId,
      title: extractTaskTitle(latest),
      items: sorted,
      unreadCount: sorted.filter(item => !item.isRead).length,
      latestAt: latest.createdAt,
      latestContent: getNotificationBody(latest),
    })
  }

  return groups.sort((a, b) => b.latestAt - a.latestAt)
}

export function summarizeGroupActivity(group: NotificationGroup): string {
  const count = group.items.length
  if (count === 1) return group.latestContent
  return `${count} 条动态 · ${group.latestContent}`
}
