/**
 * 仪表板 API
 */
import request from '@/utils/request'

/**
 * 仪表板统计数据
 */
export interface DashboardStats {
  totalTasks: number          // 总任务数
  todoTasks: number          // 待办任务数
  inProgressTasks: number   // 进行中任务数
  completedTasks: number    // 已完成任务数
  weeklyCompleted: number    // 本周完成任务数
  totalProjects: number     // 总项目数
  activeProjects: number    // 活跃项目数
}

/**
 * 任务趋势数据
 */
export interface TaskTrend {
  date: string              // 日期
  created: number           // 新建任务数
  completed: number         // 完成任务数
}

/**
 * 简化的项目信息
 */
export interface SimpleProject {
  _id: string
  name: string
  color: string
  taskCount: number
  completedTaskCount: number
  status: 'active' | 'completed' | 'paused'
  updatedAt: number
}

/**
 * 简化的任务信息
 */
export interface SimpleTask {
  _id: string
  title: string
  projectName: string
  projectId: string
  priority: 'low' | 'medium' | 'high'
  status: 'todo' | 'in_progress' | 'completed'
  dueDate?: number
  createdAt: number
  assignee?: {
    displayName?: string
  }
}

/**
 * 仪表板数据响应
 */
export interface DashboardData {
  stats: DashboardStats
  taskTrends: TaskTrend[]     // 任务趋势数据（支持周、月视图）
  recentProjects: SimpleProject[]
  todayTasks: SimpleTask[]
}

/**
 * 获取仪表板数据
 * @param period 趋势数据周期：'week' | 'month'
 */
export function getDashboardData(period: 'week' | 'month' = 'week'): Promise<DashboardData> {
  return request.get('/api/dashboard/data', {
    params: { period }
  })
}

/**
 * 获取仪表板统计数据
 */
export function getDashboardStats(): Promise<DashboardStats> {
  return request.get('/api/dashboard/stats')
}

/**
 * 获取任务趋势数据
 * @param period 周期：'week' | 'month'
 */
export function getTaskTrends(period: 'week' | 'month' = 'week'): Promise<TaskTrend[]> {
  return request.get('/api/dashboard/trends', {
    params: { period }
  })
}

/**
 * 获取最近访问的项目
 * @param limit 数量限制
 */
export function getRecentProjects(limit: number = 5): Promise<SimpleProject[]> {
  return request.get('/api/dashboard/recent-projects', {
    params: { limit }
  })
}

/**
 * 获取今日待办任务
 * @param limit 数量限制
 */
export function getTodayTasks(limit: number = 10): Promise<SimpleTask[]> {
  return request.get('/api/dashboard/today-tasks', {
    params: { limit }
  })
}

/**
 * 获取快速创建任务所需的简要项目列表
 */
export interface QuickProject {
  _id: string
  name: string
  color: string
  taskCount: number
}

export function getQuickProjects(): Promise<QuickProject[]> {
  return request.get('/api/dashboard/quick-projects')
}

export default {
  getDashboardData,
  getDashboardStats,
  getTaskTrends,
  getRecentProjects,
  getTodayTasks,
  getQuickProjects
}