// @k-url /api/auth/{action}

import {
  login,
  logout,
  register,
  getCurrentUser,
  koobooLogin,
  updateProfile,
  changePassword
} from 'code/Services/auth'
import { success, error } from 'code/Utils/response'

k.api.post('login', (body: {
  account?: string
  password?: string
  isRemember?: boolean
}) => {
  try {
    const data = login({
      account: body.account ?? '',
      password: body.password,
      isRemember: body.isRemember
    })
    return success(data, '登录成功')
  } catch (e: any) {
    return error(e?.message || '登录失败', 400)
  }
})

k.api.post('register', (body: {
  username?: string
  email?: string
  password?: string
  displayName?: string
}) => {
  try {
    const data = register({
      username: body.username ?? '',
      email: body.email ?? '',
      password: body.password ?? '',
      displayName: body.displayName
    })
    return success(data, '注册成功')
  } catch (e: any) {
    return error(e?.message || '注册失败', 400)
  }
})

k.api.post('kooboo-login', () => {
  try {
    const data = koobooLogin()
    return success(data, '登录成功')
  } catch (e: any) {
    return error(e?.message || 'Kooboo 登录失败', 400)
  }
})

k.api.post('logout', () => {
  try {
    const currentUser = getCurrentUser()
    if (currentUser?.koobooId && k.account.isLogin) {
      k.account.user.logout()
    }
    logout()
    return success(null, '已退出')
  } catch (e: any) {
    return error(e?.message || '退出失败', 400)
  }
})

k.api.get('me', () => {
  try {
    const user = getCurrentUser()
    if (!user) {
      return error('登录已过期', 401)
    }
    return success(user)
  } catch (e: any) {
    return error(e?.message || '获取用户信息失败', 400)
  }
})

k.api.put('profile', (body: {
  displayName?: string
  email?: string
}) => {
  try {
    const user = updateProfile(body)
    return success(user, '资料更新成功')
  } catch (e: any) {
    return error(e?.message || '更新资料失败', 400)
  }
})

k.api.post('change-password', (body: {
  oldPassword?: string
  newPassword?: string
}) => {
  try {
    changePassword(body)
    return success(null, '密码修改成功')
  } catch (e: any) {
    return error(e?.message || '修改密码失败', 400)
  }
})
