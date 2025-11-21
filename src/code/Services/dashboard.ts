/**
 * 仪表板服务 - 处理仪表板相关的业务逻辑
 */

import { Task, type TaskType } from 'code/Models/Task'
import { Project, type ProjectType } from 'code/Models/Project'
import { getUserProjects, getProjectDetailById } from 'code/Services/project'
import { getUserInfo } from 'code/Services/user'

/**
 * 仪表板统计数据接口
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
 * 任务趋势数据接口
 */
export interface TaskTrend {
  date: string              // 日期或时间标识
  created: number           // 新建任务数
  completed: number         // 完成任务数
}

/**
 * 简化的项目信息接口
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
 * 简化的任务信息接口
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
 * 获取仪表板统计数据
 * @param userId - 用户ID
 * @returns 统计数据
 */
export function getDashboardStats(userId: string): DashboardStats {
  // 获取用户的所有项目
  const userProjects = getUserProjects(userId)
  const projectIds = userProjects.map(project => project._id)

  // 获取所有相关任务
  const allTasks: TaskType[] = []
  for (const projectId of projectIds) {
    const tasks = Task.findAll({ projectId }) as TaskType[]
    allTasks.push(...tasks)
  }

  // 计算统计数据
  const stats: DashboardStats = {
    totalTasks: allTasks.length,
    todoTasks: allTasks.filter(task => task.status === 'todo').length,
    inProgressTasks: allTasks.filter(task => task.status === 'in_progress').length,
    completedTasks: allTasks.filter(task => task.status === 'completed').length,
    weeklyCompleted: getWeeklyCompletedCount(allTasks),
    totalProjects: userProjects.length,
    activeProjects: userProjects.filter(project => project.status === 'active').length
  }

  return stats
}

/**
 * 获取任务趋势数据
 * @param userId - 用户ID
 * @param period - 时间周期：'week' 或 'month'
 * @returns 趋势数据数组
 */
export function getTaskTrends(userId: string, period: 'week' | 'month'): TaskTrend[] {
  // 获取用户的所有项目
  const userProjects = getUserProjects(userId)
  const projectIds = userProjects.map(project => project._id)

  // 获取所有相关任务
  const allTasks: TaskType[] = []
  for (const projectId of projectIds) {
    const tasks = Task.findAll({ projectId }) as TaskType[]
    allTasks.push(...tasks)
  }

  if (period === 'week') {
    return getWeeklyTrends(allTasks)
  } else {
    return getMonthlyTrends(allTasks)
  }
}

/**
 * 获取最近访问的项目
 * @param userId - 用户ID
 * @param limit - 数量限制
 * @returns 最近项目列表
 */
export function getRecentProjects(userId: string, limit: number = 5): SimpleProject[] {
  // 获取用户的所有项目
  const userProjects = getUserProjects(userId)

  // 获取项目详情数据（包含统计信息）
  const projectDetails: SimpleProject[] = userProjects.map(project => {
    const detail = getProjectDetailById(project._id)
    return {
      _id: project._id,
      name: project.name,
      color: project.color,
      taskCount: detail?.taskCount || 0,
      completedTaskCount: detail?.completedTaskCount || 0,
      status: project.status as 'active' | 'completed' | 'paused',
      updatedAt: project.updatedAt
    }
  })

  // 按更新时间排序，获取最近的项目
  return projectDetails
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, limit)
}

/**
 * 获取今日待办任务
 * @param userId - 用户ID
 * @param limit - 数量限制
 * @returns 今日待办任务列表
 */
export function getTodayTasks(userId: string, limit: number = 10): SimpleTask[] {
  // 获取用户的所有项目
  const userProjects = getUserProjects(userId)
  const projectMap = new Map(userProjects.map(project => [project._id, project.name]))

  // 获取所有相关任务
  const allTasks: TaskType[] = []
  for (const project of userProjects) {
    const tasks = Task.findAll({ projectId: project._id }) as TaskType[]
    allTasks.push(...tasks)
  }

  // 获取今日日期范围（从当天0点到23:59:59）
  const today = new Date()
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
  const todayEnd = todayStart + 24 * 60 * 60 * 1000 - 1

  // 筛选今日待办任务（未完成的任务，包含今天创建或到期的任务）
  const todayTasks = allTasks
    .filter(task => {
      // 排除已完成的任务
      if (task.status === 'completed') return false

      // 今天创建的任务
      if (task.createdAt >= todayStart && task.createdAt <= todayEnd) return true

      // 今天到期的任务
      if (task.dueDate && task.dueDate >= todayStart && task.dueDate <= todayEnd) return true

      return false
    })
    .sort((a, b) => {
      // 按优先级和创建时间排序
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 0
      const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 0

      if (aPriority !== bPriority) {
        return bPriority - aPriority
      }

      return a.createdAt - b.createdAt
    })
    .slice(0, limit)
    .map(task => ({
      _id: task._id,
      title: task.title,
      projectName: projectMap.get(task.projectId) || 'Unknown Project',
      projectId: task.projectId,
      priority: task.priority as 'low' | 'medium' | 'high',
      status: task.status as 'todo' | 'in_progress' | 'completed',
      dueDate: task.dueDate,
      createdAt: task.createdAt
      // 注：assignee信息需要额外的关联查询，为简化暂时不包含
    }))

  return todayTasks
}

/**
 * 获取快速创建任务所需的项目列表
 * @param userId - 用户ID
 * @returns 简化的项目列表
 */
export function getQuickProjects(userId: string): Array<{
  _id: string
  name: string
  color: string
  taskCount: number
}> {
  const userProjects = getUserProjects(userId)

  return userProjects
    .filter(project => project.status === 'active') // 只返回活跃项目
    .map(project => {
      const detail = getProjectDetailById(project._id)
      return {
        _id: project._id,
        name: project.name,
        color: project.color,
        taskCount: detail?.taskCount || 0
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name)) // 按名称排序
}

/**
 * 计算本周完成的任务数
 * @param allTasks - 所有任务数组
 * @returns 本周完成的任务数
 */
function getWeeklyCompletedCount(allTasks: TaskType[]): number {
  const now = new Date()
  const today = now.getDay() // 0=Sunday, 1=Monday, etc.
  const currentDay = today === 0 ? 7 : today // 将Sunday转换为7

  // 计算本周一的开始时间
  const mondayStart = new Date(now)
  mondayStart.setDate(now.getDate() - currentDay + 1)
  mondayStart.setHours(0, 0, 0, 0)
  const mondayTime = mondayStart.getTime()

  // 计算本周结束时间
  const sundayEnd = mondayStart.getTime() + 7 * 24 * 60 * 60 * 1000

  // 统计本周完成的任务
  return allTasks.filter(task =>
    task.status === 'completed' &&
    task.updatedAt >= mondayTime &&
    task.updatedAt < sundayEnd
  ).length
}

/**
 * 获取周趋势数据
 * @param allTasks - 所有任务数组
 * @returns 周趋势数据
 */
function getWeeklyTrends(allTasks: TaskType[]): TaskTrend[] {
  const now = new Date()
  const today = now.getDay() // 0=Sunday, 1=Monday, etc.
  const currentDay = today === 0 ? 7 : today // 将Sunday转换为7

  // 生成一周的日期标签
  const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  const trends: TaskTrend[] = []

  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(now)
    dayDate.setDate(now.getDate() - currentDay + 1 + i)
    // 设置为当天的00:00:00，避免时间偏移问题
    dayDate.setHours(0, 0, 0, 0)
    const dayStart = dayDate.getTime()
    const dayEnd = dayStart + 24 * 60 * 60 * 1000

    const dayTrend: TaskTrend = {
      date: weekDays[i],
      created: allTasks.filter(task =>
        task.createdAt >= dayStart && task.createdAt < dayEnd
      ).length,
      completed: allTasks.filter(task =>
        task.status === 'completed' &&
        task.updatedAt >= dayStart && task.updatedAt < dayEnd
      ).length
    }

    trends.push(dayTrend)
  }

  return trends
}

/**
 * 获取月趋势数据
 * @param allTasks - 所有任务数组
 * @returns 月趋势数据
 */
function getMonthlyTrends(allTasks: TaskType[]): TaskTrend[] {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const trends: TaskTrend[] = []

  // 获取最近4周的数据
  for (let week = 0; week < 4; week++) {
    const weekDate = new Date(currentYear, currentMonth, now.getDate() - (3 - week) * 7)
    const weekStart = new Date(weekDate)
    weekStart.setDate(weekDate.getDate() - weekDate.getDay() + 1) // 周一
    weekStart.setHours(0, 0, 0, 0)

    const weekEnd = weekStart.getTime() + 7 * 24 * 60 * 60 * 1000

    const weekTrend: TaskTrend = {
      date: `第${week + 1}周`,
      created: allTasks.filter(task =>
        task.createdAt >= weekStart.getTime() && task.createdAt < weekEnd
      ).length,
      completed: allTasks.filter(task =>
        task.status === 'completed' &&
        task.updatedAt >= weekStart.getTime() && task.updatedAt < weekEnd
      ).length
    }

    trends.push(weekTrend)
  }

  return trends
}