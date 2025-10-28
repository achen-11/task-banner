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
import { getTaskActivities } from 'code/Services/taskHistory'
import { TaskComment } from 'code/Models/TaskComment'

// GET /api/task/list?projectId=xxx&moduleId=&status=&priority=&assigneeId=&page=1&size=20&sortField=&sortDirection=
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
    sortField?: string
    sortDirection?: string
  }

  const projectId = query.projectId
  const page = parseInt(query?.page || '1')
  const size = parseInt(query?.size || '20')
  // 如果 sortField 为空，传递 undefined 让 Service 层使用默认排序
  const sortField = query.sortField || undefined
  const sortDirection = query.sortDirection

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

    // 获取任务列表（带排序和用户信息）
    const tasks = getProjectTasks(projectId, filters, sortField, sortDirection)

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
  const { projectId, moduleIds, title, content, status, priority, assigneeId, dueDate, progress, tags, tagIds, summary } = body

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

    // 处理标签字段：支持 tagIds（前端）和 tags（后端）
    const finalTags = tagIds !== undefined ? tagIds : tags

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
      tags: finalTags || [],
      summary
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
  const { id, title, content, status, priority, assigneeId, moduleIds, dueDate, progress, tags, tagIds, summary } = body

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

    // 处理标签字段：支持 tagIds（前端）和 tags（后端）
    const finalTags = tagIds !== undefined ? tagIds : tags

    const updated = updateTask(taskId, {
      title: title?.trim(),
      content,
      status,
      priority,
      assigneeId,
      moduleIds,
      dueDate,
      progress,
      tags: finalTags,
      summary
    }, currentUser._id)

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

// GET /api/task/activities?taskId=xxx
k.api.get("activities", () => {
  // 1. 鉴权检查
  if (!k.account.isLogin) {
    return error('Unauthorized', 401)
  }

  // 2. 参数验证
  const query = k.request.queryString as unknown as { taskId: string }
  const taskId = query.taskId

  if (!taskId || taskId.trim() === '') {
    return error('Invalid task ID', 400)
  }

  // 3. 获取任务活动历史
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
      return error('You do not have permission to view this task', 403)
    }

    // 调用 Service 层获取活动历史（包含用户信息）
    const activities = getTaskActivities(taskId)

    return success(activities)

  } catch (err) {
    k.logger.error('GetTaskActivitiesError', err instanceof Error ? err.message : String(err))
    return error('Failed to get task activities', 500, err)
  }
})

// POST /api/task/comment
k.api.post("comment", (body: any) => {
  // 1. 鉴权检查
  if (!k.account.isLogin) {
    return error('Unauthorized', 401)
  }

  // 2. 参数验证
  const { taskId, content, summary, type, mentionedUsers, attachments, metadata } = body

  if (!taskId || typeof taskId !== 'string' || taskId.trim() === '') {
    return error('Invalid task ID', 400)
  }

  if (!content || content.trim() === '') {
    return error('Comment content is required', 400)
  }

  // 3. 创建评论
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
      return error('You do not have permission to comment on this task', 403)
    }

    const commentId = TaskComment.create({
      taskId,
      userId: currentUser._id,
      content: content.trim(),
      summary: summary || '',
      type: type || 'user',
      mentionedUsers: mentionedUsers || [],
      attachments: attachments || [],
      metadata: metadata || {}
    })
    const comment = TaskComment.findById(commentId)!

    return success({
      id: comment._id,
      type: comment.type,
      userId: comment.userId,
      content: comment.content,
      summary: comment.summary,
      mentionedUsers: comment.mentionedUsers,
      attachments: comment.attachments,
      metadata: comment.metadata,
      timestamp: comment.createdAt,
      updatedAt: comment.updatedAt
    }, 'Comment added successfully')

  } catch (err) {
    k.logger.error('CreateCommentError', err instanceof Error ? err.message : String(err))
    return error('Failed to create comment', 500, err)
  }
})

// POST /api/task/import-as-comment
k.api.post("import-as-comment", (body: any) => {
  // 1. 鉴权检查
  if (!k.account.isLogin) {
    return error('Unauthorized', 401)
  }

  // 2. 参数验证
  const { taskId, content, summary, type, mentionedUsers } = body

  if (!taskId || typeof taskId !== 'string' || taskId.trim() === '') {
    return error('Invalid task ID', 400)
  }

  if (!content || content.trim() === '') {
    return error('Content is required', 400)
  }

  // 3. 创建评论（替代原来的导入逻辑）
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
      return error('You do not have permission to comment on this task', 403)
    }

    // 自动生成摘要（如果没有提供）
    let finalSummary = summary || ''
    if (!finalSummary && content.length > 200) {
      finalSummary = content.substring(0, 197) + '...'
    }

    const commentId = TaskComment.create({
      taskId,
      userId: currentUser._id,
      content: content.trim(),
      summary: finalSummary,
      type: type || 'ai_completion', // 默认为 AI 完成评论
      mentionedUsers: mentionedUsers || [],
      attachments: [],
      metadata: {
        importSource: 'task_import',
        originalLength: content.length
      }
    })
    const comment = TaskComment.findById(commentId)!

    return success({
      id: comment._id,
      type: comment.type,
      userId: comment.userId,
      content: comment.content,
      summary: comment.summary,
      mentionedUsers: comment.mentionedUsers,
      timestamp: comment.createdAt
    }, 'Content imported as comment successfully')

  } catch (err) {
    k.logger.error('ImportAsCommentError', err instanceof Error ? err.message : String(err))
    return error('Failed to import content as comment', 500, err)
  }
})

// GET /api/task/comments?taskId=xxx&page=1&size=20&type=all
k.api.get("comments", () => {
  // 1. 鉴权检查
  if (!k.account.isLogin) {
    return error('Unauthorized', 401)
  }

  // 2. 参数验证
  const query = k.request.queryString as unknown as {
    taskId: string
    page?: string
    size?: string
    type?: string // 'all' | 'user' | 'ai_completion' | 'ai_revision' | 'system'
  }
  const { taskId, page = '1', size = '20', type = 'all' } = query

  if (!taskId || taskId.trim() === '') {
    return error('Invalid task ID', 400)
  }

  const pageNum = parseInt(page)
  const sizeNum = parseInt(size)

  // 3. 获取评论列表
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
      return error('You do not have permission to view comments on this task', 403)
    }

    // 构建查询条件
    const whereCondition: any = { taskId }
    if (type !== 'all') {
      whereCondition.type = type
    }

    // 获取评论列表（带用户信息）
    const comments = TaskComment.findAll({
      where: whereCondition,
      orderBy: [{ column: 'createdAt', order: 'desc' }]
    })

    // 获取用户信息
    const userIds = [...new Set(comments.map(c => c.userId))]
    const users = userIds.map(id => getUserInfo(id)).filter(Boolean)

    // 简单分页
    const total = comments.length
    const start = (pageNum - 1) * sizeNum
    const end = start + sizeNum
    const items = comments.slice(start, end)

    // 格式化评论数据
    const formattedItems = items.map(comment => {
      const user = users.find(u => u._id === comment.userId)
      return {
        id: comment._id,
        type: comment.type,
        userId: comment.userId,
        user: {
          _id: user?._id,
          displayName: user?.displayName,
          username: user?.username,
          email: user?.email
        },
        content: comment.content,
        summary: comment.summary,
        mentionedUsers: comment.mentionedUsers,
        attachments: comment.attachments,
        metadata: comment.metadata,
        timestamp: comment.createdAt,
        updatedAt: comment.updatedAt
      }
    })

    return success({
      items: formattedItems,
      total,
      page: pageNum,
      size: sizeNum,
      hasMore: end < total
    })

  } catch (err) {
    k.logger.error('GetCommentsError', err instanceof Error ? err.message : String(err))
    return error('Failed to get comments', 500, err)
  }
})
