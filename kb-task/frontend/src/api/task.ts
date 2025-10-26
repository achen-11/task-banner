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
  content?: string
  mentionedUsers?: string[]
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

export default {
  getTaskList,
  getTaskDetail,
  createTask,
  updateTask,
  deleteTask,
  updateTaskOrder,
  getTaskActivities,
  addTaskComment
}
