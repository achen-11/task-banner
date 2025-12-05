/**
 * 认证工具 - 适配本地开发和 Kooboo 生产环境
 */

const isDevelopment = import.meta.env.DEV

// 开发模式的 Mock 用户数据
export const MOCK_USER = {
  _id: '1000',
  username: 'dev_user',
  email: 'dev@example.com',
  displayName: '开发用户',
  avatar: '',
  isAdmin: true
}

/**
 * 从 Cookie 中获取指定值
 */
export function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null
  }
  return null
}

/**
 * 检查登录状态
 */
export function isLogin(): boolean {
  if (isDevelopment) {
    // 开发模式：检查 cookie 中的 jwt_token
    const token = getCookie('jwt_token')
    return token !== null && token !== ''
  } else {
    // 生产模式：从服务端注入的全局变量获取
    return !!(window as any).__USER_INFO__
  }
}

/**
 * 获取当前用户信息
 */
export function getCurrentUser() {
  if (isDevelopment) {
    // 开发模式：直接返回 Mock 用户
    return MOCK_USER
  } else {
    // 生产模式：从服务端注入的全局变量获取
    return (window as any).__USER_INFO__ || null
  }
}

/**
 * 开发模式登录 (Mock)
 * 注意：开发模式下不再操作 localStorage，只用于兼容性
 */
export function devLogin(username?: string, password?: string) {
  if (!isDevelopment) {
    console.warn('devLogin only works in development mode')
    return false
  }

  // 开发模式下，登录状态由 cookie 中的 jwt_token 决定
  // 这里只做日志记录，不实际操作
  const mockUser = {
    ...MOCK_USER,
    username: username || MOCK_USER.username
  }

  console.log('✅ [Dev Mode] Login check - jwt_token from cookie:', getCookie('jwt_token') ? 'exists' : 'not found')
  console.log('👤 [Dev Mode] Using mock user:', mockUser)
  
  return !!getCookie('jwt_token')
}

/**
 * 开发模式退出登录 (Mock)
 * 注意：开发模式下不再操作 localStorage
 */
export function devLogout() {
  if (!isDevelopment) {
    console.warn('devLogout only works in development mode')
    return
  }

  // 开发模式下，退出登录由后端处理 cookie
  // 这里只做日志记录
  console.log('✅ [Dev Mode] Logout - jwt_token will be cleared by server')
}

/**
 * 生产模式退出登录
 */
export function logout() {
  if (isDevelopment) {
    devLogout()
    // 刷新页面
    window.location.reload()
  } else {
    // 重定向到 Kooboo 登录页
    window.location.href = '/__logout__'
  }
}

/**
 * 初始化认证状态
 * 在应用启动时调用
 */
export function initAuth() {
  if (isDevelopment) {
    // 开发模式：检查 cookie 中的 jwt_token
    const token = getCookie('jwt_token')
    const user = getCurrentUser()
    
    if (token) {
      console.log('✅ [Dev Mode] Found jwt_token in cookie')
      console.log('👤 [Dev Mode] Current user:', user)
    } else {
      console.warn('⚠️ [Dev Mode] No jwt_token found in cookie')
      console.log('👤 [Dev Mode] Using mock user:', user)
    }
  }
}

/**
 * 认证守卫 - 用于路由拦截
 */
export function requireAuth(): boolean {
  if (!isLogin()) {
    if (isDevelopment) {
      console.warn('⚠️ [Dev Mode] No jwt_token in cookie, redirecting to login...')
      // 开发模式：重定向到登录页（如果需要的话）
      // 或者允许继续访问（使用 mock user）
      // 这里选择允许继续访问，因为开发模式通常需要 mock 数据
      return true
    } else {
      // 生产环境：重定向到登录页
      window.location.href = '/_Admin/login?permission=u&returnurl=' + encodeURIComponent(window.location.pathname)
      return false
    }
  }
  return true
}

export default {
  isLogin,
  getCurrentUser,
  devLogin,
  devLogout,
  logout,
  initAuth,
  requireAuth
}
