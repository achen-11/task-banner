import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api/auth'
import type { LoginRequest, RegisterRequest, UserInfo } from '@/types/auth'
import {
  getAuthToken,
  setAuthToken,
  clearAuthToken,
  setCachedUser
} from '@/utils/auth'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<UserInfo | null>(null)
  const token = ref<string | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!token.value && !!user.value)

  function applyToken(authToken: string) {
    token.value = authToken
    setAuthToken(authToken)
  }

  function setSession(authToken: string, authUser: UserInfo) {
    applyToken(authToken)
    user.value = authUser
    setCachedUser(authUser)
  }

  function clearSession() {
    token.value = null
    user.value = null
    setCachedUser(null)
    clearAuthToken()
  }

  async function login(data: LoginRequest): Promise<boolean> {
    isLoading.value = true
    error.value = null
    try {
      const res = await authApi.login(data)
      applyToken(res.token)
      const fullUser = await authApi.getCurrentUser()
      user.value = fullUser
      setCachedUser(fullUser)
      return true
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : '登录失败'
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function register(data: RegisterRequest): Promise<boolean> {
    isLoading.value = true
    error.value = null
    try {
      const res = await authApi.register(data)
      applyToken(res.token)
      const fullUser = await authApi.getCurrentUser()
      user.value = fullUser
      setCachedUser(fullUser)
      return true
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : '注册失败'
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function logout() {
    try {
      await authApi.logout()
    } catch {
      // ignore
    }
    clearSession()
  }

  async function checkAuth() {
    if (!token.value) {
      const stored = getAuthToken()
      if (stored) {
        token.value = stored
      }
    }

    const injectedUser = (window as any).__USER_INFO__ as UserInfo | undefined
    if (injectedUser?._id) {
      user.value = injectedUser
      setCachedUser(injectedUser)
      if (!token.value) {
        const stored = getAuthToken()
        if (stored) token.value = stored
      }
      return
    }

    if (!token.value) return

    isLoading.value = true
    try {
      user.value = await authApi.getCurrentUser()
      setCachedUser(user.value)
    } catch {
      clearSession()
    } finally {
      isLoading.value = false
    }
  }

  function clearError() {
    error.value = null
  }

  return {
    user,
    token,
    isLoading,
    error,
    isAuthenticated,
    login,
    register,
    logout,
    checkAuth,
    setSession,
    clearSession,
    clearError
  }
})
