/**
 * 项目服务 - 处理项目相关的业务逻辑
 */

import { Project, type ProjectType } from 'code/Models/Project'
import { ProjectMember, type ProjectMemberType } from 'code/Models/ProjectMember'
import { Task, type TaskType } from 'code/Models/Task'

/**
 * 项目信息接口
 */
export interface ProjectInfo {
  _id: string // Kooboo 自动生成的主键（字符串类型）
  name: string
  description: string
  color: string
  ownerId: string
  status: string
  icon: string
  order: number
  createdAt: number
  updatedAt: number
}

/**
 * 项目详情信息接口（包含统计数据）
 */
export interface ProjectDetailInfo extends ProjectInfo {
  taskCount: number          // 总任务数
  completedTaskCount: number // 已完成任务数
  memberCount: number        // 成员数量
}

/**
 * 项目成员信息接口
 */
export interface ProjectMemberInfo {
  _id: string // Kooboo 自动生成的主键（字符串类型）
  projectId: string // 外键引用 _id（字符串类型）
  userId: string
  role: 'owner' | 'admin' | 'member'
  joinedAt: number
}

/**
 * 创建项目
 * @param data - 项目数据
 * @param ownerId - 项目所有者 ID
 * @returns 新创建的项目 ID（字符串类型）
 */
export function createProject(
  data: { name: string; description?: string; color?: string },
  ownerId: string
): string {
  // 1. 创建项目
  const projectId = Project.create({
    name: data.name,
    description: data.description || '',
    color: data.color || '#6366f1',
    ownerId: ownerId
  })

  // 2. 添加创建者为项目所有者
  ProjectMember.create({
    projectId: projectId,
    userId: ownerId,
    role: 'owner'
  })

  return projectId
}

/**
 * 根据 ID 获取项目
 * @param projectId - 项目 ID（字符串类型）
 * @returns 项目信息或 null
 */
export function getProjectById(projectId: string): ProjectInfo | null {
  const project = Project.findById(projectId) as ProjectType | null

  if (!project) {
    return null
  }

  return formatProjectInfo(project)
}

/**
 * 根据 ID 获取项目详情（包含统计信息）
 * @param projectId - 项目 ID（字符串类型）
 * @returns 项目详情或 null
 */
export function getProjectDetailById(projectId: string): ProjectDetailInfo | null {
  const project = Project.findById(projectId) as ProjectType | null

  if (!project) {
    return null
  }

  // 1. 获取基础项目信息
  const projectInfo = formatProjectInfo(project)

  // 2. 统计任务数量
  const allTasks = Task.findAll({ projectId: projectId }) as TaskType[]
  const taskCount = allTasks.length
  const completedTaskCount = allTasks.filter(task => task.status === 'completed').length

  // 3. 统计成员数量
  const members = ProjectMember.findAll({ projectId: projectId }) as ProjectMemberType[]
  const memberCount = members.length

  // 4. 返回包含统计信息的项目详情
  return {
    ...projectInfo,
    taskCount,
    completedTaskCount,
    memberCount
  }
}

/**
 * 获取用户的项目列表
 * @param userId - 用户 ID
 * @returns 项目列表
 */
export function getUserProjects(userId: string): ProjectInfo[] {
  // 1. 查询用户参与的所有项目成员记录
  const memberRecords = ProjectMember.findAll({
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
 * @param projectId - 项目 ID（字符串类型）
 * @param data - 更新的数据
 * @returns 是否成功
 */
export function updateProject(
  projectId: string,
  data: { name?: string; description?: string; color?: string }
): boolean {
  const updatedId = Project.updateById(projectId, data)
  return updatedId !== null && updatedId !== undefined
}

/**
 * 删除项目
 * @param projectId - 项目 ID（字符串类型）
 * @returns 是否成功
 */
export function deleteProject(projectId: string): boolean {
  // 1. 删除所有项目成员
  const members = ProjectMember.findAll({ projectId: projectId }) as ProjectMemberType[]
  members.forEach(member => {
    ProjectMember.deleteById(member._id)
  })

  // 2. 删除项目
  return Project.deleteById(projectId)
}

/**
 * 添加项目成员
 * @param projectId - 项目 ID（字符串类型）
 * @param userId - 用户 ID
 * @param role - 角色
 * @returns 成员 ID（字符串类型）
 */
export function addProjectMember(
  projectId: string,
  userId: string,
  role: 'admin' | 'member' = 'member'
): string {
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
 * @param projectId - 项目 ID（字符串类型）
 * @param userId - 用户 ID
 * @returns 是否成功
 */
export function removeProjectMember(projectId: string, userId: string): boolean {
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

  return ProjectMember.deleteById(member._id)
}

/**
 * 获取项目成员列表
 * @param projectId - 项目 ID（字符串类型）
 * @returns 成员列表
 */
export function getProjectMembers(projectId: string): ProjectMemberInfo[] {
  const members = ProjectMember.findAll({ projectId: projectId }) as ProjectMemberType[]

  return members.map(member => ({
    _id: member._id,
    projectId: member.projectId,
    userId: member.userId,
    role: member.role as 'owner' | 'admin' | 'member',
    joinedAt: member.joinedAt
  }))
}

/**
 * 检查用户是否是项目成员
 * @param projectId - 项目 ID（字符串类型）
 * @param userId - 用户 ID
 * @returns 是否是成员
 */
export function isProjectMember(projectId: string, userId: string): boolean {
  const member = ProjectMember.findOne({
    projectId: projectId,
    userId: userId
  }) as ProjectMemberType | null

  return member !== null
}

/**
 * 检查用户权限
 * @param projectId - 项目 ID（字符串类型）
 * @param userId - 用户 ID
 * @param requiredRole - 需要的角色（owner > admin > member）
 * @returns 是否有权限
 */
export function checkProjectPermission(
  projectId: string,
  userId: string,
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
    _id: project._id,
    name: project.name,
    description: project.description || '',
    color: project.color || '#6366f1',
    ownerId: project.ownerId,
    status: project.status || 'active',
    icon: project.icon || '',
    order: project.order || 0,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt
  }
}
