/**
 * 搜索相关类型定义
 */

export type SearchResultType = 'task' | 'comment' | 'document'

export interface SearchResultItem {
  type: SearchResultType
  id: string
  title: string
  content: string
  projectId: string
  projectName?: string
  projectColor?: string
  matchedText?: string
  taskId?: string // 对于评论类型，这是所属任务的ID
  createdAt: number
  updatedAt: number
}

export interface GlobalSearchResponse {
  items: SearchResultItem[]
  total: number
}

export interface GlobalSearchParams {
  keyword: string
  limit?: number
  includeArchived?: boolean
}
