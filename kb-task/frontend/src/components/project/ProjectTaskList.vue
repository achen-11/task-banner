<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-100">
    <!-- 顶部工具栏 - 移除了标题 -->
    <div class="p-3 border-b border-gray-100 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <div class="text-sm text-gray-500">
          <span v-if="isLoading">加载中...</span>
          <span v-else-if="error" class="text-red-500">{{ error }}</span>
          <span v-else>共 {{ tasks.length }} 个任务</span>
        </div>
        <div v-if="selectedTaskIds.size > 0" class="flex items-center gap-2">
          <span class="text-sm text-blue-600 font-medium">已选择 {{ selectedTaskIds.size }} 个</span>
          <button
            class="px-3 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors"
            @click="handleBatchExport"
            title="导出选中任务 (Cmd+E)"
          >
            <svg class="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            批量导出
          </button>
          <button
            class="px-3 py-1 text-xs text-gray-600 hover:bg-gray-50 rounded transition-colors"
            @click="clearSelection"
          >
            取消选择
          </button>
        </div>
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
      <div class="grid grid-cols-[40px_80px_1fr_120px_100px_120px_80px] gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wider">
        <div class="flex items-center justify-center">
          <input
            type="checkbox"
            class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
            :checked="isAllSelected"
            :indeterminate="isSomeSelected"
            @change="toggleSelectAll"
          />
        </div>
        <div
          class="flex items-center gap-1 cursor-pointer hover:text-gray-700 transition-colors"
          @click="toggleSort('displayId')"
        >
          <span>ID</span>
          <svg
            v-if="sortField === 'displayId'"
            class="w-3 h-3"
            :class="{ 'rotate-180': sortDirection === 'desc' }"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
          </svg>
        </div>
        <div
          class="flex items-center gap-1 cursor-pointer hover:text-gray-700 transition-colors"
          @click="toggleSort('title')"
        >
          <span>标题</span>
          <svg
            v-if="sortField === 'title'"
            class="w-3 h-3"
            :class="{ 'rotate-180': sortDirection === 'desc' }"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
          </svg>
        </div>
        <div
          class="flex items-center gap-1 cursor-pointer hover:text-gray-700 transition-colors"
          @click="toggleSort('assigneeId')"
        >
          <span>指派人</span>
          <svg
            v-if="sortField === 'assigneeId'"
            class="w-3 h-3"
            :class="{ 'rotate-180': sortDirection === 'desc' }"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
          </svg>
        </div>
        <div
          class="flex items-center gap-1 cursor-pointer hover:text-gray-700 transition-colors"
          @click="toggleSort('priority')"
        >
          <span>优先级</span>
          <svg
            v-if="sortField === 'priority'"
            class="w-3 h-3"
            :class="{ 'rotate-180': sortDirection === 'desc' }"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
          </svg>
        </div>
        <div
          class="flex items-center gap-1 cursor-pointer hover:text-gray-700 transition-colors"
          @click="toggleSort('updatedAt')"
        >
          <span>最后更新</span>
          <svg
            v-if="sortField === 'updatedAt'"
            class="w-3 h-3"
            :class="{ 'rotate-180': sortDirection === 'desc' }"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
          </svg>
        </div>
        <div
          class="flex items-center gap-1 cursor-pointer hover:text-gray-700 transition-colors"
          @click="toggleSort('status')"
        >
          <span>状态</span>
          <svg
            v-if="sortField === 'status'"
            class="w-3 h-3"
            :class="{ 'rotate-180': sortDirection === 'desc' }"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
          </svg>
        </div>
      </div>

      <!-- 表格内容 -->
      <div class="divide-y divide-gray-100">
        <div
          v-for="task in sortedTasks"
          :key="task._id"
          class="grid grid-cols-[40px_80px_1fr_120px_100px_120px_80px] gap-4 px-4 py-3 hover:bg-gray-50 transition-colors items-center"
          :class="{ 'bg-blue-50': selectedTaskIds.has(task._id) }"
        >
          <!-- Checkbox -->
          <div class="flex items-center justify-center" @click.stop>
            <input
              type="checkbox"
              class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
              :checked="selectedTaskIds.has(task._id)"
              @change="toggleTaskSelection(task._id)"
            />
          </div>

          <!-- ID -->
          <div class="text-sm font-mono text-gray-500 cursor-pointer" @click="openTaskDetail(task._id)">
            #{{ task.displayId }}
          </div>

          <!-- 标题 -->
          <div class="min-w-0 cursor-pointer" @click="openTaskDetail(task._id)">
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
          <div class="text-sm text-gray-600 cursor-pointer" @click="openTaskDetail(task._id)">
            <div v-if="task.assigneeId" class="flex items-center gap-2">
              <div class="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-semibold">
                {{ task.assigneeId.charAt(0) }}
              </div>
              <span>{{ task.assigneeId }}</span>
            </div>
            <span v-else class="text-gray-400">未指派</span>
          </div>

          <!-- 优先级 -->
          <div class="cursor-pointer" @click="openTaskDetail(task._id)">
            <span
              class="inline-block px-2 py-1 text-xs font-medium rounded-full"
              :class="getPriorityBadgeClass(task.priority)"
            >
              {{ getPriorityText(task.priority) }}
            </span>
          </div>

          <!-- 最后更新 -->
          <div class="text-sm text-gray-500 cursor-pointer" @click="openTaskDetail(task._id)">
            {{ formatDate(task.updatedAt) }}
          </div>

          <!-- 状态 -->
          <div class="cursor-pointer" @click="openTaskDetail(task._id)">
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
      :mode="drawerMode"
      :task-id="selectedTaskId"
      :project-id="projectId"
      :all-tasks="tasks"
      @close="closeDrawer"
      @update:task-id="selectedTaskId = $event"
      @task-created="handleTaskCreated"
      @task-updated="handleTaskUpdated"
      @task-deleted="handleTaskDeleted"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import TaskDetailDrawer from '../TaskDetailDrawer.vue'
import { getTaskList, createTask as createTaskAPI, updateTask as updateTaskAPI, deleteTask as deleteTaskAPI } from '@/api/task'
import { importTasksFromMarkdown, readFromClipboard, exportTasksToMarkdown, copyToClipboard } from '@/utils/export'
import type { Task } from '@/types/task'

interface Props {
  projectId: string
}

const props = defineProps<Props>()

// 任务数据
const tasks = ref<Task[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)

// 排序状态
const sortField = ref<string | null>(null)
const sortDirection = ref<'asc' | 'desc'>('asc')

// 批量选择状态
const selectedTaskIds = ref<Set<string>>(new Set())

// 计算属性：是否全选
const isAllSelected = computed(() => {
  return tasks.value.length > 0 && selectedTaskIds.value.size === tasks.value.length
})

// 计算属性：是否部分选中
const isSomeSelected = computed(() => {
  return selectedTaskIds.value.size > 0 && selectedTaskIds.value.size < tasks.value.length
})

// 计算属性：排序后的任务列表
const sortedTasks = computed(() => {
  const tasksCopy = [...tasks.value]

  // 默认排序：待办任务在前，然后根据最后更新时间降序
  const defaultSort = (a: Task, b: Task) => {
    // 待办任务优先
    const statusOrder = { todo: 0, in_progress: 1, completed: 2 }
    const statusDiff = statusOrder[a.status] - statusOrder[b.status]
    if (statusDiff !== 0) return statusDiff

    // 然后按更新时间降序
    return b.updatedAt - a.updatedAt
  }

  // 如果没有选择排序字段，使用默认排序
  if (!sortField.value) {
    return tasksCopy.sort(defaultSort)
  }

  // 按选定字段排序
  return tasksCopy.sort((a: Task, b: Task) => {
    let compareA: any
    let compareB: any

    switch (sortField.value) {
      case 'displayId':
        compareA = a.displayId
        compareB = b.displayId
        break
      case 'title':
        compareA = a.title.toLowerCase()
        compareB = b.title.toLowerCase()
        break
      case 'assigneeId':
        compareA = a.assigneeId || ''
        compareB = b.assigneeId || ''
        break
      case 'priority':
        const priorityOrder = { low: 0, medium: 1, high: 2 }
        compareA = priorityOrder[a.priority]
        compareB = priorityOrder[b.priority]
        break
      case 'updatedAt':
        compareA = a.updatedAt
        compareB = b.updatedAt
        break
      case 'status':
        const statusOrder = { todo: 0, in_progress: 1, completed: 2 }
        compareA = statusOrder[a.status]
        compareB = statusOrder[b.status]
        break
      default:
        return 0
    }

    if (compareA < compareB) {
      return sortDirection.value === 'asc' ? -1 : 1
    }
    if (compareA > compareB) {
      return sortDirection.value === 'asc' ? 1 : -1
    }
    return 0
  })
})

// 切换排序
const toggleSort = (field: string) => {
  if (sortField.value === field) {
    // 同一字段：切换方向
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    // 新字段：默认升序
    sortField.value = field
    sortDirection.value = 'asc'
  }
}

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
  // 清空选择
  selectedTaskIds.value.clear()
}, { immediate: true })

// 切换单个任务选择
const toggleTaskSelection = (taskId: string) => {
  if (selectedTaskIds.value.has(taskId)) {
    selectedTaskIds.value.delete(taskId)
  } else {
    selectedTaskIds.value.add(taskId)
  }
  // 触发响应式更新
  selectedTaskIds.value = new Set(selectedTaskIds.value)
}

// 全选/取消全选
const toggleSelectAll = () => {
  if (isAllSelected.value) {
    // 取消全选
    selectedTaskIds.value.clear()
  } else {
    // 全选
    selectedTaskIds.value = new Set(tasks.value.map(t => t._id))
  }
}

// 清空选择
const clearSelection = () => {
  selectedTaskIds.value.clear()
  selectedTaskIds.value = new Set()
}

// 批量导出选中任务
const handleBatchExport = async () => {
  if (selectedTaskIds.value.size === 0) {
    ElMessage.warning('请先选择要导出的任务')
    return
  }

  try {
    // 获取选中的任务
    const selectedTasks = tasks.value.filter(t => selectedTaskIds.value.has(t._id))

    // 导出为 Markdown
    const markdown = exportTasksToMarkdown(selectedTasks)
    const success = await copyToClipboard(markdown)

    if (success) {
      ElMessage.success(`已导出 ${selectedTasks.length} 个任务到剪贴板`)
    } else {
      ElMessage.error('复制失败，请重试')
    }
  } catch (error) {
    console.error('Batch export error:', error)
    ElMessage.error('批量导出失败')
  }
}

// 从剪贴板导入任务
const handleImportTasks = async () => {
  if (!props.projectId) {
    ElMessage.warning('缺少项目ID，无法导入任务')
    return
  }

  try {
    const markdown = await readFromClipboard()

    if (!markdown) {
      // 如果无法读取剪贴板，提示用户手动粘贴
      const input = prompt('请粘贴 Markdown 格式的任务内容：')
      if (!input) return

      await importTasksFromMarkdownHelper(input)
    } else {
      await importTasksFromMarkdownHelper(markdown)
    }
  } catch (error) {
    console.error('Import tasks error:', error)
    ElMessage.error('导入任务失败')
  }
}

// 导入任务辅助函数
const importTasksFromMarkdownHelper = async (markdown: string) => {
  try {
    const parsedTasks = importTasksFromMarkdown(markdown, props.projectId!)

    if (parsedTasks.length === 0) {
      ElMessage.warning('未能解析出任务，请检查 Markdown 格式')
      return
    }

    let createdCount = 0
    let updatedCount = 0

    // 处理每个任务（创建或更新）
    const promises = parsedTasks.map(async task => {
      // 检查任务是否已经存在（通过 _id）
      const existingTask = task._id && tasks.value.find(t => t._id === task._id)

      if (existingTask) {
        // 更新已存在的任务
        updatedCount++
        return updateTaskAPI({
          id: task._id!,
          title: task.title || existingTask.title,
          content: task.content !== undefined ? task.content : existingTask.content,
          status: task.status || existingTask.status,
          priority: task.priority || existingTask.priority,
          assigneeId: task.assigneeId !== undefined ? task.assigneeId : existingTask.assigneeId,
          tagIds: task.tagIds || existingTask.tagIds,
          moduleIds: task.moduleIds || existingTask.moduleIds,
          dueDate: task.dueDate !== undefined ? task.dueDate : existingTask.dueDate
        })
      } else {
        // 创建新任务
        createdCount++
        return createTaskAPI({
          projectId: props.projectId!,
          title: task.title || '未命名任务',
          content: task.content || '',
          status: task.status || 'todo',
          priority: task.priority || 'medium',
          assigneeId: task.assigneeId,
          tagIds: task.tagIds || [],
          moduleIds: task.moduleIds || []
        })
      }
    })

    const processedTasks = await Promise.all(promises)

    // 显示结果消息
    const messages: string[] = []
    if (createdCount > 0) messages.push(`创建 ${createdCount} 个`)
    if (updatedCount > 0) messages.push(`更新 ${updatedCount} 个`)
    ElMessage.success(`成功${messages.join('、')}任务`)

    // 刷新任务列表
    await loadTasks()
  } catch (error: any) {
    console.error('Import from markdown error:', error)
    ElMessage.error(`导入失败：${error?.message || '未知错误'}`)
  }
}

// 键盘快捷键处理
const handleKeydown = (e: KeyboardEvent) => {
  // 检查是否在抽屉打开状态（如果打开，不处理快捷键）
  if (isDrawerOpen.value) return

  // 避免在输入框中触发
  const target = e.target as HTMLElement
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
    return
  }

  // N 快捷键创建任务
  if (e.key === 'n' || e.key === 'N') {
    e.preventDefault()
    handleCreateTask()
  } else if ((e.metaKey || e.ctrlKey) && e.key === 'i') {
    // cmd+i 或 ctrl+i 导入任务
    e.preventDefault()
    handleImportTasks()
  } else if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
    // cmd+e 或 ctrl+e 批量导出选中任务
    e.preventDefault()
    handleBatchExport()
  }
}

// 组件挂载时加载任务和注册快捷键
onMounted(() => {
  loadTasks()
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

// 抽屉状态
const isDrawerOpen = ref(false)
const selectedTaskId = ref<string>()
const drawerMode = ref<'view' | 'create'>('view')

// 打开任务详情
const openTaskDetail = (taskId: string) => {
  selectedTaskId.value = taskId
  drawerMode.value = 'view'
  isDrawerOpen.value = true
}

// 关闭抽屉
const closeDrawer = () => {
  isDrawerOpen.value = false
}

// 创建任务（打开创建模式的抽屉）
const handleCreateTask = () => {
  drawerMode.value = 'create'
  selectedTaskId.value = undefined
  isDrawerOpen.value = true
}

// 任务创建完成处理
const handleTaskCreated = (newTask: Task) => {
  // 将新任务添加到列表顶部
  tasks.value.unshift(newTask)

  // 切换到查看模式
  drawerMode.value = 'view'
  selectedTaskId.value = newTask._id
}

// 任务更新处理
const handleTaskUpdated = (updatedTask: Task) => {
  const index = tasks.value.findIndex(t => t._id === updatedTask._id)
  if (index !== -1) {
    tasks.value[index] = updatedTask
  } else {
    // 如果任务不存在，添加到列表顶部（用于 continueCreate 模式）
    tasks.value.unshift(updatedTask)
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
    ElMessage.error(err?.message || '删除任务失败')
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
