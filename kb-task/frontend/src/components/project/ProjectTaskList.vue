<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-100">
    <!-- 顶部工具栏 - 移除了标题 -->
    <div class="p-3 border-b border-gray-100 flex items-center justify-between">
      <div class="text-sm text-gray-500">
        <span v-if="isLoading">加载中...</span>
        <span v-else-if="error" class="text-red-500">{{ error }}</span>
        <span v-else>共 {{ tasks.length }} 个任务</span>
      </div>
      <button
        class="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        @click="handleCreateTask"
      >
        <svg class="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        新建任务
      </button>
    </div>

    <div v-if="isLoading" class="p-8 text-center text-gray-400">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p>加载任务中...</p>
    </div>

    <div v-else-if="error" class="p-8 text-center text-red-500">
      <svg class="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p>{{ error }}</p>
      <button
        class="mt-4 px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        @click="loadTasks"
      >
        重试
      </button>
    </div>

    <div v-else-if="tasks.length === 0" class="p-8 text-center text-gray-400">
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
          v-for="task in tasks"
          :key="task._id"
          class="grid grid-cols-[80px_1fr_120px_100px_120px_80px] gap-4 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors items-center"
          @click="openTaskDetail(task._id)"
        >
          <!-- ID -->
          <div class="text-sm font-mono text-gray-500">
            #{{ task.displayId }}
          </div>

          <!-- 标题 -->
          <div class="min-w-0">
            <div class="font-medium text-gray-900 truncate">{{ task.title }}</div>
            <div v-if="task.tagIds && task.tagIds.length > 0" class="flex items-center gap-1 mt-1">
              <span
                v-for="tagId in task.tagIds.slice(0, 2)"
                :key="tagId"
                class="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full"
              >
                {{ tagId }}
              </span>
              <span v-if="task.tagIds.length > 2" class="text-xs text-gray-400">
                +{{ task.tagIds.length - 2 }}
              </span>
            </div>
          </div>

          <!-- 指派人 -->
          <div class="text-sm text-gray-600">
            <div v-if="task.assigneeId" class="flex items-center gap-2">
              <div class="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-semibold">
                {{ task.assigneeId.charAt(0) }}
              </div>
              <span>{{ task.assigneeId }}</span>
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
      :all-tasks="tasks"
      @close="closeDrawer"
      @update:task-id="selectedTaskId = $event"
      @task-updated="handleTaskUpdated"
      @task-deleted="handleTaskDeleted"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import TaskDetailDrawer from '../TaskDetailDrawer.vue'
import { getTaskList, createTask as createTaskAPI, deleteTask as deleteTaskAPI } from '@/api/task'
import type { Task } from '@/types/task'

interface Props {
  projectId: string
}

const props = defineProps<Props>()

// 任务数据
const tasks = ref<Task[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)

// 加载任务列表
const loadTasks = async () => {
  if (!props.projectId) return

  isLoading.value = true
  error.value = null

  try {
    const response = await getTaskList({
      projectId: props.projectId,
      page: 1,
      size: 100 // 暂时加载所有任务
    })
    tasks.value = response.items
  } catch (err: any) {
    error.value = err?.message || '加载任务失败'
    console.error('Failed to load tasks:', err)
  } finally {
    isLoading.value = false
  }
}

// 监听projectId变化，重新加载任务
watch(() => props.projectId, () => {
  loadTasks()
}, { immediate: true })

// 组件挂载时加载任务
onMounted(() => {
  loadTasks()
})

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

// 创建任务
const handleCreateTask = async () => {
  const title = prompt('请输入任务标题：')
  if (!title || title.trim() === '') return

  try {
    const newTask = await createTaskAPI({
      projectId: props.projectId,
      title: title.trim(),
      status: 'todo',
      priority: 'medium'
    })

    // 将新任务添加到列表
    tasks.value.unshift(newTask)

    // 打开新任务详情
    selectedTaskId.value = newTask._id
    isDrawerOpen.value = true
  } catch (err: any) {
    alert(err?.message || '创建任务失败')
    console.error('Failed to create task:', err)
  }
}

// 任务更新处理
const handleTaskUpdated = (updatedTask: Task) => {
  const index = tasks.value.findIndex(t => t._id === updatedTask._id)
  if (index !== -1) {
    tasks.value[index] = updatedTask
  }
}

// 任务删除处理
const handleTaskDeleted = async (taskId: string) => {
  try {
    await deleteTaskAPI(taskId)

    // 从列表中移除
    tasks.value = tasks.value.filter(t => t._id !== taskId)

    // 关闭抽屉
    isDrawerOpen.value = false
  } catch (err: any) {
    alert(err?.message || '删除任务失败')
    console.error('Failed to delete task:', err)
  }
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
