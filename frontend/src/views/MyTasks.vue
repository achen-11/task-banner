<template>
  <div class="p-6">
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

      <!-- 看板视图 -->
      <TaskBoardView v-else-if="currentView === 'board'" :tasks="tasks" :loading="loading" @refresh="refresh" />

      <!-- 其他视图占位 -->
      <div v-else class="flex items-center justify-center h-96 bg-white rounded-lg shadow-sm border border-gray-200">
        <div class="text-center">
          <p class="text-gray-500">该视图正在开发中</p>
          <p class="text-sm text-gray-400 mt-1">敬请期待</p>
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

// 组件导入
import ViewSwitcher from '@/components/my-tasks/ViewSwitcher.vue'
import TaskStatsCards from '@/components/my-tasks/TaskStatsCards.vue'
import TaskFilters from '@/components/my-tasks/TaskFilters.vue'
import TaskListView from '@/components/my-tasks/TaskListView.vue'
import TaskBoardView from '@/components/my-tasks/TaskBoardView.vue'
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
const handleExport = () => {
  ElMessage.info('导出功能正在开发中')
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

// 生命周期
onMounted(async () => {
  // 添加键盘事件监听
  document.addEventListener('keydown', handleKeyDown)

  // 加载项目列表
  await projectStore.fetchProjects()

  // 加载任务数据
  userTasksStore.fetchTasks(true)
  userTasksStore.fetchStats()
})

onUnmounted(() => {
  // 移除键盘事件监听
  document.removeEventListener('keydown', handleKeyDown)
})
</script>
