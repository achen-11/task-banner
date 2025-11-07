/**
 * 模块 API
 */
import request from '@/utils/request'
import type { Module, CreateModuleParams, UpdateModuleParams, ModuleListResponse } from '@/types/module'

/**
 * 获取项目模块列表
 * @param projectId 项目 ID
 */
export function getModuleList(projectId: string): Promise<ModuleListResponse> {
  return request.get('/api/module/list', {
    params: { projectId }
  })
}

/**
 * 获取模块详情
 * @param id 模块 ID
 */
export function getModuleDetail(id: string): Promise<Module> {
  return request.get('/api/module/detail', {
    params: { id }
  })
}

/**
 * 创建模块
 * @param data 创建参数
 */
export function createModule(data: CreateModuleParams): Promise<Module> {
  return request.post('/api/module/create', data)
}

/**
 * 更新模块
 * @param data 更新参数
 */
export function updateModule(data: UpdateModuleParams): Promise<Module> {
  return request.put('/api/module/update', data)
}

/**
 * 删除模块
 * @param id 模块 ID
 */
export function deleteModule(id: string): Promise<void> {
  return request.delete('/api/module/delete', {
    data: { id }
  })
}