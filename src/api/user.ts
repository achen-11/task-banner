// @k-url /api/user/{action}

import { success, error } from 'code/Utils/response'
import { getUserInfo, updateUserInfo, getAllUsers } from 'code/Services/user'
import { getUserTasksPaginated, getUserTasks } from 'code/Services/task'

// GET /api/user/list
k.api.get("list", () => {
  // 1. 鉴权检查
  if (!k.account.isLogin) {
    return error('Unauthorized', 401)
  }

  // 2. 获取组织内的用户列表
  try {
    // 从组织获取用户列表
    const organizationUsers = k.account.organization.current.users || []

    // 转换为前端需要的格式
    // 注意：这里不调用 getUserInfo，因为那会自动创建用户
    // 只有在真正添加成员时才创建用户记录
    const users = organizationUsers.map((user: any) => {
      return {
        _id: user.Id,  // 使用组织 ID
        username: user.UserName,
        email: user.Email || `${user.UserName}@example.com`,
        displayName: user.FirstName && user.LastName
          ? `${user.FirstName} ${user.LastName}`.trim()
          : user.UserName,
        avatar: '',
        isAdmin: user.IsAdmin || false,
        // 保留组织用户名，用于添加成员时自动注册
        organizationUsername: user.UserName
      }
    })

    return success({
      items: users,
      total: users.length
    })

  } catch (err) {
    k.logger.error('GetUserListError', err instanceof Error ? err.message : String(err))
    return error('Failed to get users', 500, err)
  }
})

// PUT /api/user/update
k.api.put("update", (body: any) => {
  // 1. 鉴权检查
  if (!k.account.isLogin) {
    return error('Unauthorized', 401)
  }

  // 2. 参数验证
  const { userId, displayName, email } = body

  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    return error('Invalid user ID', 400)
  }

  // 3. 更新用户信息
  try {
    // 获取当前用户
    const username = k.account.user.current.userName
    const currentUser = getUserInfo(username)

    // 权限检查：只能管理员或自己可以修改
    // 这里我们假设在项目成员 tab 中，管理员可以修改任何成员的信息
    // 如果需要更严格的权限控制，可以在这里添加

    const updated = updateUserInfo(userId, {
      displayName,
      email
    })

    if (!updated) {
      return error('Failed to update user', 500)
    }

    // 获取更新后的用户信息
    const userInfo = getUserInfo(username)
    return success(userInfo, 'User updated successfully')

  } catch (err) {
    k.logger.error('UpdateUserError', err instanceof Error ? err.message : String(err))
    return error(err instanceof Error ? err.message : 'Failed to update user', 400, err)
  }
})

// GET /api/user/tasks?projectId=&projectIds=&status=&priority=&search=&page=1&pageSize=20&sortField=updatedAt&sortDirection=desc
k.api.get("tasks", () => {
  // 1. 鉴权检查
  if (!k.account.isLogin) {
    return error('Unauthorized', 401)
  }

  // 2. 获取参数
  const query = k.request.queryString as unknown as {
    projectId?: string
    projectIds?: string
    status?: string | string[]
    priority?: string
    search?: string
    page?: string
    pageSize?: string
    sortField?: string
    sortDirection?: string
  }

  const page = parseInt(query?.page || '1')
  const pageSize = parseInt(query?.pageSize || '20')
  const sortField = query.sortField || undefined
  const sortDirection = query.sortDirection

  // 解析 projectIds（逗号分隔的字符串）
  let projectIds: string[] | undefined
  if (query.projectIds && query.projectIds.trim() !== '') {
    projectIds = query.projectIds.split(',').map(id => id.trim()).filter(id => id !== '')
  }

  // 3. 获取用户任务列表
  try {
    // 获取当前用户
    const username = k.account.user.current.userName
    const currentUser = getUserInfo(username)

    if (!currentUser) {
      return error('User not found', 404)
    }

    // 构建筛选条件
    const filters: any = {}
    if (query.projectId) filters.projectId = query.projectId
    if (projectIds && projectIds.length > 0) filters.projectIds = projectIds

    // 处理状态筛选，支持字符串、数组或逗号分隔的字符串
    if (query.status) {
      if (Array.isArray(query.status)) {
        // Element Plus多选发送的数组格式：['todo', 'review']
        filters.status = query.status
      } else if (typeof query.status === 'string') {
        if (query.status.includes(',')) {
          // 逗号分隔的字符串格式：'todo,review'
          filters.status = query.status.split(',').map(s => s.trim())
        } else {
          // 单个状态字符串：'todo'
          filters.status = [query.status.trim()]
        }
      }
    }

    if (query.priority) filters.priority = query.priority
    if (query.search) filters.search = query.search.trim()

    // 获取分页的任务列表
    const result = getUserTasksPaginated(
      currentUser._id,
      page,
      pageSize,
      filters,
      sortField,
      sortDirection
    )

    return success({
      items: result.items,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
      hasMore: page < result.totalPages
    })

  } catch (err) {
    k.logger.error('GetUserTasksError', err instanceof Error ? err.message : String(err))
    return error('Failed to get user tasks', 500, err)
  }
})

// GET /api/user/tasks/stats
k.api.get("tasks/stats", () => {
  // 1. 鉴权检查
  if (!k.account.isLogin) {
    return error('Unauthorized', 401)
  }

  // 2. 获取用户任务统计
  try {
    // 获取当前用户
    const username = k.account.user.current.userName
    const currentUser = getUserInfo(username)

    if (!currentUser) {
      return error('User not found', 404)
    }

    // 获取用户的所有任务（不分页）
    const allTasks = getUserTasks(currentUser._id)

    // 计算统计数据
    const stats = {
      total: allTasks.length,
      todo: allTasks.filter(task => task.status === 'todo').length,
      inProgress: allTasks.filter(task => task.status === 'in_progress').length, 
      completed: allTasks.filter(task => task.status === 'completed').length,
      review: allTasks.filter(task => task.status === 'review').length,
      dueToday: 0,
      overdue: 0
    }

    // 计算今日到期和逾期的任务
    const now = Date.now()
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)
    const todayEndTimestamp = Math.floor(todayEnd.getTime() / 1000)

    allTasks.forEach(task => {
      if (task.dueDate && task.dueDate > 0) {
        if (task.dueDate <= todayEndTimestamp && task.status !== 'completed') {
          stats.dueToday++
        }
        if (task.dueDate < now && task.status !== 'completed') {
          stats.overdue++
        }
      }
    })

    return success(stats)

  } catch (err) {
    k.logger.error('GetUserTasksStatsError', err instanceof Error ? err.message : String(err))
    return error('Failed to get user tasks stats', 500, err)
  }
})
