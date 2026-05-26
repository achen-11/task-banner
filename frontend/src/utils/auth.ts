/**
 * 认证工具
 */
import type { UserInfo } from '@/types/auth'

export const COOKIE_TOKEN_KEY = 'task_banner_auth_token'
const TOKEN_STORAGE_KEY = 'task_banner_auth_token'

/** 内存 token，login/register 响应体写入，供 localhost 开发使用 */
let memoryToken: string | null = null

export function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null
  }
  return null
}

export function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/`
}

export function clearAuthCookie() {
  document.cookie = `${COOKIE_TOKEN_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
}

/**
 * 获取 token：内存 > localStorage > Cookie
 * localhost 开发时 Cookie 在远端域名，需依赖前两者
 */
export function getAuthToken(): string | null {
  if (memoryToken) return memoryToken
  try {
    const stored = localStorage.getItem(TOKEN_STORAGE_KEY)
    if (stored) {
      memoryToken = stored
      return stored
    }
  } catch {
    // ignore
  }
  return getCookie(COOKIE_TOKEN_KEY)
}

export function setAuthToken(token: string) {
  memoryToken = token
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token)
  } catch {
    // ignore
  }
}

export function clearAuthToken() {
  memoryToken = null
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
  } catch {
    // ignore
  }
  clearAuthCookie()
}

export function isLogin(): boolean {
  return !!getAuthToken() || !!(window as any).__USER_INFO__
}

let cachedUser: UserInfo | null = null

export function setCachedUser(user: UserInfo | null) {
  cachedUser = user
}

export function getCurrentUser(): UserInfo | null {
  if (cachedUser?._id) return cachedUser
  const injected = (window as any).__USER_INFO__ as UserInfo | undefined
  if (injected?._id) return injected
  return null
}

export async function logout() {
  clearAuthToken()
  window.location.href = '/__logout__'
}

export function requireAuth(): boolean {
  return isLogin() || !!getCurrentUser()
}

export default {
  isLogin,
  getCurrentUser,
  logout,
  requireAuth,
  getCookie,
  setCookie,
  getAuthToken,
  setAuthToken,
  clearAuthToken,
  clearAuthCookie,
  setCachedUser,
  COOKIE_TOKEN_KEY
}
