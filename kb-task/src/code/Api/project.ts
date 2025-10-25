/**
 * 项目 API - RESTful 接口
 *
 * 路由：
 * - POST   /api/projects          创建项目
 * - GET    /api/projects          获取项目列表
 * - GET    /api/projects/:id      获取项目详情
 * - PUT    /api/projects/:id      更新项目
 * - DELETE /api/projects/:id      删除项目
 * - POST   /api/projects/:id/members     添加成员
 * - DELETE /api/projects/:id/members/:userId  移除成员
 * - GET    /api/projects/:id/members     获取成员列表
 */

import { getCurrentUser } from 'code/Services/user'
import {
  createProject,
  getProjectById,
  getUserProjects,
  updateProject,
  deleteProject,
  addProjectMember,
  removeProjectMember,
  getProjectMembers,
  checkProjectPermission
} from 'code/Services/project'

/**
 * API: 创建项目
 */
export function create() {
  // 1. 鉴权检查
  if (!k.account.isLogin) {
    return k.response.unauthorized()
  }

  // 2. 获取当前用户
  const username = k.account.user.current.userName
  const currentUser = getCurrentUser(username)

  // 3. 获取请求参数
  const { name, description, color } = k.request.body

  // 4. 参数验证
  if (!name || name.trim() === '') {
    return k.response.badRequest('Project name is required')
  }

  // 5. 创建项目
  try {
    const projectId = createProject(
      {
        name: name.trim(),
        description: description || '',
        color: color || '#6366f1'
      },
      currentUser.id
    )

    // 6. 获取项目详情
    const project = getProjectById(projectId)

    return k.response.success({
      message: 'Project created successfully',
      data: project
    })
  } catch (error: any) {
    return k.response.serverError(error.message)
  }
}

/**
 * API: 获取项目列表
 */
export function list() {
  // 1. 鉴权检查
  if (!k.account.isLogin) {
    return k.response.unauthorized()
  }

  // 2. 获取当前用户
  const username = k.account.user.current.userName
  const currentUser = getCurrentUser(username)

  // 3. 获取项目列表
  try {
    const projects = getUserProjects(currentUser.id)

    return k.response.success({
      data: projects,
      total: projects.length
    })
  } catch (error: any) {
    return k.response.serverError(error.message)
  }
}

/**
 * API: 获取项目详情
 */
export function detail() {
  // 1. 鉴权检查
  if (!k.account.isLogin) {
    return k.response.unauthorized()
  }

  // 2. 获取当前用户
  const username = k.account.user.current.userName
  const currentUser = getCurrentUser(username)

  // 3. 获取项目 ID
  const projectId = parseInt(k.request.params.id)

  if (!projectId || isNaN(projectId)) {
    return k.response.badRequest('Invalid project ID')
  }

  // 4. 权限检查
  if (!checkProjectPermission(projectId, currentUser.id, 'member')) {
    return k.response.forbidden('You do not have permission to access this project')
  }

  // 5. 获取项目详情
  try {
    const project = getProjectById(projectId)

    if (!project) {
      return k.response.notFound('Project not found')
    }

    return k.response.success({ data: project })
  } catch (error: any) {
    return k.response.serverError(error.message)
  }
}

/**
 * API: 更新项目
 */
export function update() {
  // 1. 鉴权检查
  if (!k.account.isLogin) {
    return k.response.unauthorized()
  }

  // 2. 获取当前用户
  const username = k.account.user.current.userName
  const currentUser = getCurrentUser(username)

  // 3. 获取项目 ID
  const projectId = parseInt(k.request.params.id)

  if (!projectId || isNaN(projectId)) {
    return k.response.badRequest('Invalid project ID')
  }

  // 4. 权限检查（需要 admin 权限）
  if (!checkProjectPermission(projectId, currentUser.id, 'admin')) {
    return k.response.forbidden('You do not have permission to update this project')
  }

  // 5. 获取请求参数
  const { name, description, color } = k.request.body

  // 6. 更新项目
  try {
    const success = updateProject(projectId, {
      name: name?.trim(),
      description: description,
      color: color
    })

    if (!success) {
      return k.response.serverError('Failed to update project')
    }

    // 7. 获取更新后的项目详情
    const project = getProjectById(projectId)

    return k.response.success({
      message: 'Project updated successfully',
      data: project
    })
  } catch (error: any) {
    return k.response.serverError(error.message)
  }
}

/**
 * API: 删除项目
 */
export function remove() {
  // 1. 鉴权检查
  if (!k.account.isLogin) {
    return k.response.unauthorized()
  }

  // 2. 获取当前用户
  const username = k.account.user.current.userName
  const currentUser = getCurrentUser(username)

  // 3. 获取项目 ID
  const projectId = parseInt(k.request.params.id)

  if (!projectId || isNaN(projectId)) {
    return k.response.badRequest('Invalid project ID')
  }

  // 4. 权限检查（需要 owner 权限）
  if (!checkProjectPermission(projectId, currentUser.id, 'owner')) {
    return k.response.forbidden('Only project owner can delete the project')
  }

  // 5. 删除项目
  try {
    const success = deleteProject(projectId)

    if (!success) {
      return k.response.serverError('Failed to delete project')
    }

    return k.response.success({ message: 'Project deleted successfully' })
  } catch (error: any) {
    return k.response.serverError(error.message)
  }
}

/**
 * API: 添加项目成员
 */
export function addMember() {
  // 1. 鉴权检查
  if (!k.account.isLogin) {
    return k.response.unauthorized()
  }

  // 2. 获取当前用户
  const username = k.account.user.current.userName
  const currentUser = getCurrentUser(username)

  // 3. 获取项目 ID
  const projectId = parseInt(k.request.params.id)

  if (!projectId || isNaN(projectId)) {
    return k.response.badRequest('Invalid project ID')
  }

  // 4. 权限检查（需要 admin 权限）
  if (!checkProjectPermission(projectId, currentUser.id, 'admin')) {
    return k.response.forbidden('You do not have permission to add members')
  }

  // 5. 获取请求参数
  const { userId, role } = k.request.body

  if (!userId) {
    return k.response.badRequest('User ID is required')
  }

  // 6. 添加成员
  try {
    const memberId = addProjectMember(projectId, userId, role || 'member')

    return k.response.success({
      message: 'Member added successfully',
      data: { id: memberId }
    })
  } catch (error: any) {
    return k.response.badRequest(error.message)
  }
}

/**
 * API: 移除项目成员
 */
export function removeMember() {
  // 1. 鉴权检查
  if (!k.account.isLogin) {
    return k.response.unauthorized()
  }

  // 2. 获取当前用户
  const username = k.account.user.current.userName
  const currentUser = getCurrentUser(username)

  // 3. 获取项目 ID 和用户 ID
  const projectId = parseInt(k.request.params.id)
  const userId = parseInt(k.request.params.userId)

  if (!projectId || isNaN(projectId)) {
    return k.response.badRequest('Invalid project ID')
  }

  if (!userId || isNaN(userId)) {
    return k.response.badRequest('Invalid user ID')
  }

  // 4. 权限检查（需要 admin 权限）
  if (!checkProjectPermission(projectId, currentUser.id, 'admin')) {
    return k.response.forbidden('You do not have permission to remove members')
  }

  // 5. 移除成员
  try {
    const success = removeProjectMember(projectId, userId)

    if (!success) {
      return k.response.notFound('Member not found')
    }

    return k.response.success({ message: 'Member removed successfully' })
  } catch (error: any) {
    return k.response.badRequest(error.message)
  }
}

/**
 * API: 获取项目成员列表
 */
export function members() {
  // 1. 鉴权检查
  if (!k.account.isLogin) {
    return k.response.unauthorized()
  }

  // 2. 获取当前用户
  const username = k.account.user.current.userName
  const currentUser = getCurrentUser(username)

  // 3. 获取项目 ID
  const projectId = parseInt(k.request.params.id)

  if (!projectId || isNaN(projectId)) {
    return k.response.badRequest('Invalid project ID')
  }

  // 4. 权限检查
  if (!checkProjectPermission(projectId, currentUser.id, 'member')) {
    return k.response.forbidden('You do not have permission to view members')
  }

  // 5. 获取成员列表
  try {
    const memberList = getProjectMembers(projectId)

    return k.response.success({
      data: memberList,
      total: memberList.length
    })
  } catch (error: any) {
    return k.response.serverError(error.message)
  }
}
