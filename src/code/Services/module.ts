/**
 * 模块服务 - 处理模块相关的业务逻辑
 */

import { Module, type ModuleType } from 'code/Models/Module'

/**
 * 模块信息接口
 */
export interface ModuleInfo {
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
 * 创建模块
 * @param data - 模块数据
 * @returns 新创建的模块 ID（字符串类型）
 */
export function createModule(data: {
  projectId: string
  name: string
  color?: string
  parentId?: string
}): string {
  // 1. 获取同级模块的最大 order 值
  const siblings = Module.findAll({
    projectId: data.projectId,
    parentId: data.parentId || ''
  }) as ModuleType[]

  const maxOrder = siblings.reduce((max, module) => Math.max(max, module.order || 0), 0)

  // 2. 创建模块
  const moduleId = Module.create({
    projectId: data.projectId,
    name: data.name,
    color: data.color || '#6B7280',
    parentId: data.parentId || '',
    order: maxOrder + 1
  })

  return moduleId
}

/**
 * 根据 ID 获取模块
 * @param moduleId - 模块 ID（字符串类型）
 * @returns 模块信息或 null
 */
export function getModuleById(moduleId: string): ModuleInfo | null {
  const module = Module.findById(moduleId) as ModuleType | null

  if (!module) {
    return null
  }

  return formatModuleInfo(module)
}

/**
 * 获取项目的所有模块
 * @param projectId - 项目 ID
 * @returns 模块列表
 */
export function getProjectModules(projectId: string): ModuleInfo[] {
  const modules = Module.findAll({ projectId }) as ModuleType[]

  // 按 parentId 和 order 排序（顶级模块优先）
  return modules
    .map(formatModuleInfo)
    .sort((a, b) => {
      // 顶级模块（空 parentId）排在前面
      if (a.parentId === '' && b.parentId !== '') return -1
      if (a.parentId !== '' && b.parentId === '') return 1
      if (a.parentId !== b.parentId) {
        return a.parentId.localeCompare(b.parentId)
      }
      return a.order - b.order
    })
}

/**
 * 更新模块信息
 * @param moduleId - 模块 ID（字符串类型）
 * @param data - 更新的数据
 * @returns 是否成功
 */
export function updateModule(
  moduleId: string,
  data: {
    name?: string
    color?: string
    parentId?: string
    order?: number
  }
): boolean {
  const updateData: any = {}

  if (data.name !== undefined) updateData.name = data.name
  if (data.color !== undefined) updateData.color = data.color
  if (data.parentId !== undefined) updateData.parentId = data.parentId
  if (data.order !== undefined) updateData.order = data.order

  const updatedId = Module.updateById(moduleId, updateData)
  return updatedId !== null && updatedId !== undefined
}

/**
 * 删除模块
 * @param moduleId - 模块 ID（字符串类型）
 * @returns 是否成功
 */
export function deleteModule(moduleId: string): boolean {
  return Module.deleteById(moduleId)
}

/**
 * 格式化模块信息
 */
function formatModuleInfo(module: ModuleType): ModuleInfo {
  return {
    _id: module._id,
    projectId: module.projectId,
    name: module.name,
    color: module.color,
    parentId: module.parentId,
    order: module.order,
    createdAt: module.createdAt,
    updatedAt: module.updatedAt
  }
}
