<template>
  <div class="h-full flex flex-col">
    <!-- 看板头部 -->
    <div class="px-4 mb-4">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center">
          <h2 class="text-lg font-semibold text-gray-900">看板视图</h2>
          <div class="text-sm text-gray-500 ml-3">
            <span v-if="loading">加载中...</span>
            <span v-else>{{ tasks.length }} 个任务</span>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <!-- 批量操作区域 -->
          <div v-if="selectedTaskIds.size > 0" class="flex items-center gap-2">
            <span class="text-sm text-blue-600 font-medium">已选择 {{ selectedTaskIds.size }} 个</span>
            <el-tooltip placement="bottom">
              <template #content>
                <div class="flex items-center gap-1.5">
                  <Keyboard :size="14" />
                  <span>{{ getShortcutTooltip('e', true) }}</span>
                </div>
              </template>
              <button class="px-3 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors"
                @click="handleBatchExport">
                <svg class="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                批量导出
              </button>
            </el-tooltip>
            <button class="px-3 py-1 text-xs text-gray-600 hover:bg-gray-50 rounded transition-colors"
              @click="clearSelection">
              取消选择
            </button>
          </div>

          <!-- 右侧按钮组 -->
          <div class="flex items-center gap-2">
            <el-tooltip placement="bottom">
              <template #content>
                <div class="flex items-center gap-1.5">
                  <Keyboard :size="14" />
                  <span>{{ getShortcutTooltip('n') }}</span>
                </div>
              </template>
              <el-button
                @click="handleCreateTask"
                type="primary"
                :style="{ backgroundColor: '#3762E3', borderColor: '#3762E3' }"
              >
                <el-icon class="mr-1">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                </el-icon>
                新建任务
              </el-button>
            </el-tooltip>

            <button
              @click="showColumnManager = true"
              class="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
              管理栏目
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 看板内容 -->
    <div class="flex-1 flex gap-4 overflow-hidden">
      <!-- 加载状态 -->
      <div v-if="loading" class="flex-1 flex items-center justify-center">
        <div class="text-center">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p class="text-gray-500 mt-2">加载中...</p>
        </div>
      </div>

      <!-- 看板列 -->
    <template v-else>
      <div
        v-for="column in columns"
        :key="column.status"
        :data-status="column.status"
        class="flex-1 bg-white rounded-lg shadow-sm border border-gray-100 flex flex-col min-w-0"
      >
        <!-- 列头 -->
        <div class="p-4 border-b border-gray-100">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <!-- 全选框 -->
              <input
                type="checkbox"
                class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                :checked="isAllTasksInColumnSelected(column.status)"
                :indeterminate="isSomeTasksInColumnSelected(column.status)"
                @change="toggleSelectAllInColumn(column.status, ($event.target as HTMLInputElement).checked)"
              />
              <h3 class="font-semibold text-gray-900">{{ column.title }}</h3>
            </div>
            <span
              class="px-2 py-1 text-xs rounded-full font-medium"
              :class="column.badgeClass"
            >
              {{ getColumnTaskCount(column.status) }}
            </span>
          </div>
        </div>

        <!-- 任务列表 -->
        <div
          class="flex-1 p-3 overflow-auto min-h-[200px]"
          :data-status="column.status"
          @dragover.prevent
          @drop="handleDrop($event, column.status)"
        >
          <draggable
            v-model="column.tasks"
            :group="{ name: 'tasks', pull: true, put: true, revertOnSpill: true }"
            item-key="_id"
            ghost-class="opacity-50"
            chosen-class="chosen-task"
            drag-class="opacity-75"
            :animation="200"
            :force-fallback="false"
            :emptyInsertThreshold="100"
            @end="handleDragEnd"
            @change="handleDragChange"
          >
            <template #item="{ element: task }">
              <div
                class="bg-gray-50 border rounded-lg p-3 mb-3 hover:shadow-md transition-shadow duration-200 relative"
                :class="{
                  'cursor-pointer': !selectedTaskIds.has(task._id),
                  'ring-2 ring-blue-500 border-blue-500': selectedTaskIds.has(task._id),
                  'border-gray-200': !selectedTaskIds.has(task._id)
                }"
                @click="handleTaskClick(task)"
              >
                <div class="flex items-start gap-2">
                  <!-- 选择框 -->
                  <input
                    type="checkbox"
                    class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer bg-white shadow-sm mt-0.5 flex-shrink-0"
                    :checked="selectedTaskIds.has(task._id)"
                    @change="handleTaskSelect(task._id, ($event.target as HTMLInputElement).checked)"
                    @click.stop
                  />
                  <!-- 任务内容 -->
                  <div class="flex-1 min-w-0">
                    <!-- 任务标题 -->
                    <h4 class="font-medium text-gray-900 text-sm mb-2 line-clamp-2">{{ task.title }}</h4>

                    <!-- 任务描述 -->
                    <p v-if="task.summary" class="text-xs text-gray-500 mb-3 line-clamp-2">{{ task.summary }}</p>

                    <!-- 任务标签 -->
                    <div v-if="(task as any).tags && (task as any).tags.length > 0" class="flex flex-wrap gap-1 mb-3">
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
                        class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600"
                      >
                        +{{ (task as any).tags.length - 2 }}
                      </span>
                    </div>

                    <!-- 底部信息 -->
                    <div class="flex items-center justify-between">
                      <!-- 优先级 -->
                      <span
                        class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                        :class="getPriorityClass(task.priority)"
                      >
                        {{ getPriorityText(task.priority) }}
                      </span>

                      <!-- 指派人头像 -->
                      <div v-if="task.assignee" class="flex items-center">
                        <div class="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-medium">
                          {{ getAssigneeInitial(task.assignee) }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </draggable>
        </div>
      </div>
    </template>
    </div>

    <!-- 栏目管理对话框 -->
    <el-dialog
      v-model="showColumnManager"
      title="管理看板栏目"
      width="600px"
      :before-close="handleColumnManagerClose"
    >
      <!-- 添加新栏 -->
      <div class="mb-6">
        <h4 class="text-sm font-medium text-gray-900 mb-3">添加新栏目</h4>
        <div class="flex gap-3">
          <el-input
            v-model="newColumnForm.title"
            placeholder="栏目名称"
            style="flex: 1"
          />
          <el-select v-model="newColumnForm.badgeClass" placeholder="标签颜色">
            <el-option
              v-for="option in badgeClassOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            >
              <span class="flex items-center gap-2">
                <span
                  class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                  :class="option.value"
                >
                  {{ option.label }}
                </span>
              </span>
            </el-option>
          </el-select>
          <el-button type="primary" @click="handleAddColumn">添加</el-button>
        </div>
      </div>

      <!-- 现有栏目列表 -->
      <div>
        <h4 class="text-sm font-medium text-gray-900 mb-3">现有栏目</h4>
        <div class="space-y-2">
          <div
            v-for="column in columns"
            :key="column.id"
            class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div class="flex items-center gap-3">
              <span
                class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                :class="column.badgeClass"
              >
                {{ column.title }}
              </span>
              <span v-if="column.isDefault" class="text-xs text-gray-500">默认栏目</span>
            </div>
            <div class="flex items-center gap-2">
              <el-button
                v-if="!column.isDefault"
                size="small"
                @click="handleEditColumn(column)"
              >
                编辑
              </el-button>
              <el-button
                v-if="!column.isDefault"
                size="small"
                type="danger"
                plain
                @click="handleDeleteColumn(column)"
              >
                删除
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>

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
import { ref, onMounted, computed, watch } from 'vue'
import draggable from 'vuedraggable'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getTaskList, updateTask, updateTaskOrder } from '@/api/task'
import { registerShortcut, unregisterShortcut, formatShortcut } from '@/composables/useKeyboard'
import { Keyboard } from 'lucide-vue-next'
import type { Project } from '@/types/project'
import type { Task } from '@/types/task'
import TaskDetailDrawer from '@/components/TaskDetailDrawer.vue'

interface Props {
  project: Project | null
}

interface Column {
  id: string
  status: string
  title: string
  badgeClass: string
  tasks: Task[]
  isDefault?: boolean
}

const props = defineProps<Props>()

// 响应式数据
const loading = ref(true)
const tasks = ref<Task[]>([])
const showColumnManager = ref(false)

// 任务详情抽屉相关
const showTaskDetail = ref(false)
const selectedTaskId = ref<string>()
const selectedTaskProjectId = ref<string>()

// 批量选择相关
const selectedTaskIds = ref<Set<string>>(new Set())

// 看板列配置
const defaultColumns: Omit<Column, 'tasks' | 'id'>[] = [
  {
    status: 'todo',
    title: '待办',
    badgeClass: 'bg-blue-100 text-blue-700',
    isDefault: true
  },
  {
    status: 'review',
    title: '待验收',
    badgeClass: 'bg-purple-100 text-purple-700',
    isDefault: true
  },
  {
    status: 'in_progress',
    title: '进行中',
    badgeClass: 'bg-yellow-100 text-yellow-700',
    isDefault: true
  },
  {
    status: 'completed',
    title: '已完成',
    badgeClass: 'bg-green-100 text-green-700',
    isDefault: true
  }
]

// 生成列ID
const generateColumnId = () => `custom_${Date.now()}`

const columns = ref<Column[]>(
  defaultColumns.map(col => ({
    ...col,
    id: col.status,
    tasks: []
  }))
)

// 新增列表单
const newColumnForm = ref({
  title: '',
  badgeClass: 'bg-gray-100 text-gray-700'
})

const badgeClassOptions = [
  { label: '灰色', value: 'bg-gray-100 text-gray-700' },
  { label: '红色', value: 'bg-red-100 text-red-700' },
  { label: '橙色', value: 'bg-orange-100 text-orange-700' },
  { label: '黄色', value: 'bg-yellow-100 text-yellow-700' },
  { label: '绿色', value: 'bg-green-100 text-green-700' },
  { label: '蓝色', value: 'bg-blue-100 text-blue-700' },
  { label: '紫色', value: 'bg-purple-100 text-purple-700' }
]

// 计算属性
const projectId = computed(() => props.project?._id)

// 方法
const loadTasks = async () => {
  if (!projectId.value) return

  try {
    loading.value = true
    const response = await getTaskList({
      projectId: projectId.value,
      page: 1,
      size: 100
    })

    tasks.value = response.items
    distributeTasksToColumns()
  } catch (error) {
    console.error('Failed to load tasks:', error)
    ElMessage.error('加载任务失败')
  } finally {
    loading.value = false
  }
}

const distributeTasksToColumns = () => {
  // 重置所有列的任务
  columns.value.forEach(column => {
    column.tasks = []
  })

  // 将任务分配到对应的列
  tasks.value.forEach(task => {
    const column = columns.value.find(col => col.status === task.status)
    if (column) {
      column.tasks.push(task)
    }
  })
}

const getColumnTaskCount = (status: string) => {
  const column = columns.value.find(col => col.status === status)
  return column?.tasks.length || 0
}

const getPriorityClass = (priority: string) => {
  const classMap: Record<string, string> = {
    urgent: 'bg-red-100 text-red-700',
    high: 'bg-orange-100 text-orange-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-gray-100 text-gray-700'
  }
  return classMap[priority] || 'bg-gray-100 text-gray-700'
}

const getPriorityText = (priority: string) => {
  const textMap: Record<string, string> = {
    urgent: '紧急',
    high: '高',
    medium: '中',
    low: '低'
  }
  return textMap[priority] || priority
}

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

const handleTaskClick = (task: Task) => {
  selectedTaskId.value = task._id
  selectedTaskProjectId.value = task.projectId
  showTaskDetail.value = true
}

// 处理拖拽到容器的事件
const handleDrop = (event: DragEvent, targetStatus: string) => {
  event.preventDefault()
  // 这里主要是为了确保空列也能接收拖拽，实际逻辑在 handleDragEnd 中处理
}

// 拖拽变化处理
const handleDragChange = (event: any) => {
  // 可以在这里处理拖拽过程中的视觉反馈
}

const handleDragEnd = async (event: any) => {
  const { item, from, to, oldIndex, newIndex } = event

  const task = item.__draggable_context.element as Task
  if (!task) return

  // 获取源列和目标列的状态
  const fromStatus = from.parentElement?.getAttribute('data-status')
  const toStatus = to.parentElement?.getAttribute('data-status')

  console.log('Drag end:', { fromStatus, toStatus, taskStatus: task.status })

  // 如果没有改变位置，直接返回
  if (fromStatus === toStatus && oldIndex === newIndex) {
    return
  }

  // 如果状态发生变化（跨列拖拽）
  if (fromStatus !== toStatus && toStatus) {
    try {
      await updateTask({
        id: task._id,
        status: toStatus as any
      })

      ElMessage.success('任务状态更新成功')

      // 重新加载任务以确保状态同步
      await loadTasks()
    } catch (error) {
      console.error('Failed to update task status:', error)
      ElMessage.error('更新任务状态失败')
      // 重新加载任务以回滚状态
      await loadTasks()
    }
  }
  // 如果是同一列内的拖拽（顺序变更）
  else {
    await saveTaskOrder()
  }
}

// 保存任务顺序
const saveTaskOrder = async () => {
  try {
    // 收集所有任务并按顺序排序
    const allTasksWithOrder: Array<{ id: string; order: number }> = []

    columns.value.forEach((column, columnIndex) => {
      column.tasks.forEach((task, taskIndex) => {
        allTasksWithOrder.push({
          id: task._id,
          order: columnIndex * 1000 + taskIndex // 使用列索引和任务索引生成唯一顺序
        })
      })
    })

    if (allTasksWithOrder.length > 0) {
      await updateTaskOrder({
        tasks: allTasksWithOrder
      })
    }
  } catch (error) {
    console.error('Failed to save task order:', error)
    ElMessage.error('保存任务顺序失败')
  }
}

// 栏目管理方法
const handleAddColumn = () => {
  if (!newColumnForm.value.title.trim()) {
    ElMessage.warning('请输入栏目名称')
    return
  }

  const newColumn: Column = {
    id: generateColumnId(),
    status: `custom_${Date.now()}`,
    title: newColumnForm.value.title.trim(),
    badgeClass: newColumnForm.value.badgeClass,
    tasks: [],
    isDefault: false
  }

  columns.value.push(newColumn)
  newColumnForm.value = {
    title: '',
    badgeClass: 'bg-gray-100 text-gray-700'
  }

  ElMessage.success('栏目添加成功')
}

const handleEditColumn = (column: Column) => {
  if (column.isDefault) {
    ElMessage.warning('默认栏目不能编辑')
    return
  }

  ElMessageBox.prompt('请输入新的栏目名称', '编辑栏目', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputValue: column.title
  }).then(({ value }) => {
    if (value && value.trim()) {
      column.title = value.trim()
      ElMessage.success('栏目更新成功')
    } else {
      ElMessage.warning('栏目名称不能为空')
    }
  }).catch(() => {
    // 用户取消
  })
}

const handleDeleteColumn = (column: Column) => {
  if (column.isDefault) {
    ElMessage.warning('默认栏目不能删除')
    return
  }

  if (column.tasks.length > 0) {
    ElMessageBox.confirm(
      `该栏目有 ${column.tasks.length} 个任务，删除后这些任务将移动到"待办"栏目。确定删除吗？`,
      '确认删除',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(() => {
      // 将任务移动到待办栏目
      const todoColumn = columns.value.find(col => col.status === 'todo')
      if (todoColumn) {
        column.tasks.forEach(task => {
          task.status = 'todo'
          todoColumn.tasks.push(task)
        })
      }

      // 删除列
      const index = columns.value.findIndex(col => col.id === column.id)
      if (index > -1) {
        columns.value.splice(index, 1)
      }

      ElMessage.success('栏目删除成功')
    }).catch(() => {
      // 用户取消
    })
  } else {
    // 直接删除空栏目
    const index = columns.value.findIndex(col => col.id === column.id)
    if (index > -1) {
      columns.value.splice(index, 1)
      ElMessage.success('栏目删除成功')
    }
  }
}

const handleColumnManagerClose = () => {
  showColumnManager.value = false
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
  loadTasks() // 重新加载任务列表
}

// 处理任务删除
const handleTaskDeleted = (taskId: string) => {
  ElMessage.success('任务删除成功')
  closeTaskDetail()
  loadTasks() // 重新加载任务列表
}

// 监听项目变化
watch(() => props.project, (newProject) => {
  if (newProject) {
    loadTasks()
  }
}, { immediate: true })

// 快捷键提示
const getShortcutTooltip = (key: string, meta = false) => {
  const shortcut = formatShortcut({
    key,
    meta,
    description: ''
  })
  return `快捷键: ${shortcut}`
}

// 新建任务处理
const handleCreateTask = () => {
  // TODO: 实现新建任务功能
  ElMessage.info('新建任务功能开发中...')
}

// 批量操作相关方法
const handleTaskSelect = (taskId: string, selected: boolean) => {
  if (selected) {
    selectedTaskIds.value.add(taskId)
  } else {
    selectedTaskIds.value.delete(taskId)
  }
}

const clearSelection = () => {
  selectedTaskIds.value.clear()
}

const isAllTasksInColumnSelected = (columnStatus: string) => {
  const columnTasks = columns.value.find(col => col.status === columnStatus)?.tasks || []
  return columnTasks.length > 0 && columnTasks.every(task => selectedTaskIds.value.has(task._id))
}

const isSomeTasksInColumnSelected = (columnStatus: string) => {
  const columnTasks = columns.value.find(col => col.status === columnStatus)?.tasks || []
  const selectedCount = columnTasks.filter(task => selectedTaskIds.value.has(task._id)).length
  return selectedCount > 0 && selectedCount < columnTasks.length
}

const toggleSelectAllInColumn = (columnStatus: string, selected: boolean) => {
  const columnTasks = columns.value.find(col => col.status === columnStatus)?.tasks || []
  columnTasks.forEach(task => {
    if (selected) {
      selectedTaskIds.value.add(task._id)
    } else {
      selectedTaskIds.value.delete(task._id)
    }
  })
}

const handleBatchExport = async () => {
  if (selectedTaskIds.value.size === 0) {
    ElMessage.warning('请先选择要导出的任务')
    return
  }

  // TODO: 实现批量导出功能
  ElMessage.info(`批量导出 ${selectedTaskIds.value.size} 个任务功能开发中...`)
}

// 快捷键注册
onMounted(() => {
  // 注册 N 键新建任务
  registerShortcut({
    key: 'n',
    description: '新建任务',
    handler: handleCreateTask,
    category: '看板'
  })

  // 注册 Ctrl/Cmd+E 批量导出
  registerShortcut({
    key: 'e',
    ctrl: true,
    meta: true,
    description: '批量导出',
    handler: handleBatchExport,
    category: '看板'
  })
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 拖拽样式 */
.sortable-ghost {
  opacity: 0.5;
}

.chosen-task {
  border: 2px solid #3b82f6 !important;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2) !important;
}

.sortable-drag {
  opacity: 0.75;
}
</style>
