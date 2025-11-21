// @k-url /api/project/{action}

import { success, error } from 'code/Utils/response'
import { getUserInfo } from 'code/Services/user'
import {
  createProject,
  getProjectById,
  getProjectDetailById,
  getUserProjects,
  updateProject,
  deleteProject,
  addProjectMember,
  removeProjectMember,
  getProjectMembers,
  checkProjectPermission
} from 'code/Services/project'

// GET /api/project/list?page=1&size=20
k.api.get("list", () => {
  // 1. 鉴权检查
  if (!k.account.isLogin) {
    return error('Unauthorized', 401)
  }

  // 2. 获取分页参数
  const query = k.request.queryString as unknown as { page: string, size: string }
  const page = parseInt(query?.page) || 1
  const size = parseInt(query?.size) || 20

  // 3. 获取项目列表
  try {
    // 获取当前用户
    const username = k.account.user.current.userName
    const currentUser = getUserInfo(username)

    const projects = getUserProjects(currentUser._id)

    return success({
      items: projects,
      total: projects.length,
      page,
      size
    })

  } catch (err) {
    k.logger.error('GetProjectListError', err instanceof Error ? err.message : String(err))
    return error('Failed to get projects', 500, err)
  }
})

// GET /api/project/detail?id=xxx
k.api.get("detail", () => {
  // 1. 鉴权检查
  if (!k.account.isLogin) {
    return error('Unauthorized', 401)
  }

  // 2. 参数验证
  const query = k.request.queryString as unknown as { id: string }
  const projectId = query.id

  if (!projectId || projectId.trim() === '') {
    return error('Invalid project ID', 400)
  }

  // 3. 获取项目详情（包含统计信息）
  try {
    // 获取当前用户
    const username = k.account.user.current.userName
    const currentUser = getUserInfo(username)

    // 权限检查
    if (!checkProjectPermission(projectId, currentUser._id, 'member')) {
      return error('You do not have permission to access this project', 403)
    }

    const project = getProjectDetailById(projectId)

    if (!project) {
      return error('Project not found', 404)
    }

    return success(project)

  } catch (err) {
    k.logger.error('GetProjectDetailError', err instanceof Error ? err.message : String(err))
    return error('Failed to get project', 500, err)
  }
})

// GET /api/project/members?projectId=xxx
k.api.get("members", () => {
  // 1. 鉴权检查
  if (!k.account.isLogin) {
    return error('Unauthorized', 401)
  }

  // 2. 参数验证
  const query = k.request.queryString as unknown as { projectId: string }
  const projectId = query?.projectId

  if (!projectId || projectId.trim() === '') {
    return error('Invalid project ID', 400)
  }

  // 3. 获取成员列表
  try {
    // 获取当前用户
    const username = k.account.user.current.userName
    const currentUser = getUserInfo(username)

    // 权限检查
    if (!checkProjectPermission(projectId, currentUser._id, 'member')) {
      return error('You do not have permission to view members', 403)
    }

    const memberList = getProjectMembers(projectId)

    return success({
      items: memberList,
      total: memberList.length
    })

  } catch (err) {
    k.logger.error('GetProjectMembersError', err instanceof Error ? err.message : String(err))
    return error('Failed to get members', 500, err)
  }
})

// POST /api/project/create
k.api.post("create", (body: any) => {
  // 1. 鉴权检查
  if (!k.account.isLogin) {
    return error('Unauthorized', 401)
  }

  // 2. 参数验证
  const { name, description, color } = body

  if (!name || name.trim() === '') {
    return error('Project name is required', 400)
  }

  // 3. 创建项目
  try {
    // 获取当前用户
    const username = k.account.user.current.userName
    const currentUser = getUserInfo(username)

    const projectId = createProject(
      {
        name: name.trim(),
        description: description || '',
        color: color || '#6366f1'
      },
      currentUser._id
    )

    // 4. 获取项目详情
    const project = getProjectById(projectId)
    return success(project, 'Project created successfully')

  } catch (err) {
    k.logger.error('CreateProjectError', err instanceof Error ? err.message : String(err))
    return error('Failed to create project', 500, err)
  }
})

// POST /api/project/addMember
k.api.post("addMember", (body: any) => {
  // 1. 鉴权检查
  if (!k.account.isLogin) {
    return error('Unauthorized', 401)
  }

  // 2. 参数验证
  const { projectId, userId, username: targetUsername, role } = body

  if (!projectId || typeof projectId !== 'string' || projectId.trim() === '') {
    return error('Invalid project ID', 400)
  }

  // 需要 userId 或 username 其中之一
  if (!userId && !targetUsername) {
    return error('User ID or username is required', 400)
  }

  // 3. 添加成员
  try {
    // 获取当前用户
    const username = k.account.user.current.userName
    const currentUser = getUserInfo(username)

    // 权限检查（需要 admin 权限）
    if (!checkProjectPermission(projectId, currentUser._id, 'admin')) {
      return error('You do not have permission to add members', 403)
    }

    // 如果提供了 username，先获取或创建用户（自动注册）
    let finalUserId = userId
    if (targetUsername) {
      const targetUser = getUserInfo(targetUsername)
      finalUserId = targetUser._id
    }

    const memberId = addProjectMember(projectId, finalUserId, role || 'member')

    return success({ id: memberId }, 'Member added successfully')

  } catch (err) {
    k.logger.error('AddProjectMemberError', err instanceof Error ? err.message : String(err))
    return error(err instanceof Error ? err.message : 'Failed to add member', 400, err)
  }
})

// PUT /api/project/update
k.api.put("update", (body: any) => {
  // 1. 鉴权检查
  if (!k.account.isLogin) {
    return error('Unauthorized', 401)
  }

  // 2. 参数验证
  const { id, name, description, color, status } = body

  if (!id || typeof id !== 'string' || id.trim() === '') {
    return error('Invalid project ID', 400)
  }

  const projectId = id

  // 3. 更新项目
  try {
    // 获取当前用户
    const username = k.account.user.current.userName
    const currentUser = getUserInfo(username)

    // 权限检查（需要 admin 权限）
    if (!checkProjectPermission(projectId, currentUser._id, 'admin')) {
      return error('You do not have permission to update this project', 403)
    }

    const updated = updateProject(
      projectId,
      {
        name: name?.trim(),
        description: description,
        color: color,
        status: status
      }
    )

    if (!updated) {
      return error('Failed to update project', 500)
    }

    // 获取更新后的项目详情
    const project = getProjectById(projectId)
    return success(project, 'Project updated successfully')

  } catch (err) {
    k.logger.error('UpdateProjectError', err instanceof Error ? err.message : String(err))
    return error('Failed to update project', 500, err)
  }
})

// DELETE /api/project/removeMember
k.api.delete("removeMember", (body: any) => {
  // 1. 鉴权检查
  if (!k.account.isLogin) {
    return error('Unauthorized', 401)
  }

  // 2. 参数验证
  const { projectId, userId } = body

  if (!projectId || typeof projectId !== 'string' || projectId.trim() === '') {
    return error('Invalid project ID', 400)
  }

  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    return error('Invalid user ID', 400)
  }

  // 3. 移除成员
  try {
    // 获取当前用户
    const username = k.account.user.current.userName
    const currentUser = getUserInfo(username)

    // 权限检查（需要 admin 权限）
    if (!checkProjectPermission(projectId, currentUser._id, 'admin')) {
      return error('You do not have permission to remove members', 403)
    }

    const removed = removeProjectMember(projectId, userId)

    if (!removed) {
      return error('Member not found', 404)
    }

    return success(null, 'Member removed successfully')

  } catch (err) {
    k.logger.error('RemoveProjectMemberError', err instanceof Error ? err.message : String(err))
    return error(err instanceof Error ? err.message : 'Failed to remove member', 400, err)
  }
})

// DELETE /api/project/delete
k.api.delete("delete", (body: any) => {
  // 1. 鉴权检查
  if (!k.account.isLogin) {
    return error('Unauthorized', 401)
  }

  // 2. 参数验证
  const { id } = body

  if (!id || typeof id !== 'string' || id.trim() === '') {
    return error('Invalid project ID', 400)
  }

  const projectId = id

  // 3. 删除项目
  try {
    // 获取当前用户
    const username = k.account.user.current.userName
    const currentUser = getUserInfo(username)

    // 权限检查（需要 owner 权限）
    if (!checkProjectPermission(projectId, currentUser._id, 'owner')) {
      return error('Only project owner can delete the project', 403)
    }

    const deleted = deleteProject(projectId)

    if (!deleted) {
      return error('Failed to delete project', 500)
    }

    return success(null, 'Project deleted successfully')

  } catch (err) {
    k.logger.error('DeleteProjectError', err instanceof Error ? err.message : String(err))
    return error('Failed to delete project', 500, err)
  }
})
