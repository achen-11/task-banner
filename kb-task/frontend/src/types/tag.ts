/**
 * 标签相关类型定义
 */

export interface Tag {
  _id: string
  projectId: string              // 所属项目
  name: string                   // 标签名称（如："讨论"）
  color?: string                 // 标签颜色（可选，UI 展示用）
  prompt?: string                // 关联的提示词（核心字段）
  showInQuickBar: boolean        // 是否显示在快速访问栏
  order: number                  // 排序
  createdAt: number
  updatedAt: number
}

export interface CreateTagParams {
  projectId: string
  name: string
  color?: string
  prompt?: string
  showInQuickBar?: boolean
}

export interface UpdateTagParams {
  id: string
  name?: string
  color?: string
  prompt?: string
  showInQuickBar?: boolean
  order?: number
}

export interface TagListResponse {
  items: Tag[]
  total: number
}
