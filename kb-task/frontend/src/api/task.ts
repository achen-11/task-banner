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

export default {
  getTaskList,
  getTaskDetail,
  createTask,
  updateTask,
  deleteTask,
  updateTaskOrder
}
