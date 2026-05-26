/**
 * 用户 API
 */
import request from '@/utils/request'
import type {
  User,
  UpdateUserParams,
  UserListResponse
} from '@/types/user'
import type { Task } from '@/types/task'

export interface UserTaskFilters {
  projectId?: string
  projectIds?: string[]
  status?: string[]
  priority?: string
  search?: string
  page?: number
  pageSize?: number
  sortField?: string
  sortDirection?: string
}

export interface UserTasksStats {
  total: number
  todo: number
  inProgress: number
  completed: number
  review: number
  dueToday: number
  overdue: number
}

export interface TaskListResponse {
  items: Task[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  hasMore: boolean
}

/**
 * 获取用户列表（组织内的所有用户）
 */
export function getUserList(): Promise<UserListResponse> {
  return request.get('/api/user/list')
}

/**
 * 更新用户信息
 * @param data 更新数据
 */
export function updateUser(data: UpdateUserParams): Promise<User> {
  return request.put('/api/user/update', data)
}

/**
 * 获取用户任务列表
 */
export function getUserTasks(filters: UserTaskFilters = {}): Promise<TaskListResponse> {
  return request.get('/api/user/tasks', {
    params: filters
  })
}

/**
 * 获取用户任务统计
 */
export function getUserTasksStats(): Promise<UserTasksStats> {
  return request({
    url: '/api/user/tasks/stats',
    method: 'GET'
  })
}

/**
 * 快速创建任务
 */
export function createQuickTask(data: {
  title: string
  projectId: string
  priority?: string
  dueDate?: number
  summary?: string
}): Promise<Task> {
  return request({
    url: '/api/tasks/quick',
    method: 'POST',
    data
  })
}

export default {
  getUserList,
  updateUser,
  getUserTasks,
  getUserTasksStats,
  createQuickTask
}
