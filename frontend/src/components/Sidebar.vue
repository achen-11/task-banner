<template>
  <aside
    class="h-screen bg-zinc-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 flex flex-col"
    :class="isCollapsed ? 'w-14' : 'w-64'"
  >
    <div class="flex flex-col h-full p-2">
      <!-- Logo / Brand -->
      <div class="flex items-center p-1 mb-4">
        <div class="w-8 h-8 bg-blue-500 rounded flex items-center justify-center flex-shrink-0">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <div v-if="!isCollapsed" class="text-lg font-semibold text-gray-900 dark:text-gray-100 ml-2">任务管理系统</div>
      </div>

      <!-- 导航菜单 -->
      <nav class="flex-1 overflow-y-auto">
        <router-link
          to="/"
          class="sidebar-menu"
          :class="{ 'bg-zinc-200 dark:bg-gray-800': isActive('/') }"
        >
          <el-tooltip
            content="首页"
            placement="right"
            :disabled="!isCollapsed"
            :hide-after="0"
          >
            <svg class="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </el-tooltip>
          <div v-if="!isCollapsed" class="text-sm font-medium text-gray-900 dark:text-gray-100 ml-2">首页</div>
        </router-link>

        <router-link
          to="/my-tasks"
          class="sidebar-menu"
          :class="{ 'bg-zinc-200 dark:bg-gray-800': isActive('/my-tasks') }"
        >
          <el-tooltip
            content="我的任务"
            placement="right"
            :disabled="!isCollapsed"
            :hide-after="0"
          >
            <svg class="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </el-tooltip>
          <div v-if="!isCollapsed" class="text-sm font-medium text-gray-900 dark:text-gray-100 ml-2">我的任务</div>
        </router-link>

        <router-link
          to="/messages"
          class="sidebar-menu"
          :class="{ 'bg-zinc-200 dark:bg-gray-800': isActive('/messages') }"
        >
          <el-tooltip
            content="消息通知"
            placement="right"
            :disabled="!isCollapsed"
            :hide-after="0"
          >
            <svg class="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </el-tooltip>
          <div v-if="!isCollapsed" class="text-sm font-medium text-gray-900 dark:text-gray-100 ml-2">消息</div>
          <span v-if="unreadCount > 0 && !isCollapsed" class="ml-auto bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
            {{ unreadCount > 99 ? '99+' : unreadCount }}
          </span>
        </router-link>

        <!-- 分割线 -->
        <div class="h-px bg-gray-200 dark:bg-gray-700 my-2"></div>

        <!-- 项目标题（作为项目列表入口） -->
        <div v-if="!isCollapsed" class="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center justify-between px-2 mb-2">
          <button
            type="button"
            class="flex items-center gap-1 text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors tour-projects-button"
            @click="goProjects"
          >
            <span>Projects</span>
          </button>
          <button
            @click="showCreateProject = true"
            class="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors tour-create-project-button"
            title="创建项目"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        <!-- 项目列表 -->
        <div v-if="projectStore.loading" class="px-2 py-4 text-center">
          <div class="text-sm text-gray-500">加载中...</div>
        </div>
        <div
          v-else
          v-for="project in visibleProjects"
          :key="project._id"
          class="sidebar-menu"
          :class="{ 'bg-zinc-200 dark:bg-gray-800': isActive(`/projects/${project._id}`) }"
          @click="handleProjectClick(project)"
        >
          <el-tooltip
            :content="project.name"
            placement="right"
            :disabled="!isCollapsed"
            :hide-after="0"
          >
            <div
              class="w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center text-white text-xs font-medium"
              :style="{ backgroundColor: project.color || '#6366f1' }"
            >
              {{ project.name.substring(0, 1) }}
            </div>
          </el-tooltip>
          <div v-if="!isCollapsed" class="text-sm font-medium text-gray-900 dark:text-gray-100 ml-2 truncate">{{ project.name }}</div>
        </div>
      </nav>

      <!-- 创建项目对话框 -->
      <CreateProjectDialog
        v-model="showCreateProject"
        @created="handleProjectCreated"
      />

      <!-- 底部用户信息 -->
      <div class="relative rounded-md" :class="{ 'p-2 hover:bg-gray-200 dark:hover:bg-gray-800': !isCollapsed, 'p-0': isCollapsed }">
        <div v-if="!isCollapsed" class="flex items-center justify-between cursor-pointer" @click="toggleUserMenu">
          <div class="flex items-center flex-1 min-w-0 mr-2">
            <div class="w-8 h-8 bg-gray-300 dark:bg-gray-700 rounded flex items-center justify-center flex-shrink-0">
              <span class="text-gray-800 dark:text-gray-200 text-sm font-medium">{{ userInitials }}</span>
            </div>
            <div class="ml-2 overflow-hidden">
              <div class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{{ currentUser?.displayName || currentUser?.username }}</div>
              <div class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ currentUser?.email }}</div>
            </div>
          </div>
          <svg class="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        <div v-else class="flex justify-center">
          <div class="w-8 h-8 bg-gray-300 dark:bg-gray-700 rounded flex items-center justify-center cursor-pointer" @click="toggleUserMenu">
            <span class="text-gray-800 dark:text-gray-200 text-sm font-medium">{{ userInitials }}</span>
          </div>
        </div>

        <!-- 用户下拉菜单 -->
        <div
          v-if="showUserMenu"
          class="absolute bottom-full mb-1 z-50 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
          :class="isCollapsed ? 'left-0 w-48' : 'left-0 right-0'"
        >
          <div class="p-1">
            <button
              @click="handleGoAccount"
              class="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              账号设置
            </button>
            <button
              @click="handleToggleDarkMode"
              class="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              <svg v-if="uiStore.isDarkMode" class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <svg v-else class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
              {{ uiStore.isDarkMode ? '浅色模式' : '暗黑模式' }}
            </button>
            <button
              @click="handleRestartTour"
              class="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              重新开始引导
            </button>
            <button
              @click="handleLogout"
              class="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              退出登录
            </button>
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getCurrentUser, logout } from '@/utils/auth'
import { useAuthStore } from '@/stores/auth'
import { useProjectStore } from '@/stores/project'
import { useUIStore } from '@/stores/ui'
import { useTourStore } from '@/stores/tour'
import CreateProjectDialog from './CreateProjectDialog.vue'
import { ElTooltip } from 'element-plus'
import { getUnreadCount } from '@/api/notification'

defineProps<{
  isCollapsed: boolean
}>()

const route = useRoute()
const router = useRouter()
const projectStore = useProjectStore()
const uiStore = useUIStore()
const tourStore = useTourStore()

// 当前用户
const currentUser = ref<any>(null)

// 用户名首字母
const userInitials = computed(() => {
  if (!currentUser.value) return ''
  const name = currentUser.value.displayName || currentUser.value.username
  return name.substring(0, 1).toUpperCase()
})

// 未读消息数
const unreadCount = ref(0)
let unreadCountTimer: number | null = null

// 加载未读消息数量
const loadUnreadCount = async () => {
  try {
    const result = await getUnreadCount()
    unreadCount.value = result.count
  } catch (error) {
    console.error('Failed to load unread count:', error)
  }
}

// 创建项目对话框
const showCreateProject = ref(false)

// 只展示未归档项目
const visibleProjects = computed(() => projectStore.projects.filter(p => p.status !== 'archived'))

// 跳转到项目列表页
const goProjects = () => {
  router.push('/projects')
}

// 用户菜单
const showUserMenu = ref(false)

// 判断当前路由是否激活
const isActive = (path: string) => {
  if (path === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(path)
}

// 切换用户菜单
const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value
}

// 点击外部关闭菜单
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.relative')) {
    showUserMenu.value = false
  }
}

// 加载项目列表
const loadProjects = async () => {
  try {
    await projectStore.fetchProjects()
  } catch (error) {
    console.error('Failed to load projects:', error)
  }
}

// 处理项目点击
const handleProjectClick = (project: any) => {
  // 导航到项目页面
  router.push(`/projects/${project._id}`)

  // 自动收起左侧菜单
  uiStore.setSidebarCollapsed(true)
}

// 项目创建成功回调
const handleProjectCreated = () => {
  // 项目已经通过 store 自动添加到列表中
  console.log('Project created successfully')
}

// 重新开始引导
const handleRestartTour = () => {
  showUserMenu.value = false
  tourStore.resetTour()
  // 触发引导开始
  setTimeout(() => {
    tourStore.startTour()
    // 通知 MainLayout 启动引导
    const event = new CustomEvent('start-tour')
    window.dispatchEvent(event)
  }, 100)
}

// 切换暗黑模式
const handleToggleDarkMode = () => {
  showUserMenu.value = false
  uiStore.toggleDarkMode()
}

const handleGoAccount = () => {
  showUserMenu.value = false
  router.push('/account')
}

// 退出登录
const authStore = useAuthStore()

const handleLogout = async () => {
  showUserMenu.value = false
  if (confirm('确定要退出登录吗？')) {
    await authStore.logout()
    logout()
  }
}

onMounted(() => {
  currentUser.value = getCurrentUser()
  loadProjects()
  loadUnreadCount()
  document.addEventListener('click', handleClickOutside)
  
  // 定时刷新未读数量（每30秒）
  unreadCountTimer = window.setInterval(() => {
    loadUnreadCount()
  }, 30000)
  
  // 监听路由变化，当进入消息页面时刷新
  watch(() => route.path, (newPath) => {
    if (newPath === '/messages') {
      loadUnreadCount()
    }
  })
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  if (unreadCountTimer !== null) {
    clearInterval(unreadCountTimer)
  }
})
</script>

<style scoped>
.sidebar-menu {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  margin-bottom: 4px;
  border-radius: 0.25rem;
  transition: background-color 0.2s ease;
  cursor: pointer;
}
.sidebar-menu:hover {
  background-color: rgb(228 228 231);
}
.dark .sidebar-menu:hover {
  background-color: rgb(31 41 55);
}
</style>
