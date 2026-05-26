// @k-url /api/notification/{action}

import { success, error } from 'code/Utils/response'
import { getCurrentAuthUser } from 'code/Services/auth'
import { getUserInfo } from 'code/Services/user'
import {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead
} from 'code/Services/notification'

// GET /api/notification/list?page=1&size=20&type=&isRead=
k.api.get("list", () => {
  // 2. 获取参数
  const query = k.request.queryString as unknown as {
    page?: string
    size?: string
    type?: string
    isRead?: string
  }

  const page = parseInt(query?.page || '1')
  const size = parseInt(query?.size || '20')
  const type = query?.type as any
  const isRead = query?.isRead === 'true' ? true : query?.isRead === 'false' ? false : undefined

  try {
    // 获取当前用户
    const currentUser = getCurrentAuthUser()
    if (!currentUser) {
      return error('Unauthorized', 401)
    }
    // 获取通知列表
    const result = getUserNotifications(currentUser._id, {
      page,
      size,
      type,
      isRead
    })

    return success(result)

  } catch (err) {
    k.logger.error('GetNotificationsError', err instanceof Error ? err.message : String(err))
    return error('Failed to get notifications', 500, err)
  }
})

// GET /api/notification/unread-count
k.api.get("unread-count", () => {
  try {
    // 获取当前用户
    const currentUser = getCurrentAuthUser()
    if (!currentUser) {
      return error('Unauthorized', 401)
    }
    // 获取未读数量
    const count = getUnreadCount(currentUser._id)

    return success({ count })

  } catch (err) {
    k.logger.error('GetUnreadCountError', err instanceof Error ? err.message : String(err))
    return error('Failed to get unread count', 500, err)
  }
})

// PUT /api/notification/read
k.api.put("read", (body: any) => {
  // 2. 参数验证
  const { id } = body

  if (!id || typeof id !== 'string' || id.trim() === '') {
    return error('Invalid notification ID', 400)
  }

  try {
    // 获取当前用户
    const currentUser = getCurrentAuthUser()
    if (!currentUser) {
      return error('Unauthorized', 401)
    }
    // 标记为已读
    const updated = markAsRead(id, currentUser._id)

    if (!updated) {
      return error('Failed to mark notification as read', 500)
    }

    return success({ success: true }, 'Notification marked as read')

  } catch (err) {
    k.logger.error('MarkNotificationReadError', err instanceof Error ? err.message : String(err))
    return error('Failed to mark notification as read', 500, err)
  }
})

// PUT /api/notification/read-all
k.api.put("read-all", () => {
  try {
    // 获取当前用户
    const currentUser = getCurrentAuthUser()
    if (!currentUser) {
      return error('Unauthorized', 401)
    }
    // 标记所有为已读
    const count = markAllAsRead(currentUser._id)

    return success({ count }, `Marked ${count} notifications as read`)

  } catch (err) {
    k.logger.error('MarkAllNotificationsReadError', err instanceof Error ? err.message : String(err))
    return error('Failed to mark all notifications as read', 500, err)
  }
})
