<template>
  <div
    class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-3 cursor-pointer hover:shadow-md transition-shadow duration-200"
    @click="handleClick"
  >
    <!-- 任务标题 -->
    <h3 class="font-medium text-gray-900 mb-2 line-clamp-2">{{ task.title }}</h3>

    <!-- 任务描述 -->
    <p v-if="task.summary" class="text-sm text-gray-500 mb-3 line-clamp-2">{{ task.summary }}</p>

    <!-- 标签 -->
    <div v-if="task.tags && task.tags.length > 0" class="flex flex-wrap gap-1 mb-3">
      <span
        v-for="tag in task.tags.slice(0, 3)"
        :key="tag._id"
        class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
        :style="{ backgroundColor: tag.color + '20', color: tag.color }"
      >
        {{ tag.name }}
      </span>
      <span
        v-if="task.tags.length > 3"
        class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600"
      >
        +{{ task.tags.length - 3 }}
      </span>
    </div>

    <!-- 底部信息 -->
    <div class="flex items-center justify-between">
      <!-- 左侧：项目和优先级 -->
      <div class="flex items-center gap-2">
        <!-- 项目 -->
        <div v-if="task.project" class="flex items-center gap-1">
          <div
            class="w-3 h-3 rounded-full"
            :style="{ backgroundColor: task.project.color }"
          ></div>
          <span class="text-xs text-gray-600">{{ task.project.name }}</span>
        </div>

        <!-- 优先级 -->
        <span
          class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
          :class="getPriorityClass(task.priority)"
        >
          {{ getPriorityText(task.priority) }}
        </span>
      </div>

      <!-- 右侧：截止日期和指派人 -->
      <div class="flex items-center gap-2">
        <!-- 截止日期 -->
        <div v-if="task.dueDate" class="flex items-center gap-1">
          <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span
            class="text-xs"
            :class="getDueDateClass(task.dueDate)"
          >
            {{ formatDate(task.dueDate) }}
          </span>
        </div>

        <!-- 指派人头像 -->
        <div v-if="task.assignee" class="flex items-center">
          <div class="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-medium">
            {{ getAssigneeInitial(task.assignee) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Task } from '@/types/task'

interface Props {
  task: Task
}

interface Emits {
  (e: 'click', task: Task): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

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

// 获取指派人首字母
const getAssigneeInitial = (assignee: any) => {
  if (assignee.displayName) {
    return assignee.displayName.charAt(0).toUpperCase()
  } else if (assignee.username) {
    return assignee.username.charAt(0).toUpperCase()
  } else if (assignee.email) {
    return assignee.email.charAt(0).toUpperCase()
  }
  return 'U'
}

// 处理点击事件
const handleClick = () => {
  emit('click', props.task)
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>