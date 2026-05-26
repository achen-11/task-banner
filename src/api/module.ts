// @k-url /api/module/{action}

import { success, error } from 'code/Utils/response'
import { getCurrentAuthUser } from 'code/Services/auth'
import { getUserInfo } from 'code/Services/user'
import {
  createModule,
  getModuleById,
  getProjectModules,
  updateModule,
  deleteModule
} from 'code/Services/module'
import { checkProjectPermission } from 'code/Services/project'

// GET /api/module/list?projectId=xxx
k.api.get("list", () => {
  // 2. 参数验证
  const query = k.request.queryString as unknown as { projectId: string }
  const projectId = query.projectId

  if (!projectId || projectId.trim() === '') {
    return error('Invalid project ID', 400)
  }

  // 3. 获取模块列表
  try {
    // 获取当前用户
    const currentUser = getCurrentAuthUser()
    if (!currentUser) {
      return error('Unauthorized', 401)
    }
    // 权限检查（需要是项目成员）
    if (!checkProjectPermission(projectId, currentUser._id, 'member')) {
      return error('You do not have permission to view modules', 403)
    }

    const modules = getProjectModules(projectId)

    return success({
      items: modules,
      total: modules.length
    })

  } catch (err) {
    k.logger.error('GetModuleListError', err instanceof Error ? err.message : String(err))
    return error('Failed to get modules', 500, err)
  }
})

// GET /api/module/detail?id=xxx
k.api.get("detail", () => {
  // 2. 参数验证
  const query = k.request.queryString as unknown as { id: string }
  const moduleId = query.id

  if (!moduleId || moduleId.trim() === '') {
    return error('Invalid module ID', 400)
  }

  // 3. 获取模块详情
  try {
    // 获取当前用户
    const currentUser = getCurrentAuthUser()
    if (!currentUser) {
      return error('Unauthorized', 401)
    }
    const module = getModuleById(moduleId)

    if (!module) {
      return error('Module not found', 404)
    }

    // 权限检查（需要是项目成员）
    if (!checkProjectPermission(module.projectId, currentUser._id, 'member')) {
      return error('You do not have permission to view this module', 403)
    }

    return success(module)

  } catch (err) {
    k.logger.error('GetModuleDetailError', err instanceof Error ? err.message : String(err))
    return error('Failed to get module', 500, err)
  }
})

// POST /api/module/create
k.api.post("create", (body: any) => {
  // 2. 参数验证
  const { projectId, name, color, parentId } = body

  if (!projectId || typeof projectId !== 'string' || projectId.trim() === '') {
    return error('Invalid project ID', 400)
  }

  if (!name || name.trim() === '') {
    return error('Module name is required', 400)
  }

  // 3. 创建模块
  try {
    // 获取当前用户
    const currentUser = getCurrentAuthUser()
    if (!currentUser) {
      return error('Unauthorized', 401)
    }
    // 权限检查（需要是项目管理员）
    if (!checkProjectPermission(projectId, currentUser._id, 'admin')) {
      return error('You do not have permission to create modules', 403)
    }

    const moduleId = createModule({
      projectId,
      name: name.trim(),
      color,
      parentId
    })

    // 获取创建的模块详情
    const module = getModuleById(moduleId)
    return success(module, 'Module created successfully')

  } catch (err) {
    k.logger.error('CreateModuleError', err instanceof Error ? err.message : String(err))
    return error('Failed to create module', 500, err)
  }
})

// PUT /api/module/update
k.api.put("update", (body: any) => {
  // 2. 参数验证
  const { id, name, color, parentId, order } = body

  if (!id || typeof id !== 'string' || id.trim() === '') {
    return error('Invalid module ID', 400)
  }

  const moduleId = id

  // 3. 更新模块
  try {
    // 获取当前用户
    const currentUser = getCurrentAuthUser()
    if (!currentUser) {
      return error('Unauthorized', 401)
    }
    // 获取模块信息以检查权限
    const module = getModuleById(moduleId)

    if (!module) {
      return error('Module not found', 404)
    }

    // 权限检查（需要是项目管理员）
    if (!checkProjectPermission(module.projectId, currentUser._id, 'admin')) {
      return error('You do not have permission to update this module', 403)
    }

    const updated = updateModule(moduleId, {
      name: name?.trim(),
      color,
      parentId,
      order
    })

    if (!updated) {
      return error('Failed to update module', 500)
    }

    // 获取更新后的模块详情
    const updatedModule = getModuleById(moduleId)
    return success(updatedModule, 'Module updated successfully')

  } catch (err) {
    k.logger.error('UpdateModuleError', err instanceof Error ? err.message : String(err))
    return error('Failed to update module', 500, err)
  }
})

// DELETE /api/module/delete
k.api.delete("delete", (body: any) => {
  // 2. 参数验证
  const { id } = body

  if (!id || typeof id !== 'string' || id.trim() === '') {
    return error('Invalid module ID', 400)
  }

  const moduleId = id

  // 3. 删除模块
  try {
    // 获取当前用户
    const currentUser = getCurrentAuthUser()
    if (!currentUser) {
      return error('Unauthorized', 401)
    }
    // 获取模块信息以检查权限
    const module = getModuleById(moduleId)

    if (!module) {
      return error('Module not found', 404)
    }

    // 权限检查（需要是项目管理员）
    if (!checkProjectPermission(module.projectId, currentUser._id, 'admin')) {
      return error('You do not have permission to delete this module', 403)
    }

    const deleted = deleteModule(moduleId)

    if (!deleted) {
      return error('Failed to delete module', 500)
    }

    return success(null, 'Module deleted successfully')

  } catch (err) {
    k.logger.error('DeleteModuleError', err instanceof Error ? err.message : String(err))
    return error('Failed to delete module', 500, err)
  }
})
