/**
 * 路由守卫
 */
import type { Router } from 'vue-router'
import { requireAuth, isLogin } from '@/utils/auth'

export function setupRouterGuards(router: Router) {
  // 全局前置守卫
  router.beforeEach((to, from, next) => {
    // 检查是否需要认证
    if (to.meta.requiresAuth !== false) {
      // 默认所有路由都需要认证
      if (requireAuth()) {
        next()
      } else {
        // 生产环境会重定向到登录页，不会执行到这里
        next(false)
      }
    } else {
      next()
    }
  })

  // 全局后置守卫
  router.afterEach((to) => {
    // 设置页面标题
    document.title = (to.meta.title as string) || 'TaskFlow'
  })
}
