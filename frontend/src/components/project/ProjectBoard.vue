<template>
  <div class="h-full flex gap-4">
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
          <span class="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">{{ completedCount }}</span>
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
</template>

<script setup lang="ts">
import type { Project } from '@/types/project'

interface Props {
  project: Project | null
}

const props = defineProps<Props>()

const completedCount = props.project?.completedTaskCount || 0
</script>
