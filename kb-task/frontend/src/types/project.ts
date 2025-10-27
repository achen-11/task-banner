/**
 * 项目相关类型定义
 */

/**
 * 项目信息
 */
export interface Project {
  _id: string
  name: string
  description: string
  color: string
  ownerId: string
  status: 'active' | 'completed' | 'paused'
  icon: string
  order: number
  createdAt: number
  updatedAt: number

  // 统计信息（可选，从 API detail 接口返回）
  taskCount?: number          // 总任务数
  completedTaskCount?: number // 已完成任务数
  memberCount?: number        // 成员数量
}

/**
 * 项目成员信息
 */
export interface ProjectMember {
  _id: string
  projectId: string
  userId: string
  role: 'owner' | 'admin' | 'member'
  joinedAt: number
  // 用户详细信息（可能由后端填充）
  displayName?: string
  username?: string
  email?: string
  avatar?: string
}

/**
 * 创建项目参数
 */
export interface CreateProjectParams {
  name: string
  description?: string
  color?: string
}

/**
 * 更新项目参数
 */
export interface UpdateProjectParams {
  id: string
  name?: string
  description?: string
  color?: string
}

/**
 * 添加成员参数
 */
export interface AddMemberParams {
  projectId: string
  userId?: string
  username?: string  // 组织用户名，用于自动注册
  role?: 'admin' | 'member'
}

/**
 * 移除成员参数
 */
export interface RemoveMemberParams {
  projectId: string
  userId: string
}

/**
 * 项目列表响应
 */
export interface ProjectListResponse {
  items: Project[]
  total: number
  page: number
  size: number
}

/**
 * 成员列表响应
 */
export interface MemberListResponse {
  items: ProjectMember[]
  total: number
}
