<template>
  <div
    class="h-full flex flex-col bg-gray-50 dark:bg-gray-900"
    :class="focusMode ? '' : 'p-6'"
  >
    <div v-show="!focusMode" class="shrink-0">
      <ViewSwitcher :selected-tasks-count="selectedTasksCount" :loading="loading" @export="handleExport" />
      <TaskStatsCards :stats="stats" />
      <TaskFilters v-model="filters" @quick-create="handleQuickCreate" />
    </div>

    <div
      class="min-h-0"
      :class="focusMode && currentView === 'board' ? 'flex-1 flex flex-col' : 'min-h-[400px]'"
    >
      <TaskListView
        v-if="currentView === 'list'"
        :tasks="tasks"
        :loading="loading"
        :selected-task-ids="selectedTaskIds"
        :selected-tasks-count="selectedTasksCount"
        @select-task="selectTask"
        @refresh="refresh"
        @load-more="loadMore"
        @task-click="handleTaskClick"
      />

      <ProjectBoard
        v-else-if="currentView === 'board'"
        class="flex-1 min-h-0"
        scope="global"
        :external-tasks="tasks"
        :external-loading="loading"
        @task-click="handleTaskClick"
        @refresh="refresh"
      />

      <div
        v-else
        class="flex items-center justify-center h-96 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
      >
        <div class="text-center">
          <p class="text-gray-500 dark:text-gray-400">该视图正在开发中</p>
          <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">敬请期待</p>
        </div>
      </div>
    </div>

    <QuickTaskModal v-model:visible="showQuickCreateModal" @created="handleTaskCreated" />

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
import { ref, computed, onMounted, onUnmounted, watch, provide, toRef } from 'vue'
import { useRoute } from 'vue-router'
import { useProjectStore } from '@/stores/project'
import { useUserTasksStore } from '@/stores/userTasks'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'
import { ElMessage } from 'element-plus'
import { exportTasksToMarkdown, copyToClipboard } from '@/utils/export'

import ViewSwitcher from '@/components/my-tasks/ViewSwitcher.vue'
import TaskStatsCards from '@/components/my-tasks/TaskStatsCards.vue'
import TaskFilters from '@/components/my-tasks/TaskFilters.vue'
import TaskListView from '@/components/my-tasks/TaskListView.vue'
import ProjectBoard from '@/components/project/ProjectBoard.vue'
import QuickTaskModal from '@/components/my-tasks/QuickTaskModal.vue'
import TaskDetailDrawer from '@/components/TaskDetailDrawer.vue'
import type { Task } from '@/types/task'

const route = useRoute()
const projectStore = useProjectStore()
const userTasksStore = useUserTasksStore()
const authStore = useAuthStore()
const uiStore = useUIStore()

const showQuickCreateModal = ref(false)
const showTaskDetail = ref(false)
const selectedTaskId = ref<string>()
const selectedTaskProjectId = ref<string>()

const focusMode = computed(() => uiStore.pageFocusMode)

provide('focusMode', toRef(uiStore, 'pageFocusMode'))
provide('toggleFocusMode', () => {
  if (uiStore.pageFocusMode) {
    uiStore.exitPageFocusMode()
  } else {
    uiStore.enterPageFocusMode({ showHint: true })
  }
})

const tasks = computed(() => userTasksStore.tasks)
const loading = computed(() => userTasksStore.loading)
const stats = computed(() => userTasksStore.stats)
const currentView = computed(() => userTasksStore.currentView)
const filters = computed(() => userTasksStore.filters)
const selectedTaskIds = computed(() => userTasksStore.selectedTaskIds)
const selectedTasksCount = computed(() => userTasksStore.selectedTasksCount)

const selectTask = userTasksStore.selectTask
const refresh = userTasksStore.refresh
const loadMore = userTasksStore.loadMore

const syncFocusForView = (view: 'list' | 'board', options?: { showHint?: boolean }) => {
  if (view === 'board' && route.query.focus !== '0') {
    uiStore.enterPageFocusMode({ showHint: options?.showHint })
  } else if (view !== 'board') {
    uiStore.exitPageFocusMode()
  }
}

watch(currentView, (view) => {
  syncFocusForView(view, { showHint: false })
})

const handleQuickCreate = () => {
  showQuickCreateModal.value = true
}

const handleTaskCreated = () => {
  ElMessage.success('任务创建成功')
  refresh()
}

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

const handleTaskClick = (task: Task) => {
  selectedTaskId.value = task._id
  selectedTaskProjectId.value = task.projectId
  showTaskDetail.value = true
}

const closeTaskDetail = () => {
  showTaskDetail.value = false
  selectedTaskId.value = undefined
  selectedTaskProjectId.value = undefined
}

const handleTaskUpdate = (taskId: string) => {
  selectedTaskId.value = taskId
}

const handleTaskUpdated = () => {
  ElMessage.success('任务更新成功')
  refresh()
}

const handleTaskDeleted = (taskId: string) => {
  ElMessage.success('任务删除成功')
  closeTaskDetail()
  refresh()
}

const handleKeyDown = (event: KeyboardEvent) => {
  const target = event.target as HTMLElement
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

  if (event.key === 'F1' && currentView.value === 'board') {
    event.preventDefault()
    uiStore.togglePageFocusMode({ showHint: false })
    return
  }

  if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
    event.preventDefault()
    handleQuickCreate()
  }
}

const handleWebSocketTaskCreated = () => {
  userTasksStore.refresh()
}

const handleWebSocketTaskUpdated = () => {
  userTasksStore.refresh()
}

const handleWebSocketTaskDeleted = (event: CustomEvent) => {
  const { data } = event.detail
  const taskId = data.taskId
  const taskIndex = userTasksStore.tasks.findIndex(t => t._id === taskId)
  if (taskIndex !== -1) {
    userTasksStore.tasks.splice(taskIndex, 1)
  }
  if (selectedTaskId.value === taskId) {
    closeTaskDetail()
  }
}

onMounted(async () => {
  document.addEventListener('keydown', handleKeyDown)

  await projectStore.fetchProjects()

  if (!authStore.user) {
    await authStore.checkAuth()
  }
  userTasksStore.applyDefaultStatusFilter(authStore.user?.preferences)

  if (userTasksStore.currentView !== 'board') {
    userTasksStore.switchView('board')
  }
  syncFocusForView(userTasksStore.currentView, { showHint: false })
  if (userTasksStore.currentView === 'board' && route.query.focus !== '0' && uiStore.pageFocusMode) {
    uiStore.triggerFocusEnterHint()
  }

  userTasksStore.fetchTasks(true)
  userTasksStore.fetchStats()

  window.addEventListener('websocket:task-created', handleWebSocketTaskCreated as EventListener)
  window.addEventListener('websocket:task-updated', handleWebSocketTaskUpdated as EventListener)
  window.addEventListener('websocket:task-deleted', handleWebSocketTaskDeleted as EventListener)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
  uiStore.exitPageFocusMode()

  window.removeEventListener('websocket:task-created', handleWebSocketTaskCreated as EventListener)
  window.removeEventListener('websocket:task-updated', handleWebSocketTaskUpdated as EventListener)
  window.removeEventListener('websocket:task-deleted', handleWebSocketTaskDeleted as EventListener)
})
</script>
