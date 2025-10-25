import { createRouter, createWebHistory } from 'vue-router'
import { setupRouterGuards } from './guards'
import MainLayout from '../layouts/MainLayout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: MainLayout,
      meta: {
        requiresAuth: true // 需要认证
      },
      children: [
        {
          path: '',
          name: 'home',
          component: () => import('../views/Home.vue'),
          meta: {
            title: 'TaskFlow - 首页'
          }
        },
        {
          path: 'my-tasks',
          name: 'my-tasks',
          component: () => import('../views/MyTasks.vue'),
          meta: {
            title: 'TaskFlow - 我的任务'
          }
        },
        {
          path: 'messages',
          name: 'messages',
          component: () => import('../views/Messages.vue'),
          meta: {
            title: 'TaskFlow - 消息'
          }
        },
        {
          path: 'projects/:id',
          name: 'project',
          component: () => import('../views/ProjectView.vue'),
          meta: {
            title: 'TaskFlow - 项目'
          }
        }
      ]
    }
  ],
})

// 设置路由守卫
setupRouterGuards(router)

export default router
