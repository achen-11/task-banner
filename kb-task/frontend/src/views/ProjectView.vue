<template>
  <div class="h-full flex flex-col bg-gray-50">
    <!-- 项目头部 -->
    <div class="bg-white border-b border-gray-200">
      <!-- 展开状态的头部 -->
      <div v-if="!collapsed" class="px-6 py-4">
        <!-- 项目标题和操作 -->
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center gap-3">
            <!-- 项目图标/颜色 -->
            <div
              class="w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl font-semibold"
              :style="{ backgroundColor: project?.color || '#6366f1' }"
            >
              {{ projectInitial }}
            </div>
            <div>
              <h1 class="text-2xl font-bold text-gray-900">{{ project?.name || '加载中...' }}</h1>
              <p class="text-sm text-gray-500 mt-1">{{ project?.description }}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button class="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <svg class="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              项目设置
            </button>
            <button class="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
              <svg class="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              新建任务
            </button>
            <button
              @click="collapsed = true"
              class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="收起"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
              </svg>
            </button>
          </div>
        </div>

        <!-- 项目统计信息 -->
        <div class="flex items-center gap-6 text-sm">
          <!-- 状态 -->
          <div class="flex items-center gap-2">
            <span class="text-gray-500">状态:</span>
            <span
              class="px-2 py-1 rounded text-xs font-medium"
              :class="statusClasses"
            >
              {{ statusText }}
            </span>
          </div>

          <!-- 创建时间 -->
          <div class="flex items-center gap-2 text-gray-600">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>创建: {{ formatDate(project?.createdAt) }}</span>
          </div>

          <!-- 更新时间 -->
          <div class="flex items-center gap-2 text-gray-600">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>更新: {{ formatDate(project?.updatedAt) }}</span>
          </div>

          <!-- 成员数 -->
          <div class="flex items-center gap-2 text-gray-600">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span>成员: {{ memberCount }}</span>
          </div>

          <!-- 任务完成度 -->
          <div class="flex items-center gap-2 text-gray-600">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <span>任务: {{ taskCompletionText }}</span>
            <div class="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                class="h-full bg-green-500 transition-all duration-300"
                :style="{ width: `${taskCompletionRate}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 折叠状态的头部 -->
      <div v-else class="px-6 py-3 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <!-- 项目图标/颜色 -->
          <div
            class="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-semibold"
            :style="{ backgroundColor: project?.color || '#6366f1' }"
          >
            {{ projectInitial }}
          </div>
          <div>
            <h1 class="text-lg font-semibold text-gray-900">{{ project?.name || '加载中...' }}</h1>
          </div>
          <!-- 简化的统计信息 -->
          <div class="flex items-center gap-4 ml-6 text-sm text-gray-600">
            <span
              class="px-2 py-1 rounded text-xs font-medium"
              :class="statusClasses"
            >
              {{ statusText }}
            </span>
            <span>{{ taskCompletionText }} 任务</span>
            <span>{{ memberCount }} 成员</span>
          </div>
        </div>
        <button
          @click="collapsed = false"
          class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="展开"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      <!-- Tab 栏 -->
      <nav class="flex px-6 space-x-8 bg-white">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          @click="currentTab = tab.value"
          class="py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 flex items-center gap-2"
          :class="currentTab === tab.value
            ? 'border-blue-500 text-blue-600'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="tab.icon" />
          </svg>
          {{ tab.label }}
        </button>
      </nav>
    </div>

    <!-- Tab 内容 -->
    <div class="flex-1 overflow-auto p-6">
      <!-- 概览 -->
      <div v-if="currentTab === 'overview'" class="space-y-6">
        <!-- 统计卡片 -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-sm font-medium text-gray-500">总任务数</h3>
              <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p class="text-3xl font-bold text-gray-900">{{ project?.taskCount || 0 }}</p>
          </div>

          <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-sm font-medium text-gray-500">待办</h3>
              <svg class="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p class="text-3xl font-bold text-blue-600">{{ (project?.taskCount || 0) - (project?.completedTaskCount || 0) }}</p>
          </div>

          <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-sm font-medium text-gray-500">已完成</h3>
              <svg class="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p class="text-3xl font-bold text-green-600">{{ project?.completedTaskCount || 0 }}</p>
          </div>

          <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-sm font-medium text-gray-500">完成率</h3>
              <svg class="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <p class="text-3xl font-bold text-purple-600">{{ taskCompletionRate }}%</p>
          </div>
        </div>

        <!-- 项目描述 -->
        <div v-if="project?.description" class="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <h3 class="text-lg font-semibold text-gray-900 mb-3">项目描述</h3>
          <p class="text-gray-600 leading-relaxed">{{ project.description }}</p>
        </div>

        <!-- 最近活动 -->
        <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">最近活动</h3>
          <div class="text-center py-12 text-gray-400">
            <svg class="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>暂无最近活动</p>
          </div>
        </div>
      </div>

      <!-- 列表视图 -->
      <div v-if="currentTab === 'list'">
        <div class="bg-white rounded-lg shadow-sm border border-gray-100">
          <div class="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 class="text-lg font-semibold text-gray-900">任务列表</h2>
            <button class="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
              <svg class="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              新建任务
            </button>
          </div>
          <div class="p-8 text-center text-gray-400">
            <svg class="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p>暂无任务</p>
          </div>
        </div>
      </div>

      <!-- 看板视图 -->
      <div v-if="currentTab === 'board'" class="h-full">
        <div class="flex gap-4 h-full">
          <div class="flex-1 bg-white rounded-lg shadow-sm border border-gray-100 flex flex-col">
            <div class="p-4 border-b border-gray-100">
              <div class="flex items-center justify-between">
                <h3 class="font-semibold text-gray-900">待办</h3>
                <span class="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">0</span>
              </div>
            </div>
            <div class="flex-1 p-4 overflow-auto">
              <div class="text-center py-12 text-gray-400">
                <svg class="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <p class="text-sm">暂无任务</p>
              </div>
            </div>
          </div>

          <div class="flex-1 bg-white rounded-lg shadow-sm border border-gray-100 flex flex-col">
            <div class="p-4 border-b border-gray-100">
              <div class="flex items-center justify-between">
                <h3 class="font-semibold text-gray-900">进行中</h3>
                <span class="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">0</span>
              </div>
            </div>
            <div class="flex-1 p-4 overflow-auto">
              <div class="text-center py-12 text-gray-400">
                <svg class="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <p class="text-sm">暂无任务</p>
              </div>
            </div>
          </div>

          <div class="flex-1 bg-white rounded-lg shadow-sm border border-gray-100 flex flex-col">
            <div class="p-4 border-b border-gray-100">
              <div class="flex items-center justify-between">
                <h3 class="font-semibold text-gray-900">已完成</h3>
                <span class="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">{{ project?.completedTaskCount || 0 }}</span>
              </div>
            </div>
            <div class="flex-1 p-4 overflow-auto">
              <div class="text-center py-12 text-gray-400">
                <svg class="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p class="text-sm">暂无任务</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 成员管理 -->
      <div v-if="currentTab === 'members'">
        <div class="bg-white rounded-lg shadow-sm border border-gray-100">
          <div class="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 class="text-lg font-semibold text-gray-900">项目成员 ({{ memberCount }})</h2>
            <button class="px-4 py-2 text-sm text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
              <svg class="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              添加成员
            </button>
          </div>
          <div class="p-8 text-center text-gray-400">
            <svg class="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p>暂无成员数据</p>
            <p class="text-sm mt-1">点击上方"添加成员"按钮邀请成员</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useProjectStore } from '@/stores/project'
import type { Project } from '@/types/project'

const route = useRoute()
const projectStore = useProjectStore()

// 项目信息
const project = computed<Project | null>(() => projectStore.currentProject)

// 头部展开/收起状态
const collapsed = ref(false)

// 当前 Tab
const currentTab = ref('overview')

// Tab 列表
const tabs = [
  {
    value: 'overview',
    label: '概览',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
  },
  {
    value: 'list',
    label: '列表',
    icon: 'M4 6h16M4 10h16M4 14h16M4 18h16'
  },
  {
    value: 'board',
    label: '看板',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
  },
  {
    value: 'members',
    label: '成员',
    icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z'
  }
]

// 计算属性 - 项目首字母
const projectInitial = computed(() => {
  return project.value?.name?.charAt(0).toUpperCase() || 'P'
})

// 计算属性 - 状态文本
const statusText = computed(() => {
  const status = project.value?.status
  switch (status) {
    case 'active':
      return '进行中'
    case 'completed':
      return '已完成'
    case 'paused':
      return '已暂停'
    default:
      return '未知'
  }
})

// 计算属性 - 状态样式
const statusClasses = computed(() => {
  const status = project.value?.status
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-700'
    case 'completed':
      return 'bg-blue-100 text-blue-700'
    case 'paused':
      return 'bg-yellow-100 text-yellow-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
})

// 计算属性 - 成员数量
const memberCount = computed(() => {
  return project.value?.memberCount || 0
})

// 计算属性 - 任务完成文本
const taskCompletionText = computed(() => {
  const total = project.value?.taskCount || 0
  const completed = project.value?.completedTaskCount || 0
  return `${completed}/${total}`
})

// 计算属性 - 任务完成率
const taskCompletionRate = computed(() => {
  const total = project.value?.taskCount || 0
  const completed = project.value?.completedTaskCount || 0
  if (total === 0) return 0
  return Math.round((completed / total) * 100)
})

// 格式化日期
const formatDate = (timestamp: number | undefined) => {
  if (!timestamp) return '-'
  const date = new Date(timestamp)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

// 加载项目详情
const loadProject = async () => {
  const projectId = route.params.id as string
  if (!projectId) return

  try {
    await projectStore.fetchProjectDetail(projectId)
  } catch (error) {
    console.error('Failed to load project:', error)
  }
}

// 监听 Tab 切换，自动展开/收起头部
watch(currentTab, (newTab) => {
  if (newTab === 'overview') {
    // 切换到概览时自动展开
    collapsed.value = false
  } else if (newTab === 'list' || newTab === 'board') {
    // 切换到列表或看板时自动收起
    collapsed.value = true
  }
})

// 监听路由变化，重新加载项目
watch(() => route.params.id, (newId) => {
  if (newId) {
    loadProject()
  }
}, { immediate: true })

onMounted(() => {
  loadProject()
})
</script>
