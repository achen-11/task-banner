<template>
  <header class="bg-white border-b border-gray-200">
    <div class="flex justify-between items-center px-6 py-3">
      <!-- 左侧：收起按钮 + 面包屑 -->
      <div class="flex items-center">
        <el-tooltip placement="bottom">
          <template #content>
            <div class="flex items-center gap-1.5">
              <Keyboard :size="14" />
              <span>展开/收起左侧菜单栏 (⌘B)</span>
            </div>
          </template>
          <button
            @click="toggleSidebar"
            class="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors mr-3"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </el-tooltip>

        <!-- 面包屑 -->
        <nav class="flex items-center text-sm text-gray-500">
          <router-link
            v-for="(item, index) in breadcrumbs"
            :key="index"
            :to="item.path"
            class="hover:text-gray-700 transition-colors"
            :class="{ 'text-gray-900 font-medium': index === breadcrumbs.length - 1 }"
          >
            {{ item.name }}
            <span v-if="index < breadcrumbs.length - 1" class="mx-2">/</span>
          </router-link>
        </nav>
      </div>

      <!-- 右侧：搜索框 -->
      <div class="flex items-center">
        <div class="relative">
          <input
            type="text"
            v-model="searchQuery"
            placeholder="搜索"
            class="w-64 pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            @keyup.enter="handleSearch"
          />
          <svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
import { Keyboard } from 'lucide-vue-next'

const emit = defineEmits<{
  toggleSidebar: []
}>()

const route = useRoute()
const searchQuery = ref('')

// 面包屑导航
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
  } else if (route.path.startsWith('/projects/')) {
    crumbs.push({ name: '首页', path: '/' })
    crumbs.push({ name: '项目', path: route.path })
  }

  return crumbs
})

// 切换侧边栏
const toggleSidebar = () => {
  emit('toggleSidebar')
}

// 搜索处理
const handleSearch = () => {
  if (searchQuery.value.trim()) {
    console.log('搜索:', searchQuery.value)
    // TODO: 实现搜索功能
  }
}
</script>
