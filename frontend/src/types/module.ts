/**
 * 模块相关类型定义
 */

/**
 * 模块信息
 */
export interface Module {
  _id: string
  projectId: string
  name: string
  color: string
  parentId: string
  order: number
  createdAt: number
  updatedAt: number
}

/**
 * 创建模块参数
 */
export interface CreateModuleParams {
  projectId: string
  name: string
  color?: string
  parentId?: string
}

/**
 * 更新模块参数
 */
export interface UpdateModuleParams {
  id: string
  name?: string
  color?: string
  parentId?: string
  order?: number
}

/**
 * 模块列表响应
 */
export interface ModuleListResponse {
  items: Module[]
  total: number
}