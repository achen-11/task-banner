<template>
  <div class="flex gap-4 overflow-x-auto pb-4">
    <!-- 待办列 -->
    <div class="bg-gray-50 rounded-lg min-w-[300px] flex-shrink-0">
      <div class="bg-blue-600 text-white px-4 py-3 rounded-t-lg">
        <div class="flex items-center justify-between">
          <span class="font-medium">待办</span>
          <span class="bg-white/20 px-2 py-0.5 rounded text-xs">{{ getTasksByStatus('todo').length }}</span>
        </div>
      </div>
      <div class="p-3 min-h-[400px]">
        <TaskCard
          v-for="task in getTasksByStatus('todo')"
          :key="task._id"
          :task="task"
          @click="handleTaskClick(task)"
        />
        <div v-if="getTasksByStatus('todo').length === 0" class="text-center text-gray-400 py-8">
          <svg class="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p class="text-sm">暂无待办任务</p>
        </div>
      </div>
    </div>

    <!-- 待验收列 -->
    <div class="bg-gray-50 rounded-lg min-w-[300px] flex-shrink-0">
      <div class="bg-yellow-600 text-white px-4 py-3 rounded-t-lg">
        <div class="flex items-center justify-between">
          <span class="font-medium">待验收</span>
          <span class="bg-white/20 px-2 py-0.5 rounded text-xs">{{ getTasksByStatus('待验收').length }}</span>
        </div>
      </div>
      <div class="p-3 min-h-[400px]">
        <TaskCard
          v-for="task in getTasksByStatus('待验收')"
          :key="task._id"
          :task="task"
          @click="handleTaskClick(task)"
        />
        <div v-if="getTasksByStatus('待验收').length === 0" class="text-center text-gray-400 py-8">
          <svg class="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <p class="text-sm">暂无待验收任务</p>
        </div>
      </div>
    </div>

    <!-- 完成列 -->
    <div class="bg-gray-50 rounded-lg min-w-[300px] flex-shrink-0">
      <div class="bg-green-600 text-white px-4 py-3 rounded-t-lg">
        <div class="flex items-center justify-between">
          <span class="font-medium">已完成</span>
          <span class="bg-white/20 px-2 py-0.5 rounded text-xs">{{ getTasksByStatus('completed').length }}</span>
        </div>
      </div>
      <div class="p-3 min-h-[400px]">
        <TaskCard
          v-for="task in getTasksByStatus('completed')"
          :key="task._id"
          :task="task"
          @click="handleTaskClick(task)"
        />
        <div v-if="getTasksByStatus('completed').length === 0" class="text-center text-gray-400 py-8">
          <svg class="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="text-sm">暂无已完成任务</p>
        </div>
      </div>
    </div>

    <!-- 待验收列 -->
    <div class="bg-gray-50 rounded-lg min-w-[300px] flex-shrink-0">
      <div class="bg-purple-600 text-white px-4 py-3 rounded-t-lg">
        <div class="flex items-center justify-between">
          <span class="font-medium">待验收</span>
          <span class="bg-white/20 px-2 py-0.5 rounded text-xs">{{ getTasksByStatus('review').length }}</span>
        </div>
      </div>
      <div class="p-3 min-h-[400px]">
        <TaskCard
          v-for="task in getTasksByStatus('review')"
          :key="task._id"
          :task="task"
          @click="handleTaskClick(task)"
        />
        <div v-if="getTasksByStatus('review').length === 0" class="text-center text-gray-400 py-8">
          <svg class="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <p class="text-sm">暂无待验收任务</p>
        </div>
      </div>
    </div>
  </div>

  <!-- 加载状态 -->
  <div v-if="loading" class="fixed inset-0 bg-white/80 flex items-center justify-center z-50">
    <div class="text-center">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <p class="text-gray-500 mt-2">加载中...</p>
    </div>
  </div>

  <!-- 空状态 -->
  <div v-else-if="tasks.length === 0" class="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
    <svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
    <p class="text-gray-500">暂无任务</p>
    <p class="text-sm text-gray-400 mt-1">创建您的第一个任务开始管理</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Task } from '@/types/task'
import TaskCard from './TaskCard.vue'

interface Props {
  tasks: Task[]
  loading: boolean
}

interface Emits {
  (e: 'task-click', task: Task): void
  (e: 'refresh'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 按状态分组任务
const getTasksByStatus = (status: string) => {
  return props.tasks.filter(task => task.status === status)
}

// 处理任务点击
const handleTaskClick = (task: Task) => {
  emit('task-click', task)
}
</script>