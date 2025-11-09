/**
 * 任务服务 - 处理任务相关的业务逻辑
 */

import { Task, type TaskType } from 'code/Models/Task'
import { TaskTag, type TaskTagType } from 'code/Models/TaskTag'
import { TaskModule, type TaskModuleType } from 'code/Models/TaskModule'
import { Tag, type TagType } from 'code/Models/Tag'
import { Module, type ModuleType } from 'code/Models/Module'
import { TaskHistory } from 'code/Models/TaskHistory'
import { getUserById } from 'code/Services/user'
import { getUserProjects, getProjectById } from 'code/Services/project'

/**
 * 任务信息接口
 */
export interface TaskInfo {
  _id: string
  displayId: number
  projectId: string
  title: string
  content: string
  status: string
  priority: string
  assigneeId: string
  creatorId: string
  dueDate: number
  progress: number
  order: number
  tagIds?: string[]  // 标签 ID 数组
  moduleIds?: string[]  // 模块 ID 数组
  createdAt: number
  updatedAt: number
  // 项目信息（嵌套对象）
  project?: {
    _id: string
    name: string
    color: string
  }
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

/**
 * 任务详情接口（包含关联数据）
 */
export interface TaskDetailInfo extends TaskInfo {
  tags?: Array<{
    _id: string
    name: string
    color: string
    prompt: string
    showInQuickBar: boolean
    order: number
    createdAt: number
    updatedAt: number
  }>
  modules?: Array<{
    _id: string
    name: string
    color: string
  }>
}

/**
 * 获取项目下一个可用的 displayId
 * @param projectId - 项目 ID
 * @returns 下一个可用的 displayId
 */
function getNextDisplayId(projectId: string): number {
  const tasks = Task.findAll(
    { projectId },
    { order: { prop: 'displayId', order: 'descending' } }
  ) as TaskType[]

  if (tasks.length === 0) {
    return 1001 // 起始值从 1001 开始
  }

  const maxDisplayId = tasks[0].displayId || 1000
  return maxDisplayId + 1
}

/**
 * 创建任务
 * @param data - 任务数据
 * @returns 新创建的任务 ID（字符串类型）
 */
export function createTask(data: {
  projectId: string
  moduleIds?: string[] // 模块 ID 数组（支持多选）
  title: string
  content?: string
  status?: string
  priority?: string
  assigneeId?: string
  creatorId: string
  dueDate?: number
  progress?: number
  tags?: string[] // 标签 ID 数组
  summary?: string // 任务摘要（20-50字）
}): string {
  // 1. 获取当前最大 order 值
  const tasks = Task.findAll({ projectId: data.projectId }) as TaskType[]
  const maxOrder = tasks.reduce((max, task) => Math.max(max, task.order || 0), 0)

  // 2. 获取下一个 displayId
  const displayId = getNextDisplayId(data.projectId)

  // 3. 创建任务
  const taskId = Task.create({
    displayId,
    projectId: data.projectId,
    title: data.title,
    content: data.content || '',
    status: data.status || 'todo',
    priority: data.priority || 'medium',
    assigneeId: data.assigneeId || '',
    creatorId: data.creatorId,
    dueDate: data.dueDate,
    progress: data.progress || 0,
    order: maxOrder + 1
  })

  // 4. 如果提供了模块，创建任务模块关联
  if (data.moduleIds && data.moduleIds.length > 0) {
    data.moduleIds.forEach(moduleId => {
      TaskModule.create({
        taskId: taskId,
        moduleId: moduleId
      })
    })
  }

  // 5. 如果提供了标签，创建任务标签关联
  if (data.tags && data.tags.length > 0) {
    data.tags.forEach(tagId => {
      TaskTag.create({
        taskId: taskId,
        tagId: tagId
      })
    })
  }

  // 6. 记录任务创建历史
  TaskHistory.create({
    taskId: taskId,
    userId: data.creatorId,
    field: 'task',
    oldValue: '',
    newValue: data.title,
    action: 'create',
    summary: data.summary || ''
  })

  return taskId
}

/**
 * 根据 ID 获取任务
 * @param taskId - 任务 ID（字符串类型）
 * @returns 任务信息或 null
 */
export function getTaskById(taskId: string): TaskInfo | null {
  const task = Task.findById(taskId) as TaskType | null

  if (!task) {
    return null
  }

  const taskInfo = formatTaskInfo(task)

  // 获取任务标签 ID
  const taskTags = TaskTag.findAll({ taskId: taskId }) as TaskTagType[]
  taskInfo.tagIds = taskTags.map(tt => tt.tagId)

  // 获取任务模块 ID
  const taskModules = TaskModule.findAll({ taskId: taskId }) as TaskModuleType[]
  taskInfo.moduleIds = taskModules.map(tm => tm.moduleId)

  return taskInfo
}

/**
 * 根据 ID 获取任务详情（包含标签和模块）
 * @param taskId - 任务 ID（字符串类型）
 * @returns 任务详情或 null
 */
export function getTaskDetailById(taskId: string): TaskDetailInfo | null {
  const task = Task.findById(taskId) as TaskType | null

  if (!task) {
    return null
  }

  const taskInfo = formatTaskInfo(task)

  // 获取任务标签
  const taskTags = TaskTag.findAll({ taskId: taskId }) as TaskTagType[]
  const tags = taskTags
    .map(tt => {
      const tag = Tag.findById(tt.tagId) as TagType | null
      if (!tag) return null
      return {
        _id: tag._id,
        name: tag.name,
        color: tag.color,
        prompt: tag.prompt || '',
        showInQuickBar: tag.showInQuickBar || false,
        order: tag.order || 0,
        createdAt: tag.createdAt,
        updatedAt: tag.updatedAt
      }
    })
    .filter(t => t !== null) as Array<{
      _id: string
      name: string
      color: string
      prompt: string
      showInQuickBar: boolean
      order: number
      createdAt: number
      updatedAt: number
    }>

  // 获取任务模块
  const taskModules = TaskModule.findAll({ taskId: taskId }) as TaskModuleType[]
  const modules = taskModules
    .map(tm => {
      const module = Module.findById(tm.moduleId) as ModuleType | null
      if (!module) return null
      return {
        _id: module._id,
        name: module.name,
        color: module.color
      }
    })
    .filter(m => m !== null) as Array<{ _id: string; name: string; color: string }>

  return {
    ...taskInfo,
    tagIds: tags.map(t => t._id),  // 添加 tagIds 字段
    moduleIds: modules.map(m => m._id),  // 添加 moduleIds 字段
    tags,
    modules
  }
}

/**
 * 获取项目的任务列表
 * @param projectId - 项目 ID
 * @param filters - 筛选条件
 * @param sortField - 排序字段
 * @param sortDirection - 排序方向（asc/desc）
 * @returns 任务列表
 */
export function getProjectTasks(
  projectId: string,
  filters?: {
    moduleId?: string
    status?: string
    priority?: string
    assigneeId?: string
  },
  sortField?: string,
  sortDirection?: string
): TaskInfo[] {
  // 构建查询条件
  const query: any = { projectId }

  if (filters?.status) {
    query.status = filters.status
  }
  if (filters?.priority) {
    query.priority = filters.priority
  }
  if (filters?.assigneeId) {
    query.assigneeId = filters.assigneeId
  }

  let tasks = Task.findAll(query) as TaskType[]

  // 如果有模块过滤，需要通过 TaskModule 关联表过滤
  if (filters?.moduleId) {
    const taskModules = TaskModule.findAll({ moduleId: filters.moduleId }) as TaskModuleType[]
    const taskIdsInModule = new Set(taskModules.map(tm => tm.taskId))
    tasks = tasks.filter(task => taskIdsInModule.has(task._id))
  }

  // 格式化任务信息并填充用户数据
  const formattedTasks = tasks.map(task => {
    const taskInfo = formatTaskInfo(task)

    // 获取任务标签 ID
    const taskTags = TaskTag.findAll({ taskId: task._id }) as TaskTagType[]
    taskInfo.tagIds = taskTags.map(tt => tt.tagId)

    // 获取任务模块 ID
    const taskModules = TaskModule.findAll({ taskId: task._id }) as TaskModuleType[]
    taskInfo.moduleIds = taskModules.map(tm => tm.moduleId)

    // 填充指派人信息（嵌套对象）
    if (task.assigneeId) {
      const assigneeUser = getUserById(task.assigneeId)
      if (assigneeUser) {
        taskInfo.assignee = {
          displayName: assigneeUser.displayName,
          username: assigneeUser.username,
          email: assigneeUser.email
        }
      }
    }

    // 填充创建人信息（嵌套对象）
    if (task.creatorId) {
      const creatorUser = getUserById(task.creatorId)
      if (creatorUser) {
        taskInfo.creator = {
          displayName: creatorUser.displayName,
          username: creatorUser.username,
          email: creatorUser.email
        }
      }
    }

    return taskInfo
  })

  // 排序
  return sortTasks(formattedTasks, sortField, sortDirection)
}

/**
 * 任务排序函数
 */
function sortTasks(tasks: TaskInfo[], sortField?: string, sortDirection?: string): TaskInfo[] {
  // 默认排序：先按状态，再按更新时间降序
  if (!sortField) {
    return tasks.sort((a, b) => {
      // 状态优先排序 (待验收 > 待办 > 进行中 > 已完成)
      const statusOrder: Record<string, number> = {  review: 1, todo: 2, in_progress: 3, completed: 4 }
      const statusA = statusOrder[a.status] || 99
      const statusB = statusOrder[b.status] || 99

      if (statusA !== statusB) {
        return statusA - statusB
      }

      // 状态相同时，按更新时间降序
      return b.updatedAt - a.updatedAt
    })
  }

  const field = sortField
  const direction = sortDirection || 'asc'

  return tasks.sort((a, b) => {
    let aValue: any = (a as any)[field]
    let bValue: any = (b as any)[field]

    // 处理 undefined/null 值
    if (aValue === undefined || aValue === null) aValue = ''
    if (bValue === undefined || bValue === null) bValue = ''

    // 数字类型排序
    if (field === 'displayId' || field === 'createdAt' || field === 'updatedAt' || field === 'order' || field === 'dueDate') {
      const numA = Number(aValue) || 0
      const numB = Number(bValue) || 0
      return direction === 'desc' ? numB - numA : numA - numB
    }

    // 优先级特殊排序 (high > medium > low)
    if (field === 'priority') {
      const priorityOrder: Record<string, number> = { high: 3, medium: 2, low: 1 }
      const numA = priorityOrder[aValue] || 0
      const numB = priorityOrder[bValue] || 0
      return direction === 'desc' ? numB - numA : numA - numB
    }

    // 状态特殊排序 (待验收 > 待办 > 进行中 > 已完成)
    if (field === 'status') {
      const statusOrder: Record<string, number> = {  review: 1, todo: 2, in_progress: 3, completed: 4 }
      const numA = statusOrder[aValue] || 0
      const numB = statusOrder[bValue] || 0
      return direction === 'desc' ? numB - numA : numA - numB
    }

    // 字符串排序
    const strA = String(aValue).toLowerCase()
    const strB = String(bValue).toLowerCase()
    if (direction === 'desc') {
      return strB.localeCompare(strA)
    }
    return strA.localeCompare(strB)
  })
}

/**
 * 更新任务信息
 * @param taskId - 任务 ID（字符串类型）
 * @param data - 更新的数据
 * @param userId - 执行更新的用户 ID（用于记录历史）
 * @returns 是否成功
 */
export function updateTask(
  taskId: string,
  data: {
    title?: string
    content?: string
    status?: string
    priority?: string
    assigneeId?: string
    dueDate?: number
    progress?: number
    moduleIds?: string[] // 如果提供，会完全替换现有模块
    tags?: string[] // 如果提供，会完全替换现有标签
    summary?: string // 任务摘要（20-50字）
  },
  userId?: string
): boolean {
  // 获取旧任务数据用于记录历史
  const oldTask = userId ? (Task.findById(taskId) as TaskType | null) : null

  const updateData: any = {}

  if (data.title !== undefined) updateData.title = data.title
  if (data.content !== undefined) updateData.content = data.content
  if (data.status !== undefined) updateData.status = data.status
  if (data.priority !== undefined) updateData.priority = data.priority
  if (data.assigneeId !== undefined) updateData.assigneeId = data.assigneeId
  if (data.dueDate !== undefined) updateData.dueDate = data.dueDate
  if (data.progress !== undefined) updateData.progress = data.progress
  if (data.summary !== undefined) updateData.summary = data.summary

  if (data.dueDate === 0) delete updateData.dueDate

  const updatedId = Task.updateById(taskId, updateData)

  // 记录字段变更历史
  if (userId && oldTask) {
    const fieldMap: Array<{ field: string; oldValue: any; newValue: any }> = []

    if (data.title !== undefined && data.title !== oldTask.title) {
      fieldMap.push({ field: 'title', oldValue: oldTask.title, newValue: data.title })
    }
    if (data.content !== undefined && data.content !== oldTask.content) {
      fieldMap.push({ field: 'content', oldValue: oldTask.content, newValue: data.content })
    }
    if (data.status !== undefined && data.status !== oldTask.status) {
      fieldMap.push({ field: 'status', oldValue: oldTask.status, newValue: data.status })
    }
    if (data.priority !== undefined && data.priority !== oldTask.priority) {
      fieldMap.push({ field: 'priority', oldValue: oldTask.priority, newValue: data.priority })
    }
    if (data.assigneeId !== undefined && data.assigneeId !== oldTask.assigneeId) {
      fieldMap.push({ field: 'assigneeId', oldValue: oldTask.assigneeId, newValue: data.assigneeId })
    }
    // dueDate 特殊处理：0、undefined、null 都视为空值
    if (data.dueDate !== undefined) {
      const oldDueDate = oldTask.dueDate || 0
      const newDueDate = data.dueDate || 0
      if (oldDueDate !== newDueDate) {
        fieldMap.push({
          field: 'dueDate',
          oldValue: oldDueDate ? String(oldDueDate) : '',
          newValue: newDueDate ? String(newDueDate) : ''
        })
      }
    }
    if (data.progress !== undefined && data.progress !== oldTask.progress) {
      fieldMap.push({ field: 'progress', oldValue: String(oldTask.progress), newValue: String(data.progress) })
    }

    // 为每个变更创建历史记录
    fieldMap.forEach(change => {
      TaskHistory.create({
        taskId: taskId,
        userId: userId,
        field: change.field,
        oldValue: String(change.oldValue || ''),
        newValue: String(change.newValue || ''),
        action: 'update',
        summary: data.summary || ''
      })
    })
  }

  // 如果提供了模块，更新任务模块关联
  if (data.moduleIds !== undefined) {
    // 删除现有模块关联
    const existingTaskModules = TaskModule.findAll({ taskId: taskId }) as TaskModuleType[]
    existingTaskModules.forEach(tm => {
      TaskModule.deleteById(tm._id)
    })

    // 创建新的模块关联
    data.moduleIds.forEach(moduleId => {
      TaskModule.create({
        taskId: taskId,
        moduleId: moduleId
      })
    })
  }

  // 如果提供了标签，更新任务标签关联
  if (data.tags !== undefined) {
    // 删除现有标签关联
    const existingTaskTags = TaskTag.findAll({ taskId: taskId }) as TaskTagType[]
    existingTaskTags.forEach(tt => {
      TaskTag.deleteById(tt._id)
    })

    // 创建新的标签关联
    data.tags.forEach(tagId => {
      TaskTag.create({
        taskId: taskId,
        tagId: tagId
      })
    })
  }

  return updatedId !== null && updatedId !== undefined
}

/**
 * 删除任务
 * @param taskId - 任务 ID（字符串类型）
 * @returns 是否成功
 */
export function deleteTask(taskId: string): boolean {
  // 1. 删除任务模块关联
  const taskModules = TaskModule.findAll({ taskId: taskId }) as TaskModuleType[]
  taskModules.forEach(tm => {
    TaskModule.deleteById(tm._id)
  })

  // 2. 删除任务标签关联
  const taskTags = TaskTag.findAll({ taskId: taskId }) as TaskTagType[]
  taskTags.forEach(tt => {
    TaskTag.deleteById(tt._id)
  })

  // 3. 删除任务
  return Task.deleteById(taskId)
}

/**
 * 批量更新任务顺序
 * @param updates - 更新数据数组
 * @returns 是否成功
 */
export function batchUpdateTaskOrder(
  updates: Array<{
    id: string
    order: number
    status?: string
  }>
): boolean {
  try {
    updates.forEach(update => {
      const updateData: any = { order: update.order }
      if (update.status) {
        updateData.status = update.status
      }
      Task.updateById(update.id, updateData)
    })
    return true
  } catch (err) {
    return false
  }
}

/**
 * 获取用户相关任务列表（跨项目）
 * @param userId - 用户 ID
 * @param filters - 筛选条件
 * @param sortField - 排序字段
 * @param sortDirection - 排序方向
 * @returns 任务列表
 */
export function getUserTasks(
  userId: string,
  filters?: {
    projectId?: string
    projectIds?: string[]
    status?: string | string[]
    priority?: string
    search?: string
  },
  sortField?: string,
  sortDirection?: string
): TaskInfo[] {
  // 1. 获取用户有权限的所有项目ID
  const userProjects = getUserProjects(userId)
  const userProjectIds = userProjects.map(p => p._id)

  // 如果指定了项目ID，进一步过滤
  let targetProjectIds = userProjectIds
  if (filters?.projectId) {
    if (!userProjectIds.includes(filters.projectId)) {
      return [] // 用户没有权限访问该项目
    }
    targetProjectIds = [filters.projectId]
  } else if (filters?.projectIds && filters.projectIds.length > 0) {
    // 过滤出用户有权限的项目
    targetProjectIds = filters.projectIds.filter(id => userProjectIds.includes(id))
    if (targetProjectIds.length === 0) {
      return []
    }
  }

  // 2. 在这些项目中查询任务（指派给用户或用户创建的）
  const allTasks: TaskType[] = []

  for (const projectId of targetProjectIds) {
    const tasks = Task.findAll({ projectId }) as TaskType[]
    allTasks.push(...tasks)
  }

  // 3. 过滤出指派给当前用户或由当前用户创建的任务
  let filteredTasks = allTasks.filter(task =>
    task.assigneeId === userId || task.creatorId === userId
  )

  // 4. 应用其他筛选条件
  if (filters?.status) {
    if (Array.isArray(filters.status)) {
      // 多个状态筛选
      filteredTasks = filteredTasks.filter(task => filters.status!.includes(task.status))
    } else {
      // 单个状态筛选
      filteredTasks = filteredTasks.filter(task => task.status === filters.status)
    }
  }

  if (filters?.priority) {
    filteredTasks = filteredTasks.filter(task => task.priority === filters.priority)
  }

  if (filters?.search) {
    const searchTerm = filters.search.toLowerCase()
    filteredTasks = filteredTasks.filter(task =>
      task.title.toLowerCase().includes(searchTerm) ||
      (task.content && task.content.toLowerCase().includes(searchTerm))
    )
  }

  // 5. 获取所有项目的详细信息，避免重复查询
  const projectMap = new Map<string, any>()
  const uniqueProjectIds = [...new Set(filteredTasks.map(task => task.projectId))]

  for (const projectId of uniqueProjectIds) {
    const project = getProjectById(projectId)
    if (project) {
      projectMap.set(projectId, {
        _id: project._id,
        name: project.name,
        color: project.color
      })
    }
  }

  // 6. 格式化任务信息并填充用户数据
  const formattedTasks = filteredTasks.map(task => {
    const taskInfo = formatTaskInfo(task)

    // 填充项目信息（嵌套对象）
    taskInfo.project = projectMap.get(task.projectId)

    // 获取任务标签 ID
    const taskTags = TaskTag.findAll({ taskId: task._id }) as TaskTagType[]
    taskInfo.tagIds = taskTags.map(tt => tt.tagId)

    // 获取任务模块 ID
    const taskModules = TaskModule.findAll({ taskId: task._id }) as TaskModuleType[]
    taskInfo.moduleIds = taskModules.map(tm => tm.moduleId)

    // 填充指派人信息（嵌套对象）
    if (task.assigneeId) {
      const assigneeUser = getUserById(task.assigneeId)
      if (assigneeUser) {
        taskInfo.assignee = {
          displayName: assigneeUser.displayName,
          username: assigneeUser.username,
          email: assigneeUser.email
        }
      }
    }

    // 填充创建人信息（嵌套对象）
    if (task.creatorId) {
      const creatorUser = getUserById(task.creatorId)
      if (creatorUser) {
        taskInfo.creator = {
          displayName: creatorUser.displayName,
          username: creatorUser.username,
          email: creatorUser.email
        }
      }
    }

    return taskInfo
  })

  // 7. 排序
  return sortTasks(formattedTasks, sortField, sortDirection)
}

/**
 * 分页获取用户相关任务列表
 * @param userId - 用户 ID
 * @param page - 页码
 * @param pageSize - 每页大小
 * @param filters - 筛选条件
 * @param sortField - 排序字段
 * @param sortDirection - 排序方向
 * @returns 分页任务列表
 */
export function getUserTasksPaginated(
  userId: string,
  page: number = 1,
  pageSize: number = 20,
  filters?: {
    projectId?: string
    projectIds?: string[]
    status?: string
    priority?: string
    search?: string
  },
  sortField?: string,
  sortDirection?: string
): {
  items: TaskInfo[]
  total: number
  page: number
  pageSize: number
  totalPages: number
} {
  // 获取所有符合条件的任务
  const allTasks = getUserTasks(userId, filters, sortField, sortDirection)

  // 计算分页
  const total = allTasks.length
  const totalPages = Math.ceil(total / pageSize)
  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + pageSize
  const items = allTasks.slice(startIndex, endIndex)

  return {
    items,
    total,
    page,
    pageSize,
    totalPages
  }
}

/**
 * 格式化任务信息
 */
function formatTaskInfo(task: TaskType): TaskInfo {
  return {
    _id: task._id,
    displayId: task.displayId,
    projectId: task.projectId,
    title: task.title,
    content: task.content,
    status: task.status,
    priority: task.priority,
    assigneeId: task.assigneeId,
    creatorId: task.creatorId,
    dueDate: task.dueDate,
    progress: task.progress,
    order: task.order,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt
  }
}
