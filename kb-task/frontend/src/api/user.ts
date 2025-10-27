/**
 * 用户 API
 */
import request from '@/utils/request'
import type {
  User,
  UpdateUserParams,
  UserListResponse
} from '@/types/user'

/**
 * 获取用户列表（组织内的所有用户）
 */
export function getUserList(): Promise<UserListResponse> {
  return request.get('/api/user/list')
}

/**
 * 更新用户信息
 * @param data 更新数据
 */
export function updateUser(data: UpdateUserParams): Promise<User> {
  return request.put('/api/user/update', data)
}

export default {
  getUserList,
  updateUser
}
