<template>
  <header class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
    <div class="flex justify-between items-center px-6 py-3">
      <!-- 左侧：收起按钮 + 面包屑 + 专注退出 -->
      <div class="flex items-center gap-3 min-w-0">
        <el-tooltip placement="bottom">
          <template #content>
            <div class="flex items-center gap-1.5">
              <Keyboard :size="14" />
              <span>展开/收起左侧菜单栏 (⌘B)</span>
            </div>
          </template>
          <button
            @click="toggleSidebar"
            class="w-8 h-8 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors shrink-0"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </el-tooltip>

        <!-- 面包屑 -->
        <nav class="flex items-center text-sm text-gray-500 dark:text-gray-400 min-w-0">
          <template v-for="(item, index) in breadcrumbs" :key="`${item.path}-${index}`">
            <router-link
              :to="item.path"
              class="hover:text-gray-700 dark:hover:text-gray-300 transition-colors truncate max-w-[12rem]"
              :class="{ 'text-gray-900 dark:text-gray-100 font-medium': index === breadcrumbs.length - 1 }"
              :title="item.name"
            >
              {{ item.name }}
            </router-link>
            <span v-if="index < breadcrumbs.length - 1" class="mx-2 shrink-0">/</span>
          </template>
        </nav>

        <el-button
          v-if="uiStore.pageFocusMode"
          type="primary"
          size="small"
          class="shrink-0 !ml-1"
          :style="{ backgroundColor: '#3762E3', borderColor: '#3762E3' }"
          @click="handleExitFocus"
        >
          <Minimize2 class="w-3.5 h-3.5 mr-1 inline-block" />
          退出专注
        </el-button>
      </div>

      <!-- 右侧：搜索框 -->
      <div class="flex items-center shrink-0">
        <div class="relative">
          <input
            type="text"
            v-model="searchQuery"
            placeholder="搜索"
            class="w-64 pl-9 pr-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            @keyup.enter="handleSearch"
          />
          <svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { Keyboard, Minimize2 } from 'lucide-vue-next'
import { useUIStore } from '@/stores/ui'
import { useProjectStore } from '@/stores/project'
const emit = defineEmits<{
  toggleSidebar: []
}>()

const route = useRoute()
const uiStore = useUIStore()
const projectStore = useProjectStore()
const searchQuery = ref('')

const breadcrumbs = computed(() => {
  const crumbs: Array<{ name: string; path: string }> = []

  if (route.path === '/') {
    crumbs.push({ name: '首页', path: '/' })
  } else if (route.path === '/my-tasks') {
    crumbs.push({ name: '首页', path: '/' })
    crumbs.push({ name: '我的任务', path: '/my-tasks' })
  } else if (route.path === '/messages') {
    crumbs.push({ name: '首页', path: '/' })
    crumbs.push({ name: '消息', path: '/messages' })
  } else if (route.path === '/account') {
    crumbs.push({ name: '首页', path: '/' })
    crumbs.push({ name: '账号设置', path: '/account' })
  } else if (route.path.startsWith('/projects/')) {
    crumbs.push({ name: '首页', path: '/' })
    const projectName = projectStore.currentProject?.name?.trim()
    crumbs.push({
      name: projectName || '项目',
      path: route.params.documentId
        ? `/projects/${route.params.projectId || route.params.id}`
        : route.path
    })
    if (route.params.documentId) {
      crumbs.push({ name: '文档', path: route.path })
    }
  }

  return crumbs
})

const toggleSidebar = () => {
  emit('toggleSidebar')
}

const handleExitFocus = () => {
  uiStore.exitPageFocusMode()
}

const handleSearch = () => {
  if (searchQuery.value.trim()) {
    console.log('搜索:', searchQuery.value)
  }
}
</script>
