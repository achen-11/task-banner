/**
 * 路由守卫
 */
import type { Router } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

export function setupRouterGuards(router: Router) {
  router.beforeEach(async (to, _from, next) => {
    const authStore = useAuthStore()

    if (!authStore.user && !authStore.token) {
      await authStore.checkAuth()
    }

    const requiresAuth = to.meta.requiresAuth !== false

    if (requiresAuth && !authStore.isAuthenticated) {
      next({ name: 'login', query: { redirect: to.fullPath } })
      return
    }

    if (to.name === 'login' && authStore.isAuthenticated) {
      next({ path: '/' })
      return
    }

    next()
  })

  router.afterEach((to) => {
    document.title = (to.meta.title as string) || 'Task Banner'
  })
}
