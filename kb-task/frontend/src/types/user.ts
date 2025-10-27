/**
 * 用户相关类型定义
 */

/**
 * 用户信息
 */
export interface User {
  _id: string
  username: string
  email: string
  displayName: string
  avatar: string
  isAdmin: boolean
  organizationUsername?: string  // 组织中的用户名，用于添加成员
}

/**
 * 更新用户参数
 */
export interface UpdateUserParams {
  userId: string
  displayName?: string
  email?: string
}

/**
 * 用户列表响应
 */
export interface UserListResponse {
  items: User[]
  total: number
}
