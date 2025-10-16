// 项目状态枚举
export type ProjectStatus = 'active' | 'completed' | 'paused'

// 任务状态枚举
export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'sent_to_ai' | 'needs_optimization'

// 优先级枚举
export type Priority = 'low' | 'medium' | 'high' | 'urgent'

// 项目接口
export interface Project {
  id: string
  name: string
  description?: string
  status: ProjectStatus
  techStack: string[]
  createdAt: number
  updatedAt: number
}

// 变更日志条目接口
export interface ChangeLogEntry {
  timestamp: number
  field: string
  oldValue: string
  newValue: string
  action: string
}

// 任务接口
export interface Task {
  id: string
  projectId: string
  title: string
  description: string
  status: TaskStatus
  priority: Priority
  tags: string[]
  technicalPoints?: string[]
  referenceLinks?: string[]
  progress: number // 0-100
  changelog: ChangeLogEntry[]
  order: number
  createdAt: number
  updatedAt: number
}

// 导出模板接口
export interface ExportTemplate {
  id: string
  name: string
  content: string
  isDefault: boolean
  createdAt: number
}

// 导出历史接口
export interface ExportHistory {
  id: string
  taskIds: string[]
  templateId: string
  content: string
  exportedAt: number
}
