import { createRouter, createWebHashHistory } from 'vue-router'
import { setupRouterGuards } from './guards'
import MainLayout from '../layouts/MainLayout.vue'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/Login.vue'),
      meta: {
        requiresAuth: false,
        title: 'Task Banner - 登录'
      }
    },
    {
      path: '/',
      component: MainLayout,
      meta: {
        requiresAuth: true
      },
      children: [
        {
          path: '',
          name: 'home',
          component: () => import('../views/Home.vue'),
          meta: {
            title: 'Task Banner - 首页'
          }
        },
        {
          path: 'my-tasks',
          name: 'my-tasks',
          component: () => import('../views/MyTasks.vue'),
          meta: {
            title: 'Task Banner - 我的任务'
          }
        },
        {
          path: 'projects',
          name: 'projects',
          component: () => import('../views/Projects.vue'),
          meta: {
            title: 'Task Banner - 项目列表'
          }
        },
        {
          path: 'messages',
          name: 'messages',
          component: () => import('../views/Messages.vue'),
          meta: {
            title: 'Task Banner - 消息'
          }
        },
        {
          path: 'account',
          name: 'account',
          component: () => import('../views/Account.vue'),
          meta: {
            title: 'Task Banner - 账号设置'
          }
        },
        {
          path: 'projects/:id',
          name: 'project',
          component: () => import('../views/ProjectView.vue'),
          meta: {
            title: 'Task Banner - 项目'
          }
        },
        {
          path: 'projects/:projectId/documents/:documentId',
          name: 'document',
          component: () => import('../views/ProjectView.vue'),
          meta: {
            title: 'Task Banner - 文档'
          }
        }
      ]
    }
  ],
})

setupRouterGuards(router)

export default router
