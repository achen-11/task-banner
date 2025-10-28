/**
 * 认证工具 - 适配本地开发和 Kooboo 生产环境
 */

const isDevelopment = import.meta.env.DEV

// 开发模式的 Mock 用户数据
const MOCK_USER = {
  id: 1000,
  username: 'dev_user',
  email: 'dev@example.com',
  displayName: '开发用户',
  avatar: '',
  isAdmin: true
}

/**
 * 检查登录状态
 */
export function isLogin(): boolean {
  if (isDevelopment) {
    // 开发模式：检查 localStorage
    return localStorage.getItem('dev_token') !== null
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
    // 开发模式：返回 Mock 用户或 localStorage 中的用户
    const storedUser = localStorage.getItem('dev_user')
    console.log('currentUser:', storedUser);
    
    return storedUser ? JSON.parse(storedUser) : MOCK_USER
  } else {
    // 生产模式：从服务端注入的全局变量获取
    return (window as any).__USER_INFO__ || null
  }
}

/**
 * 开发模式登录 (Mock)
 */
export function devLogin(username?: string, password?: string) {
  if (!isDevelopment) {
    console.warn('devLogin only works in development mode')
    return false
  }

  // 模拟登录逻辑
  const mockUser = {
    ...MOCK_USER,
    username: username || MOCK_USER.username
  }

  localStorage.setItem('dev_token', 'mock_token_' + Date.now())
  localStorage.setItem('dev_user', JSON.stringify(mockUser))

  console.log('✅ [Dev Mode] Login successful:', mockUser)
  return true
}

/**
 * 开发模式退出登录 (Mock)
 */
export function devLogout() {
  if (!isDevelopment) {
    console.warn('devLogout only works in development mode')
    return
  }

  localStorage.removeItem('dev_token')
  localStorage.removeItem('dev_user')

  console.log('✅ [Dev Mode] Logout successful')
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
    // 开发模式：自动登录（如果没有 token）
    if (!localStorage.getItem('dev_token')) {
      console.log('🔧 [Dev Mode] Auto login with mock user')
      devLogin()
    }

    const user = getCurrentUser()
    console.log('👤 [Dev Mode] Current user:', user)
  }
}

/**
 * 认证守卫 - 用于路由拦截
 */
export function requireAuth(): boolean {
  if (!isLogin()) {
    if (isDevelopment) {
      console.warn('⚠️ [Dev Mode] Not logged in, auto login...')
      devLogin()
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
