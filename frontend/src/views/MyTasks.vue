<template>
  <div class="h-full flex flex-col bg-gray-50 dark:bg-gray-900 p-6">
    <!-- 视图切换和标题 -->
    <ViewSwitcher :selected-tasks-count="selectedTasksCount" :loading="loading" @export="handleExport" />

    <!-- 任务统计卡片 -->
    <TaskStatsCards :stats="stats" />

    <!-- 筛选器 -->
    <TaskFilters v-model="filters" @quick-create="handleQuickCreate" />

    <!-- 视图内容 -->
    <div class="min-h-[400px]">
      <!-- 列表视图 -->
      <TaskListView v-if="currentView === 'list'" :tasks="tasks" :loading="loading" :selected-task-ids="selectedTaskIds"
        :selected-tasks-count="selectedTasksCount" @select-task="selectTask" @refresh="refresh" @load-more="loadMore" @task-click="handleTaskClick" />

      <!-- 看板视图：复用项目看板组件 -->
      <ProjectBoard
        v-else-if="currentView === 'board'"
        scope="global"
        :external-tasks="tasks"
        :external-loading="loading"
        @task-click="handleTaskClick"
        @refresh="refresh"
      />

      <!-- 其他视图占位 -->
      <div v-else class="flex items-center justify-center h-96 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div class="text-center">
          <p class="text-gray-500 dark:text-gray-400">该视图正在开发中</p>
          <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">敬请期待</p>
        </div>
      </div>
    </div>

    <!-- 快速创建任务弹窗 -->
    <QuickTaskModal v-model:visible="showQuickCreateModal" @created="handleTaskCreated" />

    <!-- 任务详情抽屉 -->
    <TaskDetailDrawer
      :is-open="showTaskDetail"
      :task-id="selectedTaskId"
      :project-id="selectedTaskProjectId"
      :all-tasks="tasks"
      @close="closeTaskDetail"
      @update:task-id="handleTaskUpdate"
      @task-updated="handleTaskUpdated"
      @task-deleted="handleTaskDeleted"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useProjectStore } from '@/stores/project'
import { useUserTasksStore } from '@/stores/userTasks'
import { ElMessage } from 'element-plus'
import { exportTasksToMarkdown, copyToClipboard } from '@/utils/export'

// 组件导入
import ViewSwitcher from '@/components/my-tasks/ViewSwitcher.vue'
import TaskStatsCards from '@/components/my-tasks/TaskStatsCards.vue'
import TaskFilters from '@/components/my-tasks/TaskFilters.vue'
import TaskListView from '@/components/my-tasks/TaskListView.vue'
import ProjectBoard from '@/components/project/ProjectBoard.vue'
import QuickTaskModal from '@/components/my-tasks/QuickTaskModal.vue'
import TaskDetailDrawer from '@/components/TaskDetailDrawer.vue'
import type { Task } from '@/types/task'

// Store
const projectStore = useProjectStore()
const userTasksStore = useUserTasksStore()

// 响应式数据
const showQuickCreateModal = ref(false)
const showTaskDetail = ref(false)
const selectedTaskId = ref<string>()
const selectedTaskProjectId = ref<string>()

// 计算属性
const tasks = computed(() => userTasksStore.tasks)
const loading = computed(() => userTasksStore.loading)
const stats = computed(() => userTasksStore.stats)
const currentView = computed(() => userTasksStore.currentView)
const filters = computed(() => userTasksStore.filters)
const selectedTaskIds = computed(() => userTasksStore.selectedTaskIds)
const selectedTasksCount = computed(() => userTasksStore.selectedTasksCount)

// 方法
const selectTask = userTasksStore.selectTask
const refresh = userTasksStore.refresh
const loadMore = userTasksStore.loadMore

// 处理快速创建
const handleQuickCreate = () => {
  showQuickCreateModal.value = true
}

// 处理任务创建成功
const handleTaskCreated = () => {
  ElMessage.success('任务创建成功')
  refresh()
}

// 处理导出
const handleExport = async () => {
  const tasksToExport =
    selectedTaskIds.value.length > 0
      ? tasks.value.filter(task => selectedTaskIds.value.includes(task._id))
      : tasks.value

  if (tasksToExport.length === 0) {
    ElMessage.warning('没有可导出的任务')
    return
  }

  try {
    const markdown = exportTasksToMarkdown(tasksToExport)
    const copied = await copyToClipboard(markdown)
    if (copied) {
      ElMessage.success(`已导出 ${tasksToExport.length} 个任务到剪贴板`)
    } else {
      ElMessage.error('复制失败，请重试')
    }
  } catch (error) {
    console.error('Export tasks error:', error)
    ElMessage.error('导出失败')
  }
}

// 处理任务点击
const handleTaskClick = (task: Task) => {
  selectedTaskId.value = task._id
  selectedTaskProjectId.value = task.projectId
  showTaskDetail.value = true
}

// 关闭任务详情
const closeTaskDetail = () => {
  showTaskDetail.value = false
  selectedTaskId.value = undefined
  selectedTaskProjectId.value = undefined
}

// 处理任务更新（切换到其他任务）
const handleTaskUpdate = (taskId: string) => {
  selectedTaskId.value = taskId
}

// 处理任务更新完成
const handleTaskUpdated = (task: Task) => {
  ElMessage.success('任务更新成功')
  refresh() // 刷新任务列表
}

// 处理任务删除
const handleTaskDeleted = (taskId: string) => {
  ElMessage.success('任务删除成功')
  closeTaskDetail()
  refresh() // 刷新任务列表
}

// 键盘快捷键
const handleKeyDown = (event: KeyboardEvent) => {
  // 避免在输入框中触发快捷键
  const target = event.target as HTMLElement
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

  // Ctrl/Cmd + N - 快速创建任务
  if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
    event.preventDefault()
    handleQuickCreate()
  }
}

// WebSocket 消息处理
const handleWebSocketTaskCreated = (event: CustomEvent) => {
  const { message } = event.detail
  // 刷新任务列表（因为新任务可能符合当前筛选条件）
  userTasksStore.refresh()
}

const handleWebSocketTaskUpdated = (event: CustomEvent) => {
  const { message } = event.detail
  // 刷新任务列表以获取最新数据
  userTasksStore.refresh()
}

const handleWebSocketTaskDeleted = (event: CustomEvent) => {
  const { data, message } = event.detail
  // 从列表中移除任务
  const taskId = data.taskId
  const taskIndex = userTasksStore.tasks.findIndex(t => t._id === taskId)
  if (taskIndex !== -1) {
    userTasksStore.tasks.splice(taskIndex, 1)
  }
  
  // 如果删除的是当前打开的任务，关闭详情
  if (selectedTaskId.value === taskId) {
    closeTaskDetail()
  }
}

// 生命周期
onMounted(async () => {
  // 添加键盘事件监听
  document.addEventListener('keydown', handleKeyDown)

  // 加载项目列表
  await projectStore.fetchProjects()

  // 加载任务数据
  userTasksStore.fetchTasks(true)
  userTasksStore.fetchStats()

  // 监听 WebSocket 消息
  window.addEventListener('websocket:task-created', handleWebSocketTaskCreated as EventListener)
  window.addEventListener('websocket:task-updated', handleWebSocketTaskUpdated as EventListener)
  window.addEventListener('websocket:task-deleted', handleWebSocketTaskDeleted as EventListener)
})

onUnmounted(() => {
  // 移除键盘事件监听
  document.removeEventListener('keydown', handleKeyDown)

  // 移除 WebSocket 消息监听
  window.removeEventListener('websocket:task-created', handleWebSocketTaskCreated as EventListener)
  window.removeEventListener('websocket:task-updated', handleWebSocketTaskUpdated as EventListener)
  window.removeEventListener('websocket:task-deleted', handleWebSocketTaskDeleted as EventListener)
})
</script>
