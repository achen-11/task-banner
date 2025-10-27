/**
 * 任务相关类型定义
 */

import type { Tag } from './tag'

export interface Task {
  _id: string
  displayId: number
  projectId: string
  title: string
  content?: string
  status: 'todo' | 'in_progress' | 'completed' | 'review'
  priority: 'low' | 'medium' | 'high'
  assigneeId?: string
  creatorId: string
  moduleIds?: string[]
  tagIds?: string[]
  dueDate?: number
  progress?: number
  summary?: string
  order: number
  createdAt: number
  updatedAt: number
  // 指派人用户信息（嵌套对象）
  assignee?: {
    displayName?: string
    username?: string
    email?: string
  }
  // 创建人用户信息（嵌套对象）
  creator?: {
    displayName?: string
    username?: string
    email?: string
  }
}

export interface TaskDetail extends Task {
  modules?: Array<{
    _id: string
    name: string
  }>
  tags?: Tag[]  // 使用完整的 Tag 对象
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
  status?: 'todo' | 'in_progress' | 'completed' | 'review'
  priority?: 'low' | 'medium' | 'high'
  assigneeId?: string
  moduleIds?: string[]
  tagIds?: string[]
  dueDate?: number
  progress?: number
  summary?: string
}

export interface UpdateTaskParams {
  id: string
  title?: string
  content?: string
  status?: 'todo' | 'in_progress' | 'completed' | 'review'
  priority?: 'low' | 'medium' | 'high'
  assigneeId?: string
  moduleIds?: string[]
  tagIds?: string[]
  dueDate?: number
  progress?: number
  summary?: string
}

export interface TaskListFilters {
  projectId: string
  moduleId?: string
  status?: string
  priority?: string
  assigneeId?: string
  page?: number
  size?: number
  sortField?: string
  sortDirection?: 'asc' | 'desc'
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
