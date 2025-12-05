// @k-url /api/task/{action}

import { success, error } from 'code/Utils/response'
import { getUserInfo, getUserById } from 'code/Services/user'
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
import { CommentReaction } from 'code/Models/CommentReaction'
import { pushTaskCreated, pushTaskUpdated, pushTaskDeleted } from 'code/Services/websocket'
import { pushCommentCreated, pushCommentUpdated, pushCommentDeleted } from 'code/Services/websocket'

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
    
    // 推送 WebSocket 消息
    try {
      pushTaskCreated(task, projectId)
    } catch (wsErr) {
      // WebSocket 推送失败不影响主流程
      k.logger.warning('WebSocket', `Failed to push task created message: ${wsErr}`)
    }
    
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
    
    // 推送 WebSocket 消息
    try {
      const changes: Record<string, any> = {}
      if (title !== undefined) changes.title = title
      if (status !== undefined) changes.status = status
      if (priority !== undefined) changes.priority = priority
      if (assigneeId !== undefined) changes.assigneeId = assigneeId
      if (progress !== undefined) changes.progress = progress
      
      pushTaskUpdated(updatedTask, task.projectId, changes)
    } catch (wsErr) {
      // WebSocket 推送失败不影响主流程
      k.logger.warning('WebSocket', `Failed to push task updated message: ${wsErr}`)
    }
    
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

    // 保存 projectId 用于推送消息
    const projectId = task.projectId

    const deleted = deleteTask(taskId)

    if (!deleted) {
      return error('Failed to delete task', 500)
    }

    // 推送 WebSocket 消息
    try {
      pushTaskDeleted(taskId, projectId)
    } catch (wsErr) {
      // WebSocket 推送失败不影响主流程
      k.logger.warning('WebSocket', `Failed to push task deleted message: ${wsErr}`)
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

    // 推送 WebSocket 消息
    try {
      pushCommentCreated({
        _id: comment._id,
        id: comment._id,
        type: comment.type,
        userId: comment.userId,
        content: comment.content,
        summary: comment.summary,
        mentionedUsers: comment.mentionedUsers
      }, taskId, task.projectId)
    } catch (wsErr) {
      // WebSocket 推送失败不影响主流程
      k.logger.warning('WebSocket', `Failed to push comment created message: ${wsErr}`)
    }

    return success({
      id: comment._id,
      type: comment.type,
      userId: comment.userId,
      user: {
        _id: currentUser._id,
        username: currentUser.username,
        displayName: currentUser.displayName,
        email: currentUser.email,
        avatar: currentUser.avatar
      },
      content: comment.content,
      summary: comment.summary,
      mentionedUsers: comment.mentionedUsers,
      attachments: comment.attachments,
      metadata: comment.metadata,
      timestamp: comment.createdAt,
      updatedAt: comment.updatedAt
    }, '评论添加成功')

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
      user: {
        _id: currentUser._id,
        username: currentUser.username,
        displayName: currentUser.displayName,
        email: currentUser.email,
        avatar: currentUser.avatar
      },
      content: comment.content,
      summary: comment.summary,
      mentionedUsers: comment.mentionedUsers,
      timestamp: comment.createdAt
    }, '内容导入为评论成功')

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
    const comments = TaskComment.findAll(
      whereCondition,
      {
        order: [{ prop: 'createdAt', order: 'descending' }]
      }
    )

    // 获取用户信息
    const userIds = [...new Set(comments.map(c => c.userId))]
    const users = userIds.map(id => getUserById(id)).filter(Boolean)

    // 简单分页
    const total = comments.length
    const start = (pageNum - 1) * sizeNum
    const end = start + sizeNum
    const items = comments.slice(start, end)

    // 格式化评论数据
    const formattedItems = items.map(comment => {
      const user = users.find(u => u?._id === comment.userId)
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

// PUT /api/task/comment
k.api.put("comment", (body: any) => {
  // 1. 鉴权检查
  if (!k.account.isLogin) {
    return error('Unauthorized', 401)
  }

  // 2. 参数验证
  const { commentId, content, summary } = body

  if (!commentId || typeof commentId !== 'string' || commentId.trim() === '') {
    return error('参数错误：缺少评论ID', 400)
  }

  if (!content || content.trim() === '') {
    return error('参数错误：评论内容不能为空', 400)
  }

  // 3. 更新评论
  try {
    // 获取当前用户
    const username = k.account.user.current.userName
    const currentUser = getUserInfo(username)

    // 获取评论信息
    const comment = TaskComment.findById(commentId) as any

    if (!comment) {
      return error('评论不存在', 404)
    }

    // 检查权限：只有评论作者或项目成员可以编辑
    const task = getTaskById(comment.taskId)
    if (!task) {
      return error('任务不存在', 404)
    }

    const isAuthor = comment.userId === currentUser._id
    const hasProjectPermission = checkProjectPermission(task.projectId, currentUser._id, 'member')

    if (!isAuthor && !hasProjectPermission) {
      return error('权限不足：无法编辑该评论', 403)
    }

    // 更新评论
    const updatedId = TaskComment.updateById(commentId, {
      content: content.trim(),
      summary: summary || '',
      updatedAt: Date.now()
    })

    if (!updatedId) {
      return error('更新评论失败', 500)
    }

    const updatedComment = TaskComment.findById(updatedId) as any

    // 推送 WebSocket 消息
    try {
      pushCommentUpdated({
        _id: updatedComment._id,
        id: updatedComment._id,
        content: updatedComment.content,
        summary: updatedComment.summary
      }, task.taskId, task.projectId)
    } catch (wsErr) {
      // WebSocket 推送失败不影响主流程
      k.logger.warning('WebSocket', `Failed to push comment updated message: ${wsErr}`)
    }

    return success({
      id: updatedComment._id,
      type: updatedComment.type,
      userId: updatedComment.userId,
      content: updatedComment.content,
      summary: updatedComment.summary,
      mentionedUsers: updatedComment.mentionedUsers,
      attachments: updatedComment.attachments,
      metadata: updatedComment.metadata,
      timestamp: updatedComment.createdAt,
      updatedAt: updatedComment.updatedAt
    }, '评论更新成功')

  } catch (err) {
    k.logger.error('更新评论失败', err instanceof Error ? err.message : String(err))
    return error('更新评论失败', 500, err)
  }
})

// DELETE /api/task/comment
k.api.delete("comment", () => {
  // 1. 鉴权检查
  if (!k.account.isLogin) {
    return error('Unauthorized', 401)
  }

  // 2. 参数验证
  const query = k.request.queryString as unknown as { commentId?: string }
  const commentId = query.commentId

  if (!commentId || typeof commentId !== 'string' || commentId.trim() === '') {
    return error('参数错误：缺少评论ID', 400)
  }

  // 3. 删除评论
  try {
    // 获取当前用户
    const username = k.account.user.current.userName
    const currentUser = getUserInfo(username)

    // 获取评论信息
    const comment = TaskComment.findById(commentId) as any

    if (!comment) {
      return error('评论不存在', 404)
    }

    // 检查权限：只有评论作者或项目管理者可以删除
    const task = getTaskById(comment.taskId)
    if (!task) {
      return error('任务不存在', 404)
    }

    const isAuthor = comment.userId === currentUser._id
    const hasProjectPermission = checkProjectPermission(task.projectId, currentUser._id, 'admin')

    if (!isAuthor && !hasProjectPermission) {
      return error('权限不足：无法删除该评论', 403)
    }

    // 保存信息用于推送消息
    const taskIdForPush = comment.taskId
    const projectIdForPush = task.projectId

    // 删除评论
    const deletedId = TaskComment.deleteById(commentId)

    if (!deletedId) {
      return error('删除评论失败', 500)
    }

    // 推送 WebSocket 消息
    try {
      pushCommentDeleted(commentId, taskIdForPush, projectIdForPush)
    } catch (wsErr) {
      // WebSocket 推送失败不影响主流程
      k.logger.warning('WebSocket', `Failed to push comment deleted message: ${wsErr}`)
    }

    return success({ deletedId }, '评论删除成功')

  } catch (err) {
    k.logger.error('删除评论失败', err instanceof Error ? err.message : String(err))
    return error('删除评论失败', 500, err)
  }
})

// POST /api/task/reaction
k.api.post("reaction", (body: any) => {
  // 1. 鉴权检查
  if (!k.account.isLogin) {
    return error('Unauthorized', 401)
  }

  // 2. 参数验证
  const { commentId, emoji } = body

  if (!commentId || typeof commentId !== 'string' || commentId.trim() === '') {
    return error('参数错误：缺少评论ID', 400)
  }

  if (!emoji || typeof emoji !== 'string' || emoji.trim() === '') {
    return error('参数错误：缺少表情符号', 400)
  }

  // 3. 添加/移除反应
  try {
    // 获取当前用户
    const username = k.account.user.current.userName
    const currentUser = getUserInfo(username)

    // 检查评论是否存在
    const comment = TaskComment.findById(commentId) as any
    if (!comment) {
      return error('评论不存在', 404)
    }

    // 检查权限：只有项目成员可以添加反应
    const task = getTaskById(comment.taskId)
    if (!task) {
      return error('任务不存在', 404)
    }

    const hasPermission = checkProjectPermission(task.projectId, currentUser._id, 'member')
    if (!hasPermission) {
      return error('权限不足：无法对该评论添加反应', 403)
    }

    // 检查用户是否已经对该评论有反应
    const existingReaction = CommentReaction.findOne({
      commentId: commentId,
      userId: currentUser._id
    }) as any

    if (existingReaction) {
      // 如果已有反应且emoji相同，则移除反应
      if (existingReaction.emoji === emoji) {
        const deletedId = CommentReaction.deleteById(existingReaction._id)
        if (!deletedId) {
          return error('移除反应失败', 500)
        }
        return success({ action: 'removed', emoji }, '反应已移除')
      } else {
        // 如果emoji不同，则更新反应
        const updatedId = CommentReaction.updateById(existingReaction._id, {
          emoji: emoji.trim(),
          updatedAt: Date.now()
        })
        if (!updatedId) {
          return error('更新反应失败', 500)
        }
        return success({ action: 'updated', emoji, oldEmoji: existingReaction.emoji }, '反应已更新')
      }
    } else {
      // 添加新反应
      const reactionId = CommentReaction.create({
        commentId: commentId,
        userId: currentUser._id,
        emoji: emoji.trim()
      })

      if (!reactionId) {
        return error('添加反应失败', 500)
      }

      return success({ action: 'added', emoji }, '反应已添加')
    }

  } catch (err) {
    k.logger.error('反应操作失败', err instanceof Error ? err.message : String(err))
    return error('反应操作失败', 500, err)
  }
})

// GET /api/task/reactions?commentId=xxx
k.api.get("reactions", () => {
  // 1. 鉴权检查
  if (!k.account.isLogin) {
    return error('Unauthorized', 401)
  }

  // 2. 参数验证
  const query = k.request.queryString as unknown as { commentId?: string }
  const commentId = query.commentId

  if (!commentId || typeof commentId !== 'string' || commentId.trim() === '') {
    return error('参数错误：缺少评论ID', 400)
  }

  // 3. 获取反应列表
  try {
    // 检查评论是否存在
    const comment = TaskComment.findById(commentId) as any
    if (!comment) {
      return error('评论不存在', 404)
    }

    // 获取所有反应
    const reactions = CommentReaction.findAll({ commentId: commentId }) as any[]

    // 获取反应统计信息
    const reactionStats: Record<string, { count: number; users: any[] }> = {}

    reactions.forEach(reaction => {
      if (!reactionStats[reaction.emoji]) {
        reactionStats[reaction.emoji] = { count: 0, users: [] }
      }
      reactionStats[reaction.emoji].count++
      reactionStats[reaction.emoji].users.push({
        userId: reaction.userId,
        reactedAt: reaction.createdAt
      })
    })

    // 获取当前用户的反应
    const username = k.account.user.current.userName
    const currentUser = getUserInfo(username)
    const userReactions = reactions.filter(r => r.userId === currentUser._id)

    return success({
      commentId,
      reactions: reactionStats,
      userReactions: userReactions.map(r => r.emoji)
    }, '获取反应列表成功')

  } catch (err) {
    k.logger.error('获取反应列表失败', err instanceof Error ? err.message : String(err))
    return error('获取反应列表失败', 500, err)
  }
})
