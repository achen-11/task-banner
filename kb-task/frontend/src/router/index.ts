import { createRouter, createWebHistory } from 'vue-router'
import { setupRouterGuards } from './guards'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../App.vue'),
      meta: {
        title: 'TaskFlow - Home',
        requiresAuth: true // 需要认证
      }
    },
  ],
})

// 设置路由守卫
setupRouterGuards(router)

export default router
