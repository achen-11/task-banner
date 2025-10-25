<template>
  <div class="h-full flex flex-col">
    <!-- 项目信息区 -->
    <div v-if="!collapsed" class="bg-white border-b border-gray-200 p-6">
      <div class="flex items-start justify-between mb-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 mb-2">{{ project.name }}</h1>
          <p class="text-gray-500">{{ project.description }}</p>
        </div>
        <button @click="collapsed = true" class="text-gray-400 hover:text-gray-600">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
          </svg>
        </button>
      </div>

      <div class="flex items-center space-x-4">
        <div class="flex -space-x-2">
          <div
            v-for="member in project.members"
            :key="member.id"
            class="w-8 h-8 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center"
          >
            <span class="text-xs font-medium text-gray-600">{{ member.initials }}</span>
          </div>
        </div>
        <button class="text-sm text-blue-600 hover:text-blue-700">+ 添加成员</button>
      </div>
    </div>

    <!-- 折叠状态的项目信息 -->
    <div v-else class="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <h1 class="text-lg font-semibold text-gray-900">{{ project.name }}</h1>
      <button @click="collapsed = false" class="text-gray-400 hover:text-gray-600">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>

    <!-- Tab 栏 -->
    <div class="bg-white border-b border-gray-200">
      <nav class="flex px-6 space-x-8">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          @click="currentTab = tab.value"
          class="py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200"
          :class="currentTab === tab.value
            ? 'border-blue-500 text-blue-600'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
        >
          {{ tab.label }}
        </button>
      </nav>
    </div>

    <!-- Tab 内容 -->
    <div class="flex-1 overflow-auto bg-gray-50 p-6">
      <!-- 概览 -->
      <div v-if="currentTab === 'overview'">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">项目概览</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="bg-white rounded-md shadow-md p-6">
            <h3 class="text-sm font-medium text-gray-500 mb-2">总任务数</h3>
            <p class="text-3xl font-bold text-gray-900">{{ project.stats.total }}</p>
          </div>
          <div class="bg-white rounded-md shadow-md p-6">
            <h3 class="text-sm font-medium text-gray-500 mb-2">进行中</h3>
            <p class="text-3xl font-bold text-yellow-600">{{ project.stats.inProgress }}</p>
          </div>
          <div class="bg-white rounded-md shadow-md p-6">
            <h3 class="text-sm font-medium text-gray-500 mb-2">已完成</h3>
            <p class="text-3xl font-bold text-green-600">{{ project.stats.completed }}</p>
          </div>
        </div>
      </div>

      <!-- 列表 -->
      <div v-if="currentTab === 'list'">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">任务列表</h2>
        <div class="bg-white rounded-md shadow-md p-4">
          <p class="text-gray-500 text-center py-8">暂无任务</p>
        </div>
      </div>

      <!-- 看板 -->
      <div v-if="currentTab === 'board'">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">任务看板</h2>
        <div class="flex gap-4">
          <div class="flex-1 bg-white rounded-md shadow-md p-4">
            <h3 class="font-medium text-gray-900 mb-2">待办</h3>
            <p class="text-gray-500 text-center py-8">暂无任务</p>
          </div>
          <div class="flex-1 bg-white rounded-md shadow-md p-4">
            <h3 class="font-medium text-gray-900 mb-2">进行中</h3>
            <p class="text-gray-500 text-center py-8">暂无任务</p>
          </div>
          <div class="flex-1 bg-white rounded-md shadow-md p-4">
            <h3 class="font-medium text-gray-900 mb-2">已完成</h3>
            <p class="text-gray-500 text-center py-8">暂无任务</p>
          </div>
        </div>
      </div>

      <!-- 成员 -->
      <div v-if="currentTab === 'members'">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">项目成员</h2>
        <div class="bg-white rounded-md shadow-md divide-y divide-gray-100">
          <div
            v-for="member in project.members"
            :key="member.id"
            class="p-4 flex items-center justify-between"
          >
            <div class="flex items-center">
              <div class="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center mr-3">
                <span class="text-gray-600 font-medium">{{ member.initials }}</span>
              </div>
              <div>
                <p class="font-medium text-gray-900">{{ member.name }}</p>
                <p class="text-sm text-gray-500">{{ member.email }}</p>
              </div>
            </div>
            <span class="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">{{ member.role }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

// 项目信息
const project = ref<any>({
  id: 0,
  name: '加载中...',
  description: '',
  members: [],
  stats: {
    total: 0,
    inProgress: 0,
    completed: 0
  }
})

// 折叠状态
const collapsed = ref(false)

// 当前 Tab
const currentTab = ref('overview')

// Tab 列表
const tabs = [
  { value: 'overview', label: '概览' },
  { value: 'list', label: '列表' },
  { value: 'board', label: '看板' },
  { value: 'members', label: '成员' }
]

// 加载项目详情
const loadProject = async () => {
  const projectId = route.params.id
  // TODO: 从 API 加载项目详情
  project.value = {
    id: projectId,
    name: 'TaskFlow 开发',
    description: '基于 Vue 3 和 TypeScript 的任务管理系统',
    members: [
      { id: 1, name: '张三', email: 'zhangsan@example.com', initials: '张三', role: '管理员' },
      { id: 2, name: '李四', email: 'lisi@example.com', initials: '李四', role: '成员' },
      { id: 3, name: '王五', email: 'wangwu@example.com', initials: '王五', role: '成员' }
    ],
    stats: {
      total: 15,
      inProgress: 5,
      completed: 8
    }
  }
}

onMounted(() => {
  loadProject()
})
</script>
