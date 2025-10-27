/**
 * 用户服务 - 获取用户信息（自动注册）
 */

import { User, type UserType } from 'code/Models/User'

export interface UserInfo {
  _id: string
  username: string
  email: string
  displayName: string
  avatar: string
  isAdmin: boolean
}

/**
 * 根据用户名获取用户信息（自动注册）
 * 如果用户不存在于数据库，则从 Kooboo 账户系统获取信息并自动创建
 *
 * @param username - 用户名
 * @returns 用户信息对象
 */
export function getUserInfo(username: string): UserInfo {
  // 1. 先从数据库查询用户
  let userRecord = User.findOne({ username: username }) as UserType | null

  // 2. 如果用户已存在，直接返回
  if (userRecord) {
    return formatUserInfo(userRecord)
  }

  // 3. 用户不存在，从 Kooboo 账户系统获取信息
  const koobooUser = k.account.user.get(username)

  if (!koobooUser) {
    throw new Error(`User not found in Kooboo account system: ${username}`)
  }

  const { fullName, userName, isAdmin } = koobooUser

  // 使用目标用户的 email，如果没有则生成唯一的默认 email
  // 注意：不要使用 k.account.user.current.email（那是当前登录用户的 email）
  // 检查 email 是否有效（不是 null、undefined 或空字符串）
  const userEmail = (koobooUser.email && koobooUser.email.trim() !== '')
    ? koobooUser.email
    : `${userName}@example.com`

  // 4. 创建新用户记录（自动注册，返回用户 ID）
  const userId = User.create({
    username: userName,
    email: userEmail,
    password: '', // Kooboo 统一认证，不需要本地密码
    displayName: fullName || userName,
    avatar: '',
    isAdmin: isAdmin || false
  })

  // 5. 根据 ID 查询新创建的用户记录
  userRecord = User.findById(userId) as UserType

  if (!userRecord) {
    throw new Error('Failed to create user: user not found after creation')
  }

  return formatUserInfo(userRecord)
}

/**
 * 根据用户 ID 获取用户信息
 * @param userId - 用户 ID
 * @returns 用户信息对象或 null
 */
export function getUserById(userId: string): UserInfo | null {
  const userRecord = User.findById(userId) as UserType | null

  if (!userRecord) {
    return null
  }

  return formatUserInfo(userRecord)
}

/**
 * 更新用户信息
 * @param userId - 用户 ID
 * @param data - 要更新的数据
 * @returns 是否更新成功
 */
export function updateUserInfo(userId: string, data: {
  displayName?: string
  email?: string
  avatar?: string
}): boolean {
  const user = User.findById(userId) as UserType | null

  if (!user) {
    throw new Error('User not found')
  }

  // 只允许更新 displayName, email, avatar
  // username 不允许修改
  const updateData: any = {}
  if (data.displayName !== undefined) updateData.displayName = data.displayName
  if (data.email !== undefined) updateData.email = data.email
  if (data.avatar !== undefined) updateData.avatar = data.avatar

  return User.updateById(userId, updateData)
}

/**
 * 获取所有用户列表
 * @returns 用户信息列表
 */
export function getAllUsers(): UserInfo[] {
  const users = User.findAll({}) as UserType[]

  return users.map(user => formatUserInfo(user))
}

/**
 * 格式化用户信息
 * 将数据库记录转换为统一的 UserInfo 格式
 */
function formatUserInfo(userRecord: UserType): UserInfo {
  return {
    _id: userRecord._id,
    username: userRecord.username,
    email: userRecord.email,
    displayName: userRecord.displayName || userRecord.username,
    avatar: userRecord.avatar || '',
    isAdmin: userRecord.isAdmin || false
  }
}
