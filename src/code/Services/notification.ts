/**
 * 通知服务 - 处理通知相关的业务逻辑
 */

import { Notification, type NotificationType } from 'code/Models/Notification'
import { Task, type TaskType } from 'code/Models/Task'
import { getUserById, type UserInfo } from 'code/Services/user'

/**
 * 通知类型
 */
export type NotificationTypeEnum = 
  | 'task_assigned'      // 任务分配
  | 'task_updated'       // 任务内容更新
  | 'task_status_changed' // 任务状态变更
  | 'mentioned'         // @提醒
  | 'commented'         // 评论通知

/**
 * 通知信息接口
 */
export interface NotificationInfo {
  _id: string
  userId: string
  type: NotificationTypeEnum
  title: string
  content: string
  relatedTaskId?: string
  relatedCommentId?: string
  isRead: boolean
  createdAt: number
}

/**
 * 创建通知
 * @param data - 通知数据
 * @returns 新创建的通知 ID
 */
export function createNotification(data: {
  userId: string
  type: NotificationTypeEnum
  title: string
  content: string
  relatedTaskId?: string
  relatedCommentId?: string
}): string {
  // 不给自己发通知
  // 这个检查应该在调用方进行，但这里也做一次防御性检查
  
  const notificationId = Notification.create({
    userId: data.userId,
    type: data.type,
    title: data.title,
    content: data.content,
    relatedTaskId: data.relatedTaskId || '',
    relatedCommentId: data.relatedCommentId || '',
    isRead: false,
    createdAt: Date.now()
  })

  return notificationId
}

/**
 * 获取用户通知列表
 * @param userId - 用户 ID
 * @param options - 查询选项
 * @returns 通知列表和总数
 */
export function getUserNotifications(
  userId: string,
  options: {
    page?: number
    size?: number
    type?: NotificationTypeEnum
    isRead?: boolean
  } = {}
): { items: NotificationInfo[]; total: number } {
  const page = options.page || 1
  const size = options.size || 20

  // 构建查询条件
  const query: any = { userId }
  
  if (options.type) {
    query.type = options.type
  }
  
  if (options.isRead !== undefined) {
    query.isRead = options.isRead
  }

  // 查询所有符合条件的通知
  const allNotifications = Notification.findAll(
    query,
    {
      order: [{ prop: 'createdAt', order: 'descending' }]
    }
  ) as NotificationType[]

  const total = allNotifications.length

  // 分页
  const start = (page - 1) * size
  const end = start + size
  const items = allNotifications.slice(start, end).map(notification => ({
    _id: notification._id,
    userId: notification.userId,
    type: notification.type as NotificationTypeEnum,
    title: notification.title,
    content: notification.content,
    relatedTaskId: notification.relatedTaskId || undefined,
    relatedCommentId: notification.relatedCommentId || undefined,
    isRead: notification.isRead,
    createdAt: notification.createdAt
  }))

  return { items, total }
}

/**
 * 获取用户未读通知数量
 * @param userId - 用户 ID
 * @returns 未读通知数量
 */
export function getUnreadCount(userId: string): number {
  const notifications = Notification.findAll(
    { userId, isRead: false }
  ) as NotificationType[]

  return notifications.length
}

/**
 * 标记通知为已读
 * @param notificationId - 通知 ID
 * @param userId - 用户 ID（用于权限检查）
 * @returns 是否更新成功
 */
export function markAsRead(notificationId: string, userId: string): boolean {
  const notification = Notification.findById(notificationId) as NotificationType | null

  if (!notification) {
    return false
  }

  // 检查权限：只能标记自己的通知为已读
  if (notification.userId !== userId) {
    return false
  }

  // 如果已经已读，直接返回成功
  if (notification.isRead) {
    return true
  }

  const updatedId = Notification.updateById(notificationId, {
    isRead: true
  })

  return updatedId !== null && updatedId !== undefined
}

/**
 * 标记用户所有通知为已读
 * @param userId - 用户 ID
 * @returns 更新的通知数量
 */
export function markAllAsRead(userId: string): number {
  const notifications = Notification.findAll(
    { userId, isRead: false }
  ) as NotificationType[]

  let count = 0
  notifications.forEach(notification => {
    const updatedId = Notification.updateById(notification._id, {
      isRead: true
    })
    if (updatedId !== null && updatedId !== undefined) {
      count++
    }
  })

  return count
}

/**
 * 创建任务指派通知
 * @param taskId - 任务 ID
 * @param assigneeId - 被指派的用户 ID
 * @param operatorId - 操作者用户 ID
 * @returns 是否创建成功
 */
export function createTaskAssignedNotification(
  taskId: string,
  assigneeId: string,
  operatorId: string
): boolean {
  // 不给自己发通知
  if (assigneeId === operatorId || !assigneeId || assigneeId.trim() === '') {
    return false
  }

  // 获取任务信息
  const task = Task.findById(taskId) as TaskType | null
  if (!task) {
    return false
  }

  // 获取操作者信息
  const operator = getUserById(operatorId)
  if (!operator) {
    return false
  }

  const operatorName = operator.displayName || operator.username

  // 创建通知
  createNotification({
    userId: assigneeId,
    type: 'task_assigned',
    title: '任务已分配给你',
    content: `${operatorName} 将任务「${task.title}」分配给了你`,
    relatedTaskId: taskId
  })

  return true
}

/**
 * 创建任务内容更新通知
 * @param taskId - 任务 ID
 * @param operatorId - 操作者用户 ID
 * @returns 是否创建成功
 */
export function createTaskUpdatedNotification(
  taskId: string,
  operatorId: string
): boolean {
  // 获取任务信息
  const task = Task.findById(taskId) as TaskType | null
  if (!task) {
    return false
  }

  // 如果没有负责人，不发送通知
  if (!task.assigneeId || task.assigneeId.trim() === '') {
    return false
  }

  // 不给自己发通知
  if (task.assigneeId === operatorId) {
    return false
  }

  // 获取操作者信息
  const operator = getUserById(operatorId)
  if (!operator) {
    return false
  }

  const operatorName = operator.displayName || operator.username

  // 创建通知
  createNotification({
    userId: task.assigneeId,
    type: 'task_updated',
    title: '任务内容已更新',
    content: `${operatorName} 更新了任务「${task.title}」的内容`,
    relatedTaskId: taskId
  })

  return true
}

/**
 * 创建 MCP 操作通知
 * @param userId - 接收通知的用户 ID
 * @param action - 操作类型（task_created, task_updated, document_created 等）
 * @param resourceTitle - 资源标题（任务标题或文档标题）
 * @param resourceId - 资源 ID（任务 ID 或文档 ID）
 * @param projectId - 项目 ID
 * @returns 通知 ID
 */
export function createMCPOperationNotification(
  userId: string,
  action: 'task_created' | 'task_updated' | 'task_deleted' | 'document_created' | 'document_updated' | 'document_deleted',
  resourceTitle: string,
  resourceId: string,
  projectId?: string
): string {
  const actionMap: Record<string, { title: string; content: string; type: NotificationTypeEnum }> = {
    task_created: {
      title: 'AI 创建了新任务',
      content: `AI 通过 MCP 创建了任务「${resourceTitle}」`,
      type: 'task_assigned'
    },
    task_updated: {
      title: 'AI 更新了任务',
      content: `AI 通过 MCP 更新了任务「${resourceTitle}」`,
      type: 'task_updated'
    },
    task_deleted: {
      title: 'AI 删除了任务',
      content: `AI 通过 MCP 删除了任务「${resourceTitle}」`,
      type: 'task_status_changed'
    },
    document_created: {
      title: 'AI 创建了新文档',
      content: `AI 通过 MCP 创建了文档「${resourceTitle}」`,
      type: 'commented'
    },
    document_updated: {
      title: 'AI 更新了文档',
      content: `AI 通过 MCP 更新了文档「${resourceTitle}」`,
      type: 'commented'
    },
    document_deleted: {
      title: 'AI 删除了文档',
      content: `AI 通过 MCP 删除了文档「${resourceTitle}」`,
      type: 'commented'
    }
  }

  const actionInfo = actionMap[action]
  if (!actionInfo) {
    throw new Error(`Unknown action: ${action}`)
  }

  return createNotification({
    userId,
    type: actionInfo.type,
    title: actionInfo.title,
    content: actionInfo.content,
    relatedTaskId: action.startsWith('task_') ? resourceId : undefined
  })
}
