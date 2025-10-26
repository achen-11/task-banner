// @k-url /api/task/{action}

import { success, error } from 'code/Utils/response'
import { getUserInfo } from 'code/Services/user'
import {
  createTask,
  getTaskById,
  getTaskDetailById,
  getProjectTasks,
  updateTask,
  deleteTask,
  batchUpdateTaskOrder
} from 'code/Services/task'
import { checkProjectPermission } from 'code/Services/project'

// GET /api/task/list?projectId=xxx&moduleId=&status=&priority=&assigneeId=&page=1&size=20
k.api.get("list", () => {
  // 1. 鉴权检查
  if (!k.account.isLogin) {
    return error('Unauthorized', 401)
  }

  // 2. 获取参数
  const query = k.request.queryString as unknown as {
    projectId: string
    moduleId?: string
    status?: string
    priority?: string
    assigneeId?: string
    page?: string
    size?: string
  }

  const projectId = query.projectId
  const page = parseInt(query?.page || '1')
  const size = parseInt(query?.size || '20')

  if (!projectId || projectId.trim() === '') {
    return error('Project ID is required', 400)
  }

  // 3. 获取任务列表
  try {
    // 获取当前用户
    const username = k.account.user.current.userName
    const currentUser = getUserInfo(username)

    // 权限检查（需要是项目成员）
    if (!checkProjectPermission(projectId, currentUser._id, 'member')) {
      return error('You do not have permission to view tasks in this project', 403)
    }

    // 构建筛选条件
    const filters: any = {}
    if (query.moduleId) filters.moduleId = query.moduleId
    if (query.status) filters.status = query.status
    if (query.priority) filters.priority = query.priority
    if (query.assigneeId) filters.assigneeId = query.assigneeId

    const tasks = getProjectTasks(projectId, filters)

    // 简单分页
    const total = tasks.length
    const start = (page - 1) * size
    const end = start + size
    const items = tasks.slice(start, end)

    return success({
      items,
      total,
      page,
      size
    })

  } catch (err) {
    k.logger.error('GetTaskListError', err instanceof Error ? err.message : String(err))
    return error('Failed to get tasks', 500, err)
  }
})

// GET /api/task/detail?id=xxx
k.api.get("detail", () => {
  // 1. 鉴权检查
  if (!k.account.isLogin) {
    return error('Unauthorized', 401)
  }

  // 2. 参数验证
  const query = k.request.queryString as unknown as { id: string }
  const taskId = query.id

  if (!taskId || taskId.trim() === '') {
    return error('Invalid task ID', 400)
  }

  // 3. 获取任务详情
  try {
    // 获取当前用户
    const username = k.account.user.current.userName
    const currentUser = getUserInfo(username)

    const task = getTaskDetailById(taskId)

    if (!task) {
      return error('Task not found', 404)
    }

    // 权限检查（需要是项目成员）
    if (!checkProjectPermission(task.projectId, currentUser._id, 'member')) {
      return error('You do not have permission to view this task', 403)
    }

    return success(task)

  } catch (err) {
    k.logger.error('GetTaskDetailError', err instanceof Error ? err.message : String(err))
    return error('Failed to get task', 500, err)
  }
})

// POST /api/task/create
k.api.post("create", (body: any) => {
  // 1. 鉴权检查
  if (!k.account.isLogin) {
    return error('Unauthorized', 401)
  }

  // 2. 参数验证
  const { projectId, moduleIds, title, content, status, priority, assigneeId, dueDate, progress, tags } = body

  if (!projectId || typeof projectId !== 'string' || projectId.trim() === '') {
    return error('Invalid project ID', 400)
  }

  if (!title || title.trim() === '') {
    return error('Task title is required', 400)
  }

  // 3. 创建任务
  try {
    // 获取当前用户
    const username = k.account.user.current.userName
    const currentUser = getUserInfo(username)

    // 权限检查（需要是项目成员）
    if (!checkProjectPermission(projectId, currentUser._id, 'member')) {
      return error('You do not have permission to create tasks in this project', 403)
    }

    const taskId = createTask({
      projectId,
      moduleIds: moduleIds || [],
      title: title.trim(),
      content,
      status,
      priority,
      assigneeId,
      creatorId: currentUser._id,
      dueDate,
      progress,
      tags: tags || []
    })

    // 获取创建的任务详情
    const task = getTaskDetailById(taskId)
    return success(task, 'Task created successfully')

  } catch (err) {
    k.logger.error('CreateTaskError', err instanceof Error ? err.message : String(err))
    return error('Failed to create task', 500, err)
  }
})

// PUT /api/task/update
k.api.put("update", (body: any) => {
  // 1. 鉴权检查
  if (!k.account.isLogin) {
    return error('Unauthorized', 401)
  }

  // 2. 参数验证
  const { id, title, content, status, priority, assigneeId, moduleIds, dueDate, progress, tags } = body

  if (!id || typeof id !== 'string' || id.trim() === '') {
    return error('Invalid task ID', 400)
  }

  const taskId = id

  // 3. 更新任务
  try {
    // 获取当前用户
    const username = k.account.user.current.userName
    const currentUser = getUserInfo(username)

    // 获取任务信息以检查权限
    const task = getTaskById(taskId)

    if (!task) {
      return error('Task not found', 404)
    }

    // 权限检查（需要是项目成员）
    if (!checkProjectPermission(task.projectId, currentUser._id, 'member')) {
      return error('You do not have permission to update this task', 403)
    }

    const updated = updateTask(taskId, {
      title: title?.trim(),
      content,
      status,
      priority,
      assigneeId,
      moduleIds,
      dueDate,
      progress,
      tags
    })

    if (!updated) {
      return error('Failed to update task', 500)
    }

    // 获取更新后的任务详情
    const updatedTask = getTaskDetailById(taskId)
    return success(updatedTask, 'Task updated successfully')

  } catch (err) {
    k.logger.error('UpdateTaskError', err instanceof Error ? err.message : String(err))
    return error('Failed to update task', 500, err)
  }
})

// DELETE /api/task/delete
k.api.delete("delete", (body: any) => {
  // 1. 鉴权检查
  if (!k.account.isLogin) {
    return error('Unauthorized', 401)
  }

  // 2. 参数验证
  const { id } = body

  if (!id || typeof id !== 'string' || id.trim() === '') {
    return error('Invalid task ID', 400)
  }

  const taskId = id

  // 3. 删除任务
  try {
    // 获取当前用户
    const username = k.account.user.current.userName
    const currentUser = getUserInfo(username)

    // 获取任务信息以检查权限
    const task = getTaskById(taskId)

    if (!task) {
      return error('Task not found', 404)
    }

    // 权限检查（需要是项目管理员或任务创建者）
    const isAdmin = checkProjectPermission(task.projectId, currentUser._id, 'admin')
    const isCreator = task.creatorId === currentUser._id

    if (!isAdmin && !isCreator) {
      return error('You do not have permission to delete this task', 403)
    }

    const deleted = deleteTask(taskId)

    if (!deleted) {
      return error('Failed to delete task', 500)
    }

    return success(null, 'Task deleted successfully')

  } catch (err) {
    k.logger.error('DeleteTaskError', err instanceof Error ? err.message : String(err))
    return error('Failed to delete task', 500, err)
  }
})

// PUT /api/task/updateOrder
k.api.put("updateOrder", (body: any) => {
  // 1. 鉴权检查
  if (!k.account.isLogin) {
    return error('Unauthorized', 401)
  }

  // 2. 参数验证
  const { tasks } = body

  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
    return error('Invalid tasks array', 400)
  }

  // 3. 批量更新任务顺序
  try {
    // 获取当前用户
    const username = k.account.user.current.userName
    const currentUser = getUserInfo(username)

    // 获取第一个任务以检查项目权限
    const firstTask = getTaskById(tasks[0].id)

    if (!firstTask) {
      return error('Task not found', 404)
    }

    // 权限检查（需要是项目成员）
    if (!checkProjectPermission(firstTask.projectId, currentUser._id, 'member')) {
      return error('You do not have permission to update tasks in this project', 403)
    }

    const updated = batchUpdateTaskOrder(tasks)

    if (!updated) {
      return error('Failed to update task order', 500)
    }

    return success(null, 'Task order updated successfully')

  } catch (err) {
    k.logger.error('UpdateTaskOrderError', err instanceof Error ? err.message : String(err))
    return error('Failed to update task order', 500, err)
  }
})
