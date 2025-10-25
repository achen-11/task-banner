/**
 * 项目服务 - 处理项目相关的业务逻辑
 */

import { Project, type ProjectType } from 'code/Models/Project'
import { ProjectMember, type ProjectMemberType } from 'code/Models/ProjectMember'

/**
 * 项目信息接口
 */
export interface ProjectInfo {
  id: number
  name: string
  description: string
  color: string
  creatorId: number
  createdAt: number
  updatedAt: number
}

/**
 * 项目成员信息接口
 */
export interface ProjectMemberInfo {
  id: number
  projectId: number
  userId: number
  role: 'owner' | 'admin' | 'member'
  joinedAt: number
}

/**
 * 创建项目
 * @param data - 项目数据
 * @param creatorId - 创建者 ID
 * @returns 新创建的项目 ID
 */
export function createProject(
  data: { name: string; description?: string; color?: string },
  creatorId: number
): number {
  // 1. 创建项目
  const projectId = Project.create({
    name: data.name,
    description: data.description || '',
    color: data.color || '#6366f1',
    creatorId: creatorId
  })

  // 2. 添加创建者为项目所有者
  ProjectMember.create({
    projectId: projectId,
    userId: creatorId,
    role: 'owner'
  })

  return projectId
}

/**
 * 根据 ID 获取项目
 * @param projectId - 项目 ID
 * @returns 项目信息或 null
 */
export function getProjectById(projectId: number): ProjectInfo | null {
  const project = Project.findById(projectId) as ProjectType | null

  if (!project) {
    return null
  }

  return formatProjectInfo(project)
}

/**
 * 获取用户的项目列表
 * @param userId - 用户 ID
 * @returns 项目列表
 */
export function getUserProjects(userId: number): ProjectInfo[] {
  // 1. 查询用户参与的所有项目成员记录
  const memberRecords = ProjectMember.find({
    userId: userId
  }) as ProjectMemberType[]

  if (!memberRecords || memberRecords.length === 0) {
    return []
  }

  // 2. 获取所有项目 ID
  const projectIds = memberRecords.map(m => m.projectId)

  // 3. 批量查询项目
  const projects = projectIds
    .map(id => Project.findById(id) as ProjectType | null)
    .filter(p => p !== null) as ProjectType[]

  return projects.map(formatProjectInfo)
}

/**
 * 更新项目信息
 * @param projectId - 项目 ID
 * @param data - 更新的数据
 * @returns 是否成功
 */
export function updateProject(
  projectId: number,
  data: { name?: string; description?: string; color?: string }
): boolean {
  return Project.update(projectId, data)
}

/**
 * 删除项目
 * @param projectId - 项目 ID
 * @returns 是否成功
 */
export function deleteProject(projectId: number): boolean {
  // 1. 删除所有项目成员
  const members = ProjectMember.find({ projectId: projectId }) as ProjectMemberType[]
  members.forEach(member => {
    ProjectMember.delete(member.id)
  })

  // 2. 删除项目
  return Project.delete(projectId)
}

/**
 * 添加项目成员
 * @param projectId - 项目 ID
 * @param userId - 用户 ID
 * @param role - 角色
 * @returns 成员 ID
 */
export function addProjectMember(
  projectId: number,
  userId: number,
  role: 'admin' | 'member' = 'member'
): number {
  // 检查是否已经是成员
  const existing = ProjectMember.findOne({
    projectId: projectId,
    userId: userId
  }) as ProjectMemberType | null

  if (existing) {
    throw new Error('User is already a member of this project')
  }

  return ProjectMember.create({
    projectId: projectId,
    userId: userId,
    role: role
  })
}

/**
 * 移除项目成员
 * @param projectId - 项目 ID
 * @param userId - 用户 ID
 * @returns 是否成功
 */
export function removeProjectMember(projectId: number, userId: number): boolean {
  const member = ProjectMember.findOne({
    projectId: projectId,
    userId: userId
  }) as ProjectMemberType | null

  if (!member) {
    return false
  }

  // 不允许移除所有者
  if (member.role === 'owner') {
    throw new Error('Cannot remove project owner')
  }

  return ProjectMember.delete(member.id)
}

/**
 * 获取项目成员列表
 * @param projectId - 项目 ID
 * @returns 成员列表
 */
export function getProjectMembers(projectId: number): ProjectMemberInfo[] {
  const members = ProjectMember.find({ projectId: projectId }) as ProjectMemberType[]

  return members.map(member => ({
    id: member.id,
    projectId: member.projectId,
    userId: member.userId,
    role: member.role as 'owner' | 'admin' | 'member',
    joinedAt: member.createdAt
  }))
}

/**
 * 检查用户是否是项目成员
 * @param projectId - 项目 ID
 * @param userId - 用户 ID
 * @returns 是否是成员
 */
export function isProjectMember(projectId: number, userId: number): boolean {
  const member = ProjectMember.findOne({
    projectId: projectId,
    userId: userId
  }) as ProjectMemberType | null

  return member !== null
}

/**
 * 检查用户权限
 * @param projectId - 项目 ID
 * @param userId - 用户 ID
 * @param requiredRole - 需要的角色（owner > admin > member）
 * @returns 是否有权限
 */
export function checkProjectPermission(
  projectId: number,
  userId: number,
  requiredRole: 'owner' | 'admin' | 'member' = 'member'
): boolean {
  const member = ProjectMember.findOne({
    projectId: projectId,
    userId: userId
  }) as ProjectMemberType | null

  if (!member) {
    return false
  }

  const roleLevel: any = {
    owner: 3,
    admin: 2,
    member: 1
  }

  return roleLevel[member.role] >= roleLevel[requiredRole]
}

/**
 * 格式化项目信息
 */
function formatProjectInfo(project: ProjectType): ProjectInfo {
  return {
    id: project.id,
    name: project.name,
    description: project.description || '',
    color: project.color || '#6366f1',
    creatorId: project.creatorId,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt
  }
}
