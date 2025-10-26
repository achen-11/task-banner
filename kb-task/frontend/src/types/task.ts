/**
 * 任务相关类型定义
 */

export interface Task {
  _id: string
  displayId: number
  projectId: string
  title: string
  content?: string
  status: 'todo' | 'in_progress' | 'completed'
  priority: 'low' | 'medium' | 'high'
  assigneeId?: string
  creatorId: string
  moduleIds?: string[]
  tagIds?: string[]
  dueDate?: number
  progress?: number
  order: number
  createdAt: number
  updatedAt: number
}

export interface TaskDetail extends Task {
  modules?: Array<{
    _id: string
    name: string
  }>
  tags?: Array<{
    _id: string
    name: string
  }>
  creator?: {
    _id: string
    username: string
  }
  assignee?: {
    _id: string
    username: string
  }
}

export interface CreateTaskParams {
  projectId: string
  title: string
  content?: string
  status?: 'todo' | 'in_progress' | 'completed'
  priority?: 'low' | 'medium' | 'high'
  assigneeId?: string
  moduleIds?: string[]
  tagIds?: string[]
  dueDate?: number
  progress?: number
}

export interface UpdateTaskParams {
  id: string
  title?: string
  content?: string
  status?: 'todo' | 'in_progress' | 'completed'
  priority?: 'low' | 'medium' | 'high'
  assigneeId?: string
  moduleIds?: string[]
  tagIds?: string[]
  dueDate?: number
  progress?: number
}

export interface TaskListFilters {
  projectId: string
  moduleId?: string
  status?: string
  priority?: string
  assigneeId?: string
  page?: number
  size?: number
}

export interface TaskListResponse {
  items: Task[]
  total: number
  page: number
  size: number
}

export interface UpdateOrderParams {
  tasks: Array<{
    id: string
    order: number
  }>
}
