<template>
  <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
    <!-- 总任务数 -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-600">总任务数</p>
          <p class="text-2xl font-bold text-gray-900 mt-1">{{ stats?.total || 0 }}</p>
        </div>
        <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
          <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
      </div>
    </div>

    <!-- 待办任务 -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-600">待办</p>
          <p class="text-2xl font-bold text-gray-900 mt-1">{{ stats?.todo || 0 }}</p>
        </div>
        <div class="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
          <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>
    </div>

    <!-- 待验收 -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-600">待验收</p>
          <p class="text-2xl font-bold text-gray-900 mt-1">{{ stats?.review || 0 }}</p>
        </div>
        <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
          <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
      </div>
    </div>

    <!-- 今日到期 -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-600">今日到期</p>
          <p class="text-2xl font-bold text-orange-600 mt-1">{{ stats?.dueToday || 0 }}</p>
        </div>
        <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
          <svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      </div>
    </div>

    <!-- 逾期任务 -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-600">逾期</p>
          <p class="text-2xl font-bold text-red-600 mt-1">{{ stats?.overdue || 0 }}</p>
        </div>
        <div class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
          <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { UserTasksStats } from '@/api/user'

interface Props {
  stats?: UserTasksStats
}

defineProps<Props>()
</script>