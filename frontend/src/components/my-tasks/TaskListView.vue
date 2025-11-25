<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
    <!-- 表头 -->
    <div class="border-b border-gray-200 dark:border-gray-700">
      <div class="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-700/50">
        <!-- 全选复选框 -->
        <div class="col-span-1 flex items-center">
          <el-checkbox
            :model-value="selectedTasksCount === tasks.length && tasks.length > 0"
            :indeterminate="selectedTasksCount > 0 && selectedTasksCount < tasks.length"
            @change="toggleSelectAll"
          />
        </div>

        <!-- 任务标题 -->
        <div class="col-span-5 flex items-center">
          <span class="text-xs font-medium text-gray-500 dark:text-gray-400">任务标题</span>
        </div>

        <!-- 项目 -->
        <div class="col-span-2 flex items-center">
          <span class="text-xs font-medium text-gray-500 dark:text-gray-400">项目</span>
        </div>

        <!-- 优先级 -->
        <div class="col-span-1 flex items-center">
          <span class="text-xs font-medium text-gray-500 dark:text-gray-400">优先级</span>
        </div>

        <!-- 状态 -->
        <div class="col-span-1 flex items-center">
          <span class="text-xs font-medium text-gray-500 dark:text-gray-400">状态</span>
        </div>

        <!-- 截止日期 -->
        <div class="col-span-2 flex items-center">
          <span class="text-xs font-medium text-gray-500 dark:text-gray-400">截止日期</span>
        </div>
      </div>
    </div>

    <!-- 任务列表 -->
    <div class="divide-y divide-gray-100 dark:divide-gray-700">
      <!-- 加载状态 -->
      <div v-if="loading && tasks.length === 0" class="py-12 text-center">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p class="text-gray-500 dark:text-gray-400 mt-2">加载中...</p>
      </div>

      <!-- 空状态 -->
      <div v-else-if="tasks.length === 0" class="py-12 text-center text-gray-400 dark:text-gray-500">
        <svg class="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
        <p>暂无任务</p>
        <p class="text-sm mt-1">调整筛选条件或创建新任务</p>
      </div>

      <!-- 任务项 -->
      <div v-else>
        <div
          v-for="task in tasks"
          :key="task._id"
          class="grid grid-cols-12 gap-2 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200 cursor-pointer"
          :class="{ 'bg-blue-50 dark:bg-blue-900/30': selectedTaskIds.includes(task._id) }"
          @click="handleTaskClick(task)"
        >
          <!-- 选择框 -->
          <div class="col-span-1 flex items-center" @click.stop>
            <el-checkbox
              :model-value="selectedTaskIds.includes(task._id)"
              @change="handleSelectTask(task._id, $event)"
            />
          </div>

          <!-- 任务标题 -->
          <div class="col-span-5 flex items-center">
            <div class="flex-1 min-w-0">
              <p class="font-medium text-gray-900 dark:text-gray-100 truncate">{{ task.title }}</p>
              <p v-if="task.summary" class="text-sm text-gray-500 dark:text-gray-400 truncate">{{ task.summary }}</p>
            </div>
            <!-- 标签 -->
            <div v-if="(task as any).tags && (task as any).tags.length > 0" class="flex gap-1 ml-2">
              <span
                v-for="tag in (task as any).tags.slice(0, 2)"
                :key="tag._id"
                class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                :style="{ backgroundColor: tag.color + '20', color: tag.color }"
              >
                {{ tag.name }}
              </span>
              <span
                v-if="(task as any).tags.length > 2"
                class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
              >
                +{{ (task as any).tags.length - 2 }}
              </span>
            </div>
          </div>

          <!-- 项目 -->
          <div class="col-span-2 flex items-center">
            <div v-if="task.project" class="flex items-center gap-2">
              <div
                class="w-3 h-3 rounded-full"
                :style="{ backgroundColor: task.project.color }"
              ></div>
              <span class="text-sm text-gray-600 dark:text-gray-300 truncate">{{ task.project.name }}</span>
            </div>
            <span v-else class="text-sm text-gray-400 dark:text-gray-500">-</span>
          </div>

          <!-- 优先级 -->
          <div class="col-span-1 flex items-center">
            <span
              class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
              :class="getPriorityClass(task.priority)"
            >
              {{ getPriorityText(task.priority) }}
            </span>
          </div>

          <!-- 状态 -->
          <div class="col-span-1 flex items-center">
            <span
              class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
              :class="getStatusClass(task.status)"
            >
              {{ getStatusText(task.status) }}
            </span>
          </div>

          <!-- 截止日期 -->
          <div class="col-span-2 flex items-center">
            <span
              v-if="task.dueDate"
              class="text-sm"
              :class="getDueDateClass(task.dueDate)"
            >
              {{ formatDate(task.dueDate) }}
            </span>
            <span v-else class="text-sm text-gray-400 dark:text-gray-500">-</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 加载更多 -->
    <div
      v-if="hasMore && !loading"
      class="border-t border-gray-200 p-4 text-center"
    >
      <el-button @click="handleLoadMore" :loading="loading">
        加载更多
      </el-button>
    </div>

    <!-- 底部加载状态 -->
    <div v-if="loading && tasks.length > 0" class="border-t border-gray-200 p-4 text-center">
      <div class="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      <p class="text-sm text-gray-500 mt-1">加载中...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Task } from '@/types/task'

interface Props {
  tasks: Task[]
  loading: boolean
  selectedTaskIds: string[]
  selectedTasksCount: number
}

interface Emits {
  (e: 'select-task', taskId: string, selected: boolean): void
  (e: 'refresh'): void
  (e: 'load-more'): void
  (e: 'task-click', task: Task): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const hasMore = computed(() => {
  // 这里应该从pagination获取，暂时固定值
  return props.tasks.length >= 20
})

// 获取优先级样式
const getPriorityClass = (priority: string) => {
  const classMap: Record<string, string> = {
    urgent: 'bg-red-100 text-red-700',
    high: 'bg-orange-100 text-orange-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-gray-100 text-gray-700'
  }
  return classMap[priority] || 'bg-gray-100 text-gray-700'
}

// 获取优先级文本
const getPriorityText = (priority: string) => {
  const textMap: Record<string, string> = {
    urgent: '紧急',
    high: '高',
    medium: '中',
    low: '低'
  }
  return textMap[priority] || priority
}

// 获取状态样式
const getStatusClass = (status: string) => {
  const classMap: Record<string, string> = {
    todo: 'bg-blue-100 text-blue-700',
    待验收: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-green-100 text-green-700',
    review: 'bg-purple-100 text-purple-700'
  }
  return classMap[status] || 'bg-gray-100 text-gray-700'
}

// 获取状态文本
const getStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    todo: '待办',
    in_progress: '进行中',
    completed: '已完成',
    review: '待验收'
  }
  return textMap[status] || status
}

// 获取截止日期样式
const getDueDateClass = (dueDate: number) => {
  const now = Date.now()
  const dueTime = dueDate * 1000
  const diffDays = Math.ceil((dueTime - now) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return 'text-red-600 font-medium'
  } else if (diffDays === 0) {
    return 'text-orange-600 font-medium'
  } else if (diffDays <= 3) {
    return 'text-yellow-600'
  } else {
    return 'text-gray-600'
  }
}

// 格式化日期
const formatDate = (timestamp: number) => {
  const date = new Date(timestamp * 1000)
  const now = new Date()
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return '今天'
  } else if (diffDays === 1) {
    return '明天'
  } else if (diffDays === -1) {
    return '昨天'
  } else if (diffDays > 0 && diffDays <= 7) {
    return `${diffDays}天后`
  } else if (diffDays < 0 && diffDays >= -7) {
    return `${Math.abs(diffDays)}天前`
  } else {
    return date.toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit'
    })
  }
}

// 处理选择任务
const handleSelectTask = (taskId: string, selected: boolean) => {
  emit('select-task', taskId, selected)
}

// 全选/取消全选
const toggleSelectAll = () => {
  if (props.selectedTaskIds.length === props.tasks.length) {
    // 取消全选
    props.tasks.forEach(task => {
      emit('select-task', task._id, false)
    })
  } else {
    // 全选
    props.tasks.forEach(task => {
      emit('select-task', task._id, true)
    })
  }
}

// 加载更多
const handleLoadMore = () => {
  emit('load-more')
}

// 处理任务点击
const handleTaskClick = (task: Task) => {
  emit('task-click', task)
}
</script>