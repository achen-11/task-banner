// @k-url /api/dashboard/{action}

import { success, error } from 'code/Utils/response'
import { getCurrentAuthUser } from 'code/Services/auth'
import { getUserInfo } from 'code/Services/user'
import {
  getDashboardStats,
  getTaskTrends,
  getRecentProjects,
  getTodayTasks,
  getQuickProjects,
  type DashboardStats,
  type TaskTrend,
  type SimpleProject,
  type SimpleTask
} from 'code/Services/dashboard'

// GET /api/dashboard/data?period=week
k.api.get("data", () => {
  // 2. 获取查询参数
  const query = k.request.queryString as unknown as { period?: string }
  const period = query.period === 'month' ? 'month' : 'week'

  // 3. 获取仪表板数据
  try {
    // 获取当前用户
    const currentUser = getCurrentAuthUser()
    if (!currentUser) {
      return error('Unauthorized', 401)
    }
    // 同步获取所有数据
    const stats = getDashboardStats(currentUser._id)
    const taskTrends = getTaskTrends(currentUser._id, period)
    const recentProjects = getRecentProjects(currentUser._id)
    const todayTasks = getTodayTasks(currentUser._id)

    const dashboardData = {
      stats,
      taskTrends,
      recentProjects,
      todayTasks
    }

    return success(dashboardData)

  } catch (err) {
    k.logger.error('GetDashboardDataError', err instanceof Error ? err.message : String(err))
    return error('Failed to get dashboard data', 500, err)
  }
})

// GET /api/dashboard/stats
k.api.get("stats", () => {
  // 2. 获取统计数据
  try {
    // 获取当前用户
    const currentUser = getCurrentAuthUser()
    if (!currentUser) {
      return error('Unauthorized', 401)
    }
    const stats = getDashboardStats(currentUser._id)

    return success(stats)

  } catch (err) {
    k.logger.error('GetDashboardStatsError', err instanceof Error ? err.message : String(err))
    return error('Failed to get dashboard stats', 500, err)
  }
})

// GET /api/dashboard/trends?period=week
k.api.get("trends", () => {
  // 2. 获取查询参数
  const query = k.request.queryString as unknown as { period?: string }
  const period = query.period === 'month' ? 'month' : 'week'

  // 3. 获取趋势数据
  try {
    // 获取当前用户
    const currentUser = getCurrentAuthUser()
    if (!currentUser) {
      return error('Unauthorized', 401)
    }
    const taskTrends = getTaskTrends(currentUser._id, period)

    return success(taskTrends)

  } catch (err) {
    k.logger.error('GetTaskTrendsError', err instanceof Error ? err.message : String(err))
    return error('Failed to get task trends', 500, err)
  }
})

// GET /api/dashboard/recent-projects?limit=5
k.api.get("recentProjects", () => {
  // 2. 获取查询参数
  const query = k.request.queryString as unknown as { limit?: string }
  const limit = parseInt(query.limit || '5') 

  // 3. 获取最近项目
  try {
    // 获取当前用户
    const currentUser = getCurrentAuthUser()
    if (!currentUser) {
      return error('Unauthorized', 401)
    }
    const recentProjects = getRecentProjects(currentUser._id, limit)

    return success(recentProjects)

  } catch (err) {
    k.logger.error('GetRecentProjectsError', err instanceof Error ? err.message : String(err))
    return error('Failed to get recent projects', 500, err)
  }
})

// GET /api/dashboard/today-tasks?limit=10
k.api.get("todayTasks", () => {
  // 2. 获取查询参数
  const query = k.request.queryString as unknown as { limit?: string }
  const limit = parseInt(query.limit || '10') 

  // 3. 获取今日待办任务
  try {
    // 获取当前用户
    const currentUser = getCurrentAuthUser()
    if (!currentUser) {
      return error('Unauthorized', 401)
    }
    const todayTasks = getTodayTasks(currentUser._id, limit)

    return success(todayTasks)

  } catch (err) {
    k.logger.error('GetTodayTasksError', err instanceof Error ? err.message : String(err))
    return error('Failed to get today tasks', 500, err)
  }
})

// GET /api/dashboard/quick-projects
k.api.get("quickProjects", () => {
  // 2. 获取快速项目列表
  try {
    // 获取当前用户
    const currentUser = getCurrentAuthUser()
    if (!currentUser) {
      return error('Unauthorized', 401)
    }
    const quickProjects = getQuickProjects(currentUser._id)

    return success(quickProjects)

  } catch (err) {
    k.logger.error('GetQuickProjectsError', err instanceof Error ? err.message : String(err))
    return error('Failed to get quick projects', 500, err)
  }
})