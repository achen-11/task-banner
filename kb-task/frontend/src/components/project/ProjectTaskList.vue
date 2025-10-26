<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-100">
    <!-- 顶部工具栏 - 移除了标题 -->
    <div class="p-3 border-b border-gray-100 flex items-center justify-between">
      <div class="text-sm text-gray-500">
        共 {{ mockTasks.length }} 个任务
      </div>
      <button class="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
        <svg class="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        新建任务
      </button>
    </div>

    <div v-if="mockTasks.length === 0" class="p-8 text-center text-gray-400">
      <svg class="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
      <p>暂无任务</p>
    </div>

    <!-- 任务表格 -->
    <div v-else>
      <!-- 表头 -->
      <div class="grid grid-cols-[80px_1fr_120px_100px_120px_80px] gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wider">
        <div>ID</div>
        <div>标题</div>
        <div>指派人</div>
        <div>优先级</div>
        <div>最后更新</div>
        <div>状态</div>
      </div>

      <!-- 表格内容 -->
      <div class="divide-y divide-gray-100">
        <div
          v-for="task in mockTasks"
          :key="task._id"
          class="grid grid-cols-[80px_1fr_120px_100px_120px_80px] gap-4 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors items-center"
          @click="openTaskDetail(task._id)"
        >
          <!-- ID -->
          <div class="text-sm font-mono text-gray-500">
            #{{ task.taskId }}
          </div>

          <!-- 标题 -->
          <div class="min-w-0">
            <div class="font-medium text-gray-900 truncate">{{ task.title }}</div>
            <div v-if="task.tags && task.tags.length > 0" class="flex items-center gap-1 mt-1">
              <span
                v-for="tag in task.tags.slice(0, 2)"
                :key="tag"
                class="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full"
              >
                {{ tag }}
              </span>
              <span v-if="task.tags.length > 2" class="text-xs text-gray-400">
                +{{ task.tags.length - 2 }}
              </span>
            </div>
          </div>

          <!-- 指派人 -->
          <div class="text-sm text-gray-600">
            <div v-if="task.assignee" class="flex items-center gap-2">
              <div class="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-semibold">
                {{ task.assignee.charAt(0) }}
              </div>
              <span>{{ task.assignee }}</span>
            </div>
            <span v-else class="text-gray-400">未指派</span>
          </div>

          <!-- 优先级 -->
          <div>
            <span
              class="inline-block px-2 py-1 text-xs font-medium rounded-full"
              :class="getPriorityBadgeClass(task.priority)"
            >
              {{ getPriorityText(task.priority) }}
            </span>
          </div>

          <!-- 最后更新 -->
          <div class="text-sm text-gray-500">
            {{ formatDate(task.updatedAt) }}
          </div>

          <!-- 状态 -->
          <div>
            <div
              class="w-5 h-5 rounded flex items-center justify-center"
              :class="getStatusIconClass(task.status)"
            >
              <svg v-if="task.status === 'completed'" class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
              </svg>
              <div v-else class="w-2 h-2 rounded-full bg-current"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 任务详情抽屉 -->
    <TaskDetailDrawer
      :is-open="isDrawerOpen"
      :task-id="selectedTaskId"
      :all-tasks="mockTasks"
      @close="closeDrawer"
      @update:task-id="selectedTaskId = $event"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import TaskDetailDrawer from '../TaskDetailDrawer.vue'

interface Task {
  _id: string
  taskId: number  // 数字版 ID，更易识别
  title: string
  status: 'todo' | 'in_progress' | 'completed'
  priority: 'low' | 'medium' | 'high'
  description?: string
  assignee?: string
  module?: string
  tags?: string[]
  dueDate?: number
  progress?: number
  createdAt: number
  updatedAt: number
}

interface Props {
  projectId: string
}

defineProps<Props>()

// Mock 任务数据
const mockTasks = ref<Task[]>([
  {
    _id: 'task-1',
    taskId: 1001,
    title: '实现任务详情抽屉组件',
    status: 'in_progress',
    priority: 'high',
    description: '基于 Linear 设计风格，实现可调整宽度的任务详情抽屉，支持两列响应式布局，包含活动历史时间线。',
    assignee: '张三',
    module: '前端',
    tags: ['UI组件', '高优先级'],
    dueDate: Date.now() + 2 * 24 * 60 * 60 * 1000,
    progress: 60,
    createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 1 * 60 * 60 * 1000
  },
  {
    _id: 'task-2',
    taskId: 1002,
    title: '优化项目成员管理API',
    status: 'completed',
    priority: 'medium',
    description: '完善项目成员增删改查接口，添加权限验证和角色管理功能。',
    assignee: '李四',
    module: '后端',
    tags: ['API', 'Backend'],
    dueDate: Date.now() - 1 * 24 * 60 * 60 * 1000,
    progress: 100,
    createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 6 * 60 * 60 * 1000
  },
  {
    _id: 'task-3',
    taskId: 1003,
    title: '设计任务标签系统',
    status: 'todo',
    priority: 'low',
    description: '设计灵活的标签系统，支持自定义颜色、图标，以及标签组功能。',
    assignee: '王五',
    module: '设计',
    tags: ['设计', 'UX'],
    progress: 0,
    createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 2 * 24 * 60 * 60 * 1000
  },
  {
    _id: 'task-4',
    taskId: 1004,
    title: '添加任务批量操作功能',
    status: 'todo',
    priority: 'medium',
    description: '支持批量修改任务状态、优先级、指派人等字段，提升操作效率。',
    module: '前端',
    tags: ['功能增强'],
    dueDate: Date.now() + 7 * 24 * 60 * 60 * 1000,
    progress: 0,
    createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 1 * 24 * 60 * 60 * 1000
  },
  {
    _id: 'task-5',
    taskId: 1005,
    title: '集成 Quill.js 富文本编辑器',
    status: 'in_progress',
    priority: 'high',
    description: '为任务描述和评论集成 Quill.js，支持 Markdown、@提及、图片上传等功能。',
    assignee: '张三',
    module: '前端',
    tags: ['富文本', '编辑器'],
    dueDate: Date.now() + 3 * 24 * 60 * 60 * 1000,
    progress: 30,
    createdAt: Date.now() - 4 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 2 * 60 * 60 * 1000
  }
])

// 抽屉状态
const isDrawerOpen = ref(false)
const selectedTaskId = ref<string>()

// 打开任务详情
const openTaskDetail = (taskId: string) => {
  selectedTaskId.value = taskId
  isDrawerOpen.value = true
}

// 关闭抽屉
const closeDrawer = () => {
  isDrawerOpen.value = false
}

// 获取状态图标样式
const getStatusIconClass = (status: string) => {
  const classMap: Record<string, string> = {
    todo: 'border-2 border-gray-300 text-gray-300',
    in_progress: 'bg-blue-500 text-white',
    completed: 'bg-green-500 text-white'
  }
  return classMap[status] || classMap.todo
}

// 获取优先级徽章样式
const getPriorityBadgeClass = (priority: string) => {
  const classMap: Record<string, string> = {
    low: 'bg-gray-100 text-gray-600',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-red-100 text-red-700'
  }
  return classMap[priority] || classMap.medium
}

// 获取优先级文本
const getPriorityText = (priority: string) => {
  const textMap: Record<string, string> = {
    low: '低',
    medium: '中',
    high: '高'
  }
  return textMap[priority] || priority
}

// 格式化日期（显示相对时间或完整日期）
const formatDate = (timestamp: number) => {
  const now = Date.now()
  const diff = now - timestamp
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(hours / 24)

  if (hours < 1) {
    return '刚刚'
  } else if (hours < 24) {
    return `${hours}小时前`
  } else if (days < 7) {
    return `${days}天前`
  } else {
    const date = new Date(timestamp)
    return date.toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit'
    })
  }
}
</script>
