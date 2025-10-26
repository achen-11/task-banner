/**
 * 任务服务 - 处理任务相关的业务逻辑
 */

import { Task, type TaskType } from 'code/Models/Task'
import { TaskTag, type TaskTagType } from 'code/Models/TaskTag'
import { Tag, type TagType } from 'code/Models/Tag'

/**
 * 任务信息接口
 */
export interface TaskInfo {
  _id: string
  taskId: string
  projectId: string
  moduleId: string
  title: string
  content: string
  status: string
  priority: string
  assigneeId: string
  creatorId: string
  dueDate: number
  progress: number
  order: number
  createdAt: number
  updatedAt: number
}

/**
 * 任务详情接口（包含关联数据）
 */
export interface TaskDetailInfo extends TaskInfo {
  tags?: Array<{
    _id: string
    name: string
    color: string
  }>
}

/**
 * 创建任务
 * @param data - 任务数据
 * @returns 新创建的任务 ID（字符串类型）
 */
export function createTask(data: {
  projectId: string
  moduleId?: string
  title: string
  content?: string
  status?: string
  priority?: string
  assigneeId?: string
  creatorId: string
  dueDate?: number
  progress?: number
  tags?: string[] // 标签 ID 数组
}): string {
  // 1. 获取当前最大 order 值
  const tasks = Task.findAll({ projectId: data.projectId }) as TaskType[]
  const maxOrder = tasks.reduce((max, task) => Math.max(max, task.order || 0), 0)

  // 2. 创建任务
  const taskId = Task.create({
    projectId: data.projectId,
    moduleId: data.moduleId || '',
    title: data.title,
    content: data.content || '',
    status: data.status || 'todo',
    priority: data.priority || 'medium',
    assigneeId: data.assigneeId || '',
    creatorId: data.creatorId,
    dueDate: data.dueDate || 0,
    progress: data.progress || 0,
    order: maxOrder + 1
  })

  // 3. 如果提供了标签，创建任务标签关联
  if (data.tags && data.tags.length > 0) {
    data.tags.forEach(tagId => {
      TaskTag.create({
        taskId: taskId,
        tagId: tagId
      })
    })
  }

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

  return formatTaskInfo(task)
}

/**
 * 根据 ID 获取任务详情（包含标签）
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
        color: tag.color
      }
    })
    .filter(t => t !== null) as Array<{ _id: string; name: string; color: string }>

  return {
    ...taskInfo,
    tags
  }
}

/**
 * 获取项目的任务列表
 * @param projectId - 项目 ID
 * @param filters - 筛选条件
 * @returns 任务列表
 */
export function getProjectTasks(
  projectId: string,
  filters?: {
    moduleId?: string
    status?: string
    priority?: string
    assigneeId?: string
  }
): TaskInfo[] {
  // 构建查询条件
  const query: any = { projectId }

  if (filters?.moduleId) {
    query.moduleId = filters.moduleId
  }
  if (filters?.status) {
    query.status = filters.status
  }
  if (filters?.priority) {
    query.priority = filters.priority
  }
  if (filters?.assigneeId) {
    query.assigneeId = filters.assigneeId
  }

  const tasks = Task.findAll(query) as TaskType[]

  // 按 order 排序
  return tasks
    .map(formatTaskInfo)
    .sort((a, b) => a.order - b.order)
}

/**
 * 更新任务信息
 * @param taskId - 任务 ID（字符串类型）
 * @param data - 更新的数据
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
    moduleId?: string
    dueDate?: number
    progress?: number
    tags?: string[] // 如果提供，会完全替换现有标签
  }
): boolean {
  const updateData: any = {}

  if (data.title !== undefined) updateData.title = data.title
  if (data.content !== undefined) updateData.content = data.content
  if (data.status !== undefined) updateData.status = data.status
  if (data.priority !== undefined) updateData.priority = data.priority
  if (data.assigneeId !== undefined) updateData.assigneeId = data.assigneeId
  if (data.moduleId !== undefined) updateData.moduleId = data.moduleId
  if (data.dueDate !== undefined) updateData.dueDate = data.dueDate
  if (data.progress !== undefined) updateData.progress = data.progress

  const updatedId = Task.updateById(taskId, updateData)

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
  // 1. 删除任务标签关联
  const taskTags = TaskTag.findAll({ taskId: taskId }) as TaskTagType[]
  taskTags.forEach(tt => {
    TaskTag.deleteById(tt._id)
  })

  // 2. 删除任务
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
 * 格式化任务信息
 */
function formatTaskInfo(task: TaskType): TaskInfo {
  return {
    _id: task._id,
    taskId: task.taskId,
    projectId: task.projectId,
    moduleId: task.moduleId,
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
