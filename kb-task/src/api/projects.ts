// @k-url /api/projects

import { getUserInfo } from '../code/Services/user'
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
} from '../code/Services/project'

// 子路由：获取项目成员列表
// GET /api/projects/{id}/members
k.api.get("{id}/members", (id: string) => {
  // 1. 鉴权检查
  if (!k.account.isLogin) {
    k.response.json({
      code: 401,
      message: 'Unauthorized',
      data: null
    })
    return k.api.httpCode(401)
  }

  // 2. 获取当前用户
  const username = k.account.user.current.userName
  const currentUser = getUserInfo(username)

  // 3. 参数验证
  const projectId = parseInt(id)
  if (!projectId || isNaN(projectId)) {
    k.response.json({
      code: 400,
      message: 'Invalid project ID',
      data: null
    })
    return k.api.httpCode(400)
  }

  // 4. 权限检查
  if (!checkProjectPermission(projectId, currentUser.id, 'member')) {
    k.response.json({
      code: 403,
      message: 'You do not have permission to view members',
      data: null
    })
    return k.api.httpCode(403)
  }

  // 5. 获取成员列表
  try {
    const memberList = getProjectMembers(projectId)
    k.response.json({
      code: 200,
      message: 'Success',
      data: memberList,
      total: memberList.length
    })
    return k.api.ok()
  } catch (error) {
    k.response.json({
      code: 500,
      message: error instanceof Error ? error.message : 'Unknown error',
      data: null
    })
    return k.api.httpCode(500)
  }
})

// 子路由：获取项目详情
// GET /api/projects/{id}
k.api.get("{id}", (id) => {
  // 1. 鉴权检查
  if (!k.account.isLogin) {
    k.response.json({
      code: 401,
      message: 'Unauthorized',
      data: null
    })
    return k.api.httpCode(401)
  }

  // 2. 获取当前用户
  const username = k.account.user.current.userName
  const currentUser = getUserInfo(username)

  // 3. 参数验证
  const projectId = parseInt(id)
  if (!projectId || isNaN(projectId)) {
    k.response.json({
      code: 400,
      message: 'Invalid project ID',
      data: null
    })
    return k.api.httpCode(400)
  }

  // 4. 权限检查
  if (!checkProjectPermission(projectId, currentUser.id, 'member')) {
    k.response.json({
      code: 403,
      message: 'You do not have permission to access this project',
      data: null
    })
    return k.api.httpCode(403)
  }

  // 5. 获取项目详情
  try {
    const project = getProjectById(projectId)
    if (!project) {
      k.response.json({
        code: 404,
        message: 'Project not found',
        data: null
      })
      return k.api.httpCode(404)
    }

    k.response.json({
      code: 200,
      message: 'Success',
      data: project
    })
    return k.api.ok()
  } catch (error) {
    k.response.json({
      code: 500,
      message: error instanceof Error ? error.message : 'Unknown error',
      data: null
    })
    return k.api.httpCode(500)
  }
})

// 通配路由：获取项目列表
// GET /api/projects
k.api.get(() => {
  // 1. 鉴权检查
  if (!k.account.isLogin) {
    k.response.json({
      code: 401,
      message: 'Unauthorized',
      data: null
    })
    return k.api.httpCode(401)
  }

  // 2. 获取当前用户
  const username = k.account.user.current.userName
  const currentUser = getUserInfo(username)

  // 3. 获取项目列表
  try {
    const projects = getUserProjects(currentUser.id)
    k.response.json({
      code: 200,
      message: 'Success',
      data: projects,
      total: projects.length
    })
    return k.api.ok()
  } catch (error) {
    k.response.json({
      code: 500,
      message: error instanceof Error ? error.message : 'Unknown error',
      data: null
    })
    return k.api.httpCode(500)
  }
})

// POST /api/projects - 创建项目
k.api.post((body) => {
  // 1. 鉴权检查
  if (!k.account.isLogin) {
    k.response.json({
      code: 401,
      message: 'Unauthorized',
      data: null
    })
    return k.api.httpCode(401)
  }

  // 2. 获取当前用户
  const username = k.account.user.current.userName
  const currentUser = getUserInfo(username)

  // 3. 参数验证
  const { name, description, color } = body

  if (!name || name.trim() === '') {
    k.response.json({
      code: 400,
      message: 'Project name is required',
      data: null
    })
    return k.api.httpCode(400)
  }

  // 4. 创建项目
  try {
    const projectId = createProject(
      {
        name: name.trim(),
        description: description || '',
        color: color || '#6366f1'
      },
      currentUser.id
    )

    // 5. 获取项目详情
    const project = getProjectById(projectId)
    k.response.json({
      code: 200,
      message: 'Project created successfully',
      data: project
    })
    return k.api.ok()
  } catch (error) {
    k.response.json({
      code: 500,
      message: error instanceof Error ? error.message : 'Unknown error',
      data: null
    })
    return k.api.httpCode(500)
  }
})

// POST /api/projects/{id}/members - 添加项目成员
k.api.post("{id}/members", (id, body) => {
  // 1. 鉴权检查
  if (!k.account.isLogin) {
    k.response.json({
      code: 401,
      message: 'Unauthorized',
      data: null
    })
    return k.api.httpCode(401)
  }

  // 2. 获取当前用户
  const username = k.account.user.current.userName
  const currentUser = getUserInfo(username)

  // 3. 参数验证
  const projectId = parseInt(id)
  if (!projectId || isNaN(projectId)) {
    k.response.json({
      code: 400,
      message: 'Invalid project ID',
      data: null
    })
    return k.api.httpCode(400)
  }

  // 4. 权限检查（需要 admin 权限）
  if (!checkProjectPermission(projectId, currentUser.id, 'admin')) {
    k.response.json({
      code: 403,
      message: 'You do not have permission to add members',
      data: null
    })
    return k.api.httpCode(403)
  }

  // 5. 获取请求参数
  const { userId, role } = body

  if (!userId) {
    k.response.json({
      code: 400,
      message: 'User ID is required',
      data: null
    })
    return k.api.httpCode(400)
  }

  // 6. 添加成员
  try {
    const memberId = addProjectMember(projectId, userId, role || 'member')
    k.response.json({
      code: 200,
      message: 'Member added successfully',
      data: { id: memberId }
    })
    return k.api.ok()
  } catch (error) {
    k.response.json({
      code: 400,
      message: error instanceof Error ? error.message : 'Unknown error',
      data: null
    })
    return k.api.httpCode(400)
  }
})

// PUT /api/projects/{id} - 更新项目
k.api.put("{id}", (id, body) => {
  // 1. 鉴权检查
  if (!k.account.isLogin) {
    k.response.json({
      code: 401,
      message: 'Unauthorized',
      data: null
    })
    return k.api.httpCode(401)
  }

  // 2. 获取当前用户
  const username = k.account.user.current.userName
  const currentUser = getUserInfo(username)

  // 3. 参数验证
  const projectId = parseInt(id)
  if (!projectId || isNaN(projectId)) {
    k.response.json({
      code: 400,
      message: 'Invalid project ID',
      data: null
    })
    return k.api.httpCode(400)
  }

  // 4. 权限检查（需要 admin 权限）
  if (!checkProjectPermission(projectId, currentUser.id, 'admin')) {
    k.response.json({
      code: 403,
      message: 'You do not have permission to update this project',
      data: null
    })
    return k.api.httpCode(403)
  }

  // 5. 获取请求参数
  const { name, description, color } = body

  // 6. 更新项目
  try {
    const success = updateProject(projectId, {
      name: name?.trim(),
      description: description,
      color: color
    })

    if (!success) {
      k.response.json({
        code: 500,
        message: 'Failed to update project',
        data: null
      })
      return k.api.httpCode(500)
    }

    // 7. 获取更新后的项目详情
    const project = getProjectById(projectId)
    k.response.json({
      code: 200,
      message: 'Project updated successfully',
      data: project
    })
    return k.api.ok()
  } catch (error) {
    k.response.json({
      code: 500,
      message: error instanceof Error ? error.message : 'Unknown error',
      data: null
    })
    return k.api.httpCode(500)
  }
})

// DELETE /api/projects/{id}/members/{userId} - 移除项目成员
k.api.delete("{id}/members/{userId}", (id, userId) => {
  // 1. 鉴权检查
  if (!k.account.isLogin) {
    k.response.json({
      code: 401,
      message: 'Unauthorized',
      data: null
    })
    return k.api.httpCode(401)
  }

  // 2. 获取当前用户
  const username = k.account.user.current.userName
  const currentUser = getUserInfo(username)

  // 3. 参数验证
  const projectId = parseInt(id)
  const memberUserId = parseInt(userId)

  if (!projectId || isNaN(projectId)) {
    k.response.json({
      code: 400,
      message: 'Invalid project ID',
      data: null
    })
    return k.api.httpCode(400)
  }

  if (!memberUserId || isNaN(memberUserId)) {
    k.response.json({
      code: 400,
      message: 'Invalid user ID',
      data: null
    })
    return k.api.httpCode(400)
  }

  // 4. 权限检查（需要 admin 权限）
  if (!checkProjectPermission(projectId, currentUser.id, 'admin')) {
    k.response.json({
      code: 403,
      message: 'You do not have permission to remove members',
      data: null
    })
    return k.api.httpCode(403)
  }

  // 5. 移除成员
  try {
    const success = removeProjectMember(projectId, memberUserId)

    if (!success) {
      k.response.json({
        code: 404,
        message: 'Member not found',
        data: null
      })
      return k.api.httpCode(404)
    }

    k.response.json({
      code: 200,
      message: 'Member removed successfully',
      data: null
    })
    return k.api.ok()
  } catch (error) {
    k.response.json({
      code: 400,
      message: error instanceof Error ? error.message : 'Unknown error',
      data: null
    })
    return k.api.httpCode(400)
  }
})

// DELETE /api/projects/{id} - 删除项目
k.api.delete("{id}", (id) => {
  // 1. 鉴权检查
  if (!k.account.isLogin) {
    k.response.json({
      code: 401,
      message: 'Unauthorized',
      data: null
    })
    return k.api.httpCode(401)
  }

  // 2. 获取当前用户
  const username = k.account.user.current.userName
  const currentUser = getUserInfo(username)

  // 3. 参数验证
  const projectId = parseInt(id)
  if (!projectId || isNaN(projectId)) {
    k.response.json({
      code: 400,
      message: 'Invalid project ID',
      data: null
    })
    return k.api.httpCode(400)
  }

  // 4. 权限检查（需要 owner 权限）
  if (!checkProjectPermission(projectId, currentUser.id, 'owner')) {
    k.response.json({
      code: 403,
      message: 'Only project owner can delete the project',
      data: null
    })
    return k.api.httpCode(403)
  }

  // 5. 删除项目
  try {
    const success = deleteProject(projectId)

    if (!success) {
      k.response.json({
        code: 500,
        message: 'Failed to delete project',
        data: null
      })
      return k.api.httpCode(500)
    }

    k.response.json({
      code: 200,
      message: 'Project deleted successfully',
      data: null
    })
    return k.api.ok()
  } catch (error) {
    k.response.json({
      code: 500,
      message: error instanceof Error ? error.message : 'Unknown error',
      data: null
    })
    return k.api.httpCode(500)
  }
})
