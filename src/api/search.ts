// @k-url /api/search/{action}

import { success, error } from 'code/Utils/response'
import { getUserInfo } from 'code/Services/user'
import { getUserProjects } from 'code/Services/project'
import { Task, type TaskType } from 'code/Models/Task'
import { TaskComment, type TaskCommentType } from 'code/Models/TaskComment'
import { Document, type DocumentType } from 'code/Models/Document'
import { getProjectById } from 'code/Services/project'
import { checkProjectPermission } from 'code/Services/project'

/**
 * 搜索结果项接口
 */
interface SearchResultItem {
  type: 'task' | 'comment' | 'document'
  id: string
  title: string
  content: string
  projectId: string
  projectName?: string
  projectColor?: string
  matchedText?: string // 匹配的文本片段（带截断）
  taskId?: string // 对于评论类型，这是所属任务的ID
  createdAt: number
  updatedAt: number
}

/**
 * 全局搜索
 * GET /api/search/global?keyword=xxx&limit=20
 */
k.api.get("global", () => {
  // 1. 鉴权检查
  if (!k.account.isLogin) {
    return error('Unauthorized', 401)
  }

  // 2. 获取参数
  const query = k.request.queryString as unknown as {
    keyword?: string
    limit?: string
    includeArchived?: string
  }

  const keyword = query?.keyword?.trim()
  const limit = parseInt(query?.limit || '20')

  if (!keyword || keyword.length === 0) {
    return success({
      items: [],
      total: 0
    })
  }

  try {
    // 获取当前用户
    const username = k.account.user.current.userName
    const currentUser = getUserInfo(username)

    if (!currentUser) {
      return error('User not found', 404)
    }

    // 获取用户有权限的所有项目
    const includeArchived = query?.includeArchived === 'true'
    const userProjects = getUserProjects(currentUser._id)
    const userProjectIds = userProjects
      .filter(p => includeArchived || p.status !== 'archived')
      .map(p => p._id)

    if (userProjectIds.length === 0) {
      return success({
        items: [],
        total: 0
      })
    }

    const searchTerm = keyword.toLowerCase()
    const results: SearchResultItem[] = []

    // 1. 搜索任务（任务名称和描述）
    const allTasks: TaskType[] = []
    for (const projectId of userProjectIds) {
      const tasks = Task.findAll({ projectId }) as TaskType[]
      allTasks.push(...tasks)
    }

    for (const task of allTasks) {
      // 检查项目权限
      if (!checkProjectPermission(task.projectId, currentUser._id, 'member')) {
        continue
      }

      const titleMatch = task.title.toLowerCase().includes(searchTerm)
      const contentMatch = task.content && task.content.toLowerCase().includes(searchTerm)

      if (titleMatch || contentMatch) {
        const project = getProjectById(task.projectId)
        const matchedText = getMatchedText(
          titleMatch ? task.title : (task.content || ''),
          keyword,
          100
        )

        results.push({
          type: 'task',
          id: task._id,
          title: task.title,
          content: task.content || '',
          projectId: task.projectId,
          projectName: project?.name,
          projectColor: project?.color,
          matchedText,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt
        })
      }
    }

    // 2. 搜索任务评论
    // 先获取用户有权限的项目下的所有任务
    const taskIds: string[] = []
    for (const projectId of userProjectIds) {
      const tasks = Task.findAll({ projectId }) as TaskType[]
      taskIds.push(...tasks.map(t => t._id))
    }

    // 只查询这些任务的评论
    const allComments = TaskComment.findAll({}) as TaskCommentType[]
    for (const comment of allComments) {
      // 只处理用户有权限的任务的评论
      if (!taskIds.includes(comment.taskId)) {
        continue
      }

      // 获取评论所属的任务
      const task = Task.findById(comment.taskId) as TaskType | null
      if (!task) continue

      // 再次检查项目权限
      if (!checkProjectPermission(task.projectId, currentUser._id, 'member')) {
        continue
      }

      const contentMatch = comment.content.toLowerCase().includes(searchTerm)
      if (contentMatch) {
        const project = getProjectById(task.projectId)
        const matchedText = getMatchedText(comment.content, keyword, 100)

        results.push({
          type: 'comment',
          id: comment._id,
          title: `评论: ${task.title}`,
          content: comment.content,
          projectId: task.projectId,
          projectName: project?.name,
          projectColor: project?.color,
          matchedText,
          taskId: task._id, // 添加任务ID，方便前端导航
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt
        })
      }
    }

    // 3. 搜索项目文档
    const allDocuments: DocumentType[] = []
    for (const projectId of userProjectIds) {
      const docs = Document.findAll({ projectId }) as DocumentType[]
      allDocuments.push(...docs)
    }

    for (const doc of allDocuments) {
      // 检查项目权限
      if (!checkProjectPermission(doc.projectId, currentUser._id, 'member')) {
        continue
      }

      const titleMatch = doc.title.toLowerCase().includes(searchTerm)
      const contentMatch = doc.content && doc.content.toLowerCase().includes(searchTerm)

      if (titleMatch || contentMatch) {
        const project = getProjectById(doc.projectId)
        const matchedText = getMatchedText(
          titleMatch ? doc.title : (doc.content || ''),
          keyword,
          100
        )

        results.push({
          type: 'document',
          id: doc._id,
          title: doc.title,
          content: doc.content || '',
          projectId: doc.projectId,
          projectName: project?.name,
          projectColor: project?.color,
          matchedText,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt
        })
      }
    }

    // 按更新时间排序
    results.sort((a, b) => b.updatedAt - a.updatedAt)

    // 限制返回数量
    const limitedResults = results.slice(0, limit)

    return success({
      items: limitedResults,
      total: results.length
    })

  } catch (err) {
    k.logger.error('GlobalSearchError', err instanceof Error ? err.message : String(err))
    return error('Failed to perform global search', 500, err)
  }
})

/**
 * 获取匹配文本片段（带截断和高亮标记）
 * @param text 原始文本
 * @param keyword 搜索关键字
 * @param maxLength 最大长度
 * @returns 截断后的文本，关键字前后用...表示
 */
function getMatchedText(text: string, keyword: string, maxLength: number = 100): string {
  const lowerText = text.toLowerCase()
  const lowerKeyword = keyword.toLowerCase()
  const keywordIndex = lowerText.indexOf(lowerKeyword)

  if (keywordIndex === -1) {
    // 如果没有匹配，直接截断
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
  }

  const keywordLength = keyword.length
  const halfLength = Math.floor((maxLength - keywordLength) / 2)

  let start = Math.max(0, keywordIndex - halfLength)
  let end = Math.min(text.length, keywordIndex + keywordLength + halfLength)

  // 如果开头不是文本开始，添加...
  const prefix = start > 0 ? '...' : ''
  // 如果结尾不是文本结束，添加...
  const suffix = end < text.length ? '...' : ''

  return prefix + text.substring(start, end) + suffix
}
