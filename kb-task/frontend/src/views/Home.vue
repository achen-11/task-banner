<template>
  <div class="p-8">
    <h1 class="text-3xl font-bold text-gray-900 mb-6">首页</h1>

    <!-- 待办任务概览 -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div class="bg-white rounded-md shadow-md p-6">
        <div class="flex items-center justify-between mb-2">
          <h2 class="text-sm font-medium text-gray-500">待办任务</h2>
          <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <p class="text-3xl font-bold text-gray-900">{{ stats.todo }}</p>
      </div>

      <div class="bg-white rounded-md shadow-md p-6">
        <div class="flex items-center justify-between mb-2">
          <h2 class="text-sm font-medium text-gray-500">进行中</h2>
          <svg class="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p class="text-3xl font-bold text-gray-900">{{ stats.inProgress }}</p>
      </div>

      <div class="bg-white rounded-md shadow-md p-6">
        <div class="flex items-center justify-between mb-2">
          <h2 class="text-sm font-medium text-gray-500">已完成</h2>
          <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p class="text-3xl font-bold text-gray-900">{{ stats.completed }}</p>
      </div>
    </div>

    <!-- 最近访问的项目 -->
    <div class="bg-white rounded-md shadow-md p-6 mb-8">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">最近访问的项目</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <router-link
          v-for="project in recentProjects"
          :key="project.id"
          :to="`/projects/${project.id}`"
          class="border border-gray-200 rounded-md p-4 hover:bg-gray-50 transition-colors duration-200"
        >
          <div class="flex items-center mb-2">
            <div class="w-3 h-3 rounded-full mr-2" :style="{ backgroundColor: project.color }"></div>
            <h3 class="font-medium text-gray-900">{{ project.name }}</h3>
          </div>
          <p class="text-sm text-gray-500">{{ project.taskCount }} 个任务</p>
        </router-link>
      </div>
    </div>

    <!-- 快捷操作 -->
    <div class="bg-white rounded-md shadow-md p-6">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">快捷操作</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button class="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors duration-200">
          <svg class="w-8 h-8 text-blue-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          <span class="text-sm text-gray-900">创建任务</span>
        </button>

        <button class="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors duration-200">
          <svg class="w-8 h-8 text-green-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <span class="text-sm text-gray-900">创建项目</span>
        </button>

        <button class="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors duration-200">
          <svg class="w-8 h-8 text-purple-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span class="text-sm text-gray-900">搜索任务</span>
        </button>

        <button class="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors duration-200">
          <svg class="w-8 h-8 text-orange-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          <span class="text-sm text-gray-900">筛选任务</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

// 统计数据
const stats = ref({
  todo: 0,
  inProgress: 0,
  completed: 0
})

// 最近访问的项目
const recentProjects = ref<any[]>([])

// 加载数据
const loadData = async () => {
  // TODO: 从 API 加载数据
  stats.value = {
    todo: 12,
    inProgress: 5,
    completed: 28
  }

  recentProjects.value = [
    { id: 1, name: 'TaskFlow 开发', color: '#6366f1', taskCount: 15 },
    { id: 2, name: '个人学习计划', color: '#10b981', taskCount: 8 },
    { id: 3, name: '产品设计文档', color: '#f59e0b', taskCount: 12 }
  ]
}

onMounted(() => {
  loadData()
})
</script>
