/**
 * 任务历史服务 - 处理任务历史和活动相关的业务逻辑
 */

import { TaskHistory } from 'code/Models/TaskHistory'
import { TaskComment } from 'code/Models/TaskComment'
import { getUserById, type UserInfo } from 'code/Services/user'

/**
 * 活动项接口（包含用户信息）
 */
export interface Activity {
  id: string
  type: 'comment' | 'field_change'
  userId: string
  user: {
    _id: string
    username: string
    displayName: string
    email: string
  } | null
  timestamp: number
  // comment 特有字段
  content?: string
  mentionedUsers?: string[]
  // field_change 特有字段
  field?: string
  oldValue?: string
  newValue?: string
  action?: string
  summary?: string
}

/**
 * 获取任务的活动历史（评论 + 字段变更）
 * @param taskId - 任务 ID
 * @returns 活动列表（按时间倒序）
 */
export function getTaskActivities(taskId: string): Activity[] {
  // 1. 获取任务评论
  const comments = TaskComment.findAll({ taskId })

  // 2. 获取任务历史
  const histories = TaskHistory.findAll({ taskId })

  // 3. 转换为统一的活动格式，并关联用户信息
  const activities: Activity[] = [
    // 处理评论
    ...comments.map(comment => {
      const user = getUserById(comment.userId)
      return {
        id: comment._id,
        type: 'comment' as const,
        userId: comment.userId,
        user: user ? {
          _id: user._id,
          username: user.username,
          displayName: user.displayName,
          email: user.email
        } : null,
        content: comment.content,
        mentionedUsers: comment.mentionedUsers || [],
        timestamp: comment.createdAt
      }
    }),
    // 处理字段变更
    ...histories.map(history => {
      const user = getUserById(history.userId)
      return {
        id: history._id,
        type: 'field_change' as const,
        userId: history.userId,
        user: user ? {
          _id: user._id,
          username: user.username,
          displayName: user.displayName,
          email: user.email
        } : null,
        field: history.field,
        oldValue: history.oldValue,
        newValue: history.newValue,
        action: history.action,
        summary: history.summary || '',
        timestamp: history.createdAt
      }
    })
  ]

  // 4. 按时间倒序排列（最新的在前）
  return activities.sort((a, b) => b.timestamp - a.timestamp)
}
