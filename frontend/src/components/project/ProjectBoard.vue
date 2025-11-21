<template>
  <div class="h-full flex flex-col">
    <!-- 看板头部 -->
    <div class="px-4 mb-4" :class="{ 'hidden': focusMode }">
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
                  <span>{{ getShortcutTooltip('i', true) }}</span>
                </div>
              </template>
              <el-button
                @click="handleImportTasks"
                type="default"
              >
                <el-icon class="mr-1">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </el-icon>
                导入任务
              </el-button>
            </el-tooltip>

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

            <el-tooltip placement="bottom">
              <template #content>
                <div class="flex items-center gap-1.5">
                  <Keyboard :size="14" />
                  <span>{{ focusMode ? '退出专注模式 (F1)' : '专注模式 (F1)' }}</span>
                </div>
              </template>
              <el-button
                @click="toggleFocusMode"
                :type="focusMode ? 'default' : 'primary'"
              >
                <el-icon class="mr-1">
                  <svg v-if="!focusMode" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <svg v-else fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                </el-icon>
                {{ focusMode ? '退出专注' : '专注模式' }}
              </el-button>
            </el-tooltip>
          </div>
        </div>
      </div>
    </div>

    <!-- 专注模式悬浮按钮 -->
    <div v-if="focusMode" class="fixed top-16 right-4 z-50 bg-white rounded-full shadow-lg p-3 border border-gray-200">
      <el-tooltip>
        <template #content>
          <div class="flex items-center gap-1.5">
            <Keyboard :size="14" />
            <span>退出专注模式 (F1)</span>
          </div>
        </template>
        <el-button type="default" @click="toggleFocusMode" circle size="small">
          <el-icon>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          </el-icon>
        </el-button>
      </el-tooltip>
    </div>

    <!-- 看板内容 -->
    <div class="flex-1 flex gap-4 overflow-hidden" :class="focusMode ? 'h-full' : 'h-[calc(100%-73px)]'">
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

    <!-- 任务详情抽屉 -->
    <TaskDetailDrawer
      :is-open="showTaskDetail"
      :mode="drawerMode"
      :task-id="selectedTaskId"
      :project-id="projectId"
      :all-tasks="tasks"
      @close="closeTaskDetail"
      @update:task-id="handleTaskUpdate"
      @task-updated="handleTaskUpdated"
      @task-deleted="handleTaskDeleted"
      @task-created="handleTaskCreated"
    />

    <!-- 导入确认对话框 -->
    <ImportTaskDialog
      :visible="importConfirmVisible"
      :tasks="tasksToImport"
      :loading="importing"
      @update:visible="importConfirmVisible = $event"
      @confirm="handleImportConfirm"
      @cancel="importConfirmVisible = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, provide, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import draggable from 'vuedraggable'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getTaskList, updateTask, updateTaskOrder, deleteTask } from '@/api/task'
import { registerShortcut, unregisterShortcut, formatShortcut } from '@/composables/useKeyboard'
import { Keyboard } from 'lucide-vue-next'
import type { Project } from '@/types/project'
import type { Task } from '@/types/task'
import TaskDetailDrawer from '@/components/TaskDetailDrawer.vue'
import ImportTaskDialog from './ImportTaskDialog.vue'
import { importTasksFromMarkdown, importTasksFromJSON, readFromClipboard, exportTasksToMarkdown, copyToClipboard, parseAISolution, ImportService } from '@/utils/export'

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
const drawerMode = ref<'view' | 'create'>('view')

// 批量选择相关
const selectedTaskIds = ref<Set<string>>(new Set())

// 专注模式相关
const focusMode = ref(false)
const toggleFocusMode = () => {
  focusMode.value = !focusMode.value
}

// 提供专注模式状态给子组件
provide('focusMode', focusMode)
provide('toggleFocusMode', toggleFocusMode)

// 导入确认对话框状态
const importConfirmVisible = ref(false)
const importing = ref(false)
const tasksToImport = ref<Array<Partial<Task> & {
  summary?: string
  existingInfo?: {
    title: string
    status: string
    priority: string
  }
  aiSolution?: string
}>>([])

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
  drawerMode.value = 'view' // 确保重置为查看模式
}

// 处理任务更新（切换到其他任务）
const handleTaskUpdate = (taskId: string) => {
  selectedTaskId.value = taskId
  drawerMode.value = 'view' // 确保切换到查看模式
}

// 处理任务更新完成
const handleTaskUpdated = (task: Task) => {
  ElMessage.success('任务更新成功')
  loadTasks() // 重新加载任务列表
}

// 处理任务删除
const handleTaskDeleted = async (taskId: string) => {
  try {
    await deleteTask(taskId)
    ElMessage.success('任务删除成功')
    closeTaskDetail()
    loadTasks() // 重新加载任务列表
  } catch (err: any) {
    console.error('Failed to delete task:', err)
    ElMessage.error(err?.message || '删除任务失败')
  }
}

// 任务创建完成处理
const handleTaskCreated = (newTask: Task) => {
  // 将新任务添加到对应列的顶部
  const column = columns.value.find(col => col.status === newTask.status)
  if (column) {
    column.tasks.unshift(newTask)
  }
  
  // 更新任务列表
  tasks.value.unshift(newTask)
  
  // 切换到查看模式
  drawerMode.value = 'view'
  selectedTaskId.value = newTask._id
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
  drawerMode.value = 'create'
  selectedTaskId.value = undefined
  showTaskDetail.value = true
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

// 从剪贴板导入任务（支持 JSON 和 Markdown）
const handleImportTasks = async () => {
  if (!projectId.value) {
    ElMessage.warning('缺少项目ID，无法导入任务')
    return
  }

  try {
    const content = await readFromClipboard()

    if (!content) {
      // 如果无法读取剪贴板，提示用户手动粘贴
      const input = prompt('请粘贴 JSON 或 Markdown 格式的任务内容：')
      if (!input) return

      await importTasksHelper(input)
    } else {
      await importTasksHelper(content)
    }
  } catch (error) {
    console.error('Import tasks error:', error)
    ElMessage.error('导入任务失败')
  }
}

// 导入任务辅助函数（智能识别 JSON 或 Markdown）
const importTasksHelper = async (content: string) => {
  try {
    // 使用统一的ImportService自动识别并导入
    const { tasks, format } = ImportService.autoImport(content, projectId.value!)
    ImportService.validateTasks(tasks)

    // 解析 AI 解决方案
    const aiSolution = parseAISolution(content)

    // 为每个任务添加 AI 解决方案
    tasks.forEach((task, index) => {
      if (aiSolution) {
        (task as any).aiSolution = aiSolution.content
        task.summary = aiSolution.summary
      }
    })

    // 保存待导入的任务并显示确认对话框
    tasksToImport.value = tasks
    importConfirmVisible.value = true
  } catch (error) {
    console.error('Parse tasks error:', error)
    ElMessage.error('解析任务失败')
  }
}

// 处理导入确认
const handleImportConfirm = async (finalTasks: any[]) => {
  importing.value = true
  try {
    // 处理每个任务（导入为评论）
    const promises = finalTasks.map(async task => {
      // 如果有 _id，先检查任务是否存在
      if (task._id) {
        try {
          // 尝试获取任务详情，检查是否存在
          const response = await fetch(`/api/task/detail?id=${task._id}`)
          const result = await response.json()

          if (result.code === 200) {
            // 任务存在，更新任务状态和摘要，并将 AI 解决方案作为评论导入
            const updateData: any = {
              id: task._id,
              summary: task.summary || ''
            }

            // 如果导入的任务有状态变化，更新状态
            if (task.status && task.status !== result.data.status) {
              updateData.status = task.status
            }

            // 更新任务（如果有状态变化或摘要变化）
            if (updateData.status || updateData.summary) {
              await updateTask(updateData)
            }

            // 将 AI 解决方案作为评论导入
            const commentResponse = await fetch('/api/task/import-as-comment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                taskId: task._id!,
                content: (task as any).aiSolution || task.content || '',
                summary: task.summary || '',
                type: 'ai_completion',
                mentionedUsers: []
              })
            })

            if (!commentResponse.ok) {
              throw new Error(`Import as comment failed: ${commentResponse.statusText}`)
            }

            return { type: 'updated' as const, taskId: task._id }
          }
        } catch (error: any) {
          // 任务不存在（404错误），创建新任务
          if (error?.response?.status === 404 || error?.message?.includes('not found')) {
            console.log(`Task ${task._id} not found, creating new task`)
            // 创建新任务的逻辑
            return { type: 'created' as const, result: task._id }
          }
          // 其他错误，继续抛出
          throw error
        }
      } else {
        // 没有 _id，直接创建新任务
        // 创建新任务的逻辑
        return { type: 'created' as const, result: task._id }
      }
    })

    const results = await Promise.all(promises)

    // 统计操作数量
    const createdCount = results.filter((r: any) => r.type === 'created').length
    const updatedCount = results.filter((r: any) => r.type === 'updated').length

    // 显示结果消息
    const messages: string[] = []
    if (createdCount > 0) messages.push(`创建 ${createdCount} 个`)
    if (updatedCount > 0) messages.push(`更新 ${updatedCount} 个`)
    ElMessage.success(`成功${messages.join('、')}任务`)

    // 关闭对话框
    importConfirmVisible.value = false
    tasksToImport.value = []

    // 刷新任务列表
    await loadTasks()
  } catch (error: any) {
    console.error('Import from markdown error:', error)
    ElMessage.error(`导入失败：${error?.message || '未知错误'}`)
  } finally {
    importing.value = false
  }
}

const route = useRoute()

// 监听路由query中的taskId和项目变化
watch([() => route.query.taskId, () => props.project], async ([taskId, project]) => {
  // 只有当taskId存在且项目ID匹配时才处理
  if (taskId && typeof taskId === 'string' && projectId.value && project) {
    // 如果任务列表为空或任务不存在，先加载任务
    if (tasks.value.length === 0 || !tasks.value.find(t => t._id === taskId)) {
      await loadTasks()
    }
    
    // 等待任务加载完成
    await nextTick()
    const task = tasks.value.find(t => t._id === taskId)
    
    if (task) {
      // 如果drawer未打开或打开的不是当前任务，则打开
      if (!showTaskDetail.value || selectedTaskId.value !== taskId) {
        // 使用nextTick和setTimeout确保路由切换和组件渲染完成
        await nextTick()
        setTimeout(() => {
          handleTaskClick(task)
        }, 150)
      }
    }
  } else if (!taskId && showTaskDetail.value) {
    // 当taskId被清除时，关闭drawer
    showTaskDetail.value = false
    selectedTaskId.value = undefined
    selectedTaskProjectId.value = undefined
  }
}, { immediate: true })

// 快捷键注册
onMounted(() => {
  // 注册 N 键新建任务
  registerShortcut({
    key: 'n',
    description: '新建任务',
    handler: () => {
      if (!showTaskDetail.value) {
        handleCreateTask()
      }
    },
    category: '看板'
  })

  // 注册 Cmd+I 导入任务
  registerShortcut({
    key: 'i',
    meta: true,
    description: '导入任务',
    handler: () => {
      if (!showTaskDetail.value && projectId.value) {
        handleImportTasks()
      }
    },
    category: '看板'
  })

  // 注册 Cmd+E 批量导出
  registerShortcut({
    key: 'e',
    meta: true,
    description: '批量导出',
    handler: () => {
      if (!showTaskDetail.value && selectedTaskIds.value.size > 0) {
        handleBatchExport()
      }
    },
    category: '看板'
  })

  // 注册 F1 键切换专注模式
  registerShortcut({
    key: 'F1',
    description: '专注模式',
    handler: toggleFocusMode,
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

/* 专注模式样式 */
.focus-mode {
  filter: blur(5px); /* 模糊背景 */
  -webkit-filter: blur(5px);
  -moz-filter: blur(5px);
  -o-filter: blur(5px);
  -ms-filter: blur(5px);
  pointer-events: none; /* 阻止点击事件穿透 */
}

.no-focus-mode {
  filter: none;
  -webkit-filter: none;
  -moz-filter: none;
  -o-filter: none;
  -ms-filter: none;
  pointer-events: auto; /* 恢复点击事件 */
}
</style>
