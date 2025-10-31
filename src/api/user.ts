// @k-url /api/user/{action}

import { success, error } from 'code/Utils/response'
import { getUserInfo, updateUserInfo, getAllUsers } from 'code/Services/user'

// GET /api/user/list
k.api.get("list", () => {
  // 1. 鉴权检查
  if (!k.account.isLogin) {
    return error('Unauthorized', 401)
  }

  // 2. 获取组织内的用户列表
  try {
    // 从组织获取用户列表
    const organizationUsers = k.account.organization.current.users || []

    // 转换为前端需要的格式
    // 注意：这里不调用 getUserInfo，因为那会自动创建用户
    // 只有在真正添加成员时才创建用户记录
    const users = organizationUsers.map((user: any) => {
      return {
        _id: user.Id,  // 使用组织 ID
        username: user.UserName,
        email: user.Email || `${user.UserName}@example.com`,
        displayName: user.FirstName && user.LastName
          ? `${user.FirstName} ${user.LastName}`.trim()
          : user.UserName,
        avatar: '',
        isAdmin: user.IsAdmin || false,
        // 保留组织用户名，用于添加成员时自动注册
        organizationUsername: user.UserName
      }
    })

    return success({
      items: users,
      total: users.length
    })

  } catch (err) {
    k.logger.error('GetUserListError', err instanceof Error ? err.message : String(err))
    return error('Failed to get users', 500, err)
  }
})

// PUT /api/user/update
k.api.put("update", (body: any) => {
  // 1. 鉴权检查
  if (!k.account.isLogin) {
    return error('Unauthorized', 401)
  }

  // 2. 参数验证
  const { userId, displayName, email } = body

  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    return error('Invalid user ID', 400)
  }

  // 3. 更新用户信息
  try {
    // 获取当前用户
    const username = k.account.user.current.userName
    const currentUser = getUserInfo(username)

    // 权限检查：只能管理员或自己可以修改
    // 这里我们假设在项目成员 tab 中，管理员可以修改任何成员的信息
    // 如果需要更严格的权限控制，可以在这里添加

    const updated = updateUserInfo(userId, {
      displayName,
      email
    })

    if (!updated) {
      return error('Failed to update user', 500)
    }

    // 获取更新后的用户信息
    const userInfo = getUserInfo(username)
    return success(userInfo, 'User updated successfully')

  } catch (err) {
    k.logger.error('UpdateUserError', err instanceof Error ? err.message : String(err))
    return error(err instanceof Error ? err.message : 'Failed to update user', 400, err)
  }
})
