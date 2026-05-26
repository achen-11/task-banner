<template>
  <div class="flex gap-4 overflow-x-auto pb-4">
    <div
      v-for="column in boardColumns"
      :key="column.status"
      class="bg-gray-50 dark:bg-gray-800 rounded-lg min-w-[300px] flex-shrink-0"
    >
      <div :class="['text-white px-4 py-3 rounded-t-lg', column.headerClass]">
        <div class="flex items-center justify-between">
          <span class="font-medium">{{ column.title }}</span>
          <span class="bg-white/20 px-2 py-0.5 rounded text-xs">
            {{ getTasksByStatus(column.status).length }}
          </span>
        </div>
      </div>
      <div class="p-3 min-h-[400px]">
        <TaskCard
          v-for="task in getTasksByStatus(column.status)"
          :key="task._id"
          :task="task"
          @click="handleTaskClick(task)"
        />
        <div
          v-if="getTasksByStatus(column.status).length === 0"
          class="text-center text-gray-400 dark:text-gray-500 py-8"
        >
          <p class="text-sm">暂无{{ column.title }}任务</p>
        </div>
      </div>
    </div>
  </div>

  <!-- 加载状态 -->
  <div v-if="loading" class="fixed inset-0 bg-white/80 dark:bg-gray-900/80 flex items-center justify-center z-50">
    <div class="text-center">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <p class="text-gray-500 dark:text-gray-400 mt-2">加载中...</p>
    </div>
  </div>

  <!-- 空状态 -->
  <div v-else-if="tasks.length === 0" class="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
    <svg class="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
    <p class="text-gray-500 dark:text-gray-400">暂无任务</p>
    <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">创建您的第一个任务开始管理</p>
  </div>
</template>

<script setup lang="ts">
import type { Task } from '@/types/task'
import { getStatusText } from '@/utils/taskStatus'
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

const boardColumns = [
  { status: 'todo', title: getStatusText('todo'), headerClass: 'bg-gray-600' },
  { status: 'in_progress', title: getStatusText('in_progress'), headerClass: 'bg-blue-600' },
  { status: 'review', title: getStatusText('review'), headerClass: 'bg-orange-600' },
  { status: 'completed', title: getStatusText('completed'), headerClass: 'bg-green-600' }
] as const

const getTasksByStatus = (status: string) => {
  return props.tasks.filter(task => task.status === status)
}

const handleTaskClick = (task: Task) => {
  emit('task-click', task)
}
</script>
