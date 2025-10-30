/**
 * 任务 API
 */
import request from '@/utils/request'
import type {
  Task,
  TaskDetail,
  CreateTaskParams,
  UpdateTaskParams,
  TaskListFilters,
  TaskListResponse,
  UpdateOrderParams
} from '@/types/task'

/**
 * 获取任务列表
 * @param filters 筛选条件
 */
export function getTaskList(filters: TaskListFilters): Promise<TaskListResponse> {
  return request.get('/api/task/list', {
    params: filters
  })
}

/**
 * 获取任务详情
 * @param id 任务 ID
 */
export function getTaskDetail(id: string): Promise<TaskDetail> {
  return request.get('/api/task/detail', {
    params: { id }
  })
}

/**
 * 创建任务
 * @param data 任务数据
 */
export function createTask(data: CreateTaskParams): Promise<TaskDetail> {
  return request.post('/api/task/create', data)
}

/**
 * 更新任务
 * @param data 更新数据
 */
export function updateTask(data: UpdateTaskParams): Promise<TaskDetail> {
  return request.put('/api/task/update', data)
}

/**
 * 删除任务
 * @param id 任务 ID
 */
export function deleteTask(id: string): Promise<void> {
  return request.delete('/api/task/delete', {
    data: { id }
  })
}

/**
 * 批量更新任务顺序
 * @param data 任务顺序数据
 */
export function updateTaskOrder(data: UpdateOrderParams): Promise<void> {
  return request.put('/api/task/updateOrder', data)
}

/**
 * 任务活动类型
 */
export interface TaskActivity {
  id: string
  type: 'comment' | 'field_change' | 'system'
  userId?: string
  user?: {
    _id: string
    username?: string
    displayName?: string
    email?: string
  } | null
  content?: string
  summary?: string
  commentType?: string // 'user' | 'ai_completion' | 'ai_revision' | 'system'
  mentionedUsers?: string[]
  attachments?: Array<{
    _id: string
    relatedId: string
    name: string
    originalName: string
    size: number
    mimeType: string
    url: string
    thumbnailUrl?: string
    uploaderId: string
    projectId: string
    createdAt: number
    updatedAt: number
  }>
  metadata?: Record<string, any>
  field?: string
  oldValue?: string
  newValue?: string
  action?: string
  timestamp: number
}

/**
 * 获取任务活动历史
 * @param taskId 任务 ID
 */
export function getTaskActivities(taskId: string): Promise<TaskActivity[]> {
  return request.get('/api/task/activities', {
    params: { taskId }
  })
}

/**
 * 添加任务评论
 * @param taskId 任务 ID
 * @param content 评论内容
 * @param mentionedUsers 被提及的用户 ID 列表
 */
export function addTaskComment(taskId: string, content: string, mentionedUsers?: string[]): Promise<TaskActivity> {
  return request.post('/api/task/comment', {
    taskId,
    content,
    mentionedUsers
  })
}

/**
 * 编辑任务评论
 * @param commentId 评论 ID
 * @param content 评论内容
 * @param summary 评论摘要（可选）
 */
export function updateTaskComment(commentId: string, content: string, summary?: string): Promise<TaskActivity> {
  return request.put('/api/task/comment', {
    commentId,
    content,
    summary
  })
}

/**
 * 删除任务评论
 * @param commentId 评论 ID
 */
export function deleteTaskComment(commentId: string): Promise<{ deletedId: string }> {
  return request.delete('/api/task/comment', {
    params: { commentId }
  })
}

/**
 * 添加/移除评论反应
 * @param commentId 评论 ID
 * @param emoji 表情符号
 */
export function toggleCommentReaction(commentId: string, emoji: string): Promise<{
  action: 'added' | 'removed' | 'updated'
  emoji: string
  oldEmoji?: string
}> {
  return request.post('/api/task/reaction', {
    commentId,
    emoji
  })
}

/**
 * 获取评论反应列表
 * @param commentId 评论 ID
 */
export function getCommentReactions(commentId: string): Promise<{
  commentId: string
  reactions: Record<string, { count: number; users: any[] }>
  userReactions: string[]
}> {
  return request.get('/api/task/reactions', {
    params: { commentId }
  })
}

export default {
  getTaskList,
  getTaskDetail,
  createTask,
  updateTask,
  deleteTask,
  updateTaskOrder,
  getTaskActivities,
  addTaskComment,
  updateTaskComment,
  deleteTaskComment,
  toggleCommentReaction,
  getCommentReactions
}
