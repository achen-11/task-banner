<template>
  <div class="space-y-6">
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
        <p class="text-3xl font-bold text-blue-600">{{ pendingTaskCount }}</p>
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
        <p class="text-3xl font-bold text-purple-600">{{ completionRate }}%</p>
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
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Project } from '@/types/project'

interface Props {
  project: Project | null
}

const props = defineProps<Props>()

const pendingTaskCount = computed(() => {
  const total = props.project?.taskCount || 0
  const completed = props.project?.completedTaskCount || 0
  return total - completed
})

const completionRate = computed(() => {
  const total = props.project?.taskCount || 0
  const completed = props.project?.completedTaskCount || 0
  if (total === 0) return 0
  return Math.round((completed / total) * 100)
})
</script>
