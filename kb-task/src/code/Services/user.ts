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
  const email = k.account.user.current.email || `${userName}@example.com`

  // 4. 创建新用户记录（自动注册，返回用户 ID）
  const userId = User.create({
    username: userName,
    email: email,
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
