<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 pointer-events-none"
    >
      <!-- 抽屉容器 - 右侧滑出 -->
      <div
        :style="{ width: drawerWidth + 'px' }"
        class="absolute top-0 right-0 h-full bg-white shadow-2xl pointer-events-auto flex transition-transform duration-300 ease-out"
        :class="{ 'translate-x-full': !isOpen }"
      >
        <!-- 左侧拖拽调整手柄 -->
        <div
          class="w-1 cursor-ew-resize hover:bg-blue-500 active:bg-blue-600 transition-colors flex-shrink-0 group relative"
          @mousedown="startResize"
        >
          <div class="absolute inset-y-0 -left-1 -right-1"></div>
          <!-- 可视化拖拽指示器 -->
          <div class="absolute top-1/2 -translate-y-1/2 left-0 w-1 h-12 bg-gray-300 group-hover:bg-blue-500 rounded-r transition-colors"></div>
        </div>

        <!-- 抽屉内容区域 -->
        <div class="flex-1 flex flex-col overflow-hidden">
          <!-- 顶部工具栏 -->
          <div class="border-b border-gray-200 flex items-center justify-between px-6 py-3 flex-shrink-0">
            <div class="flex items-center gap-3 flex-1 min-w-0">
              <!-- 任务导航（仅查看模式） -->
              <div v-if="mode !== 'create'" class="flex items-center gap-2 text-sm text-gray-500 flex-shrink-0">
                <button
                  class="p-1.5 hover:bg-gray-100 rounded transition-colors"
                  @click="goToPrevTask"
                  title="上一个任务 (↑)"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  class="p-1.5 hover:bg-gray-100 rounded transition-colors"
                  @click="goToNextTask"
                  title="下一个任务 (↓)"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <span class="text-xs">{{ currentTaskIndex + 1 }} / {{ totalTasks }}</span>
              </div>

              <!-- 任务 ID（仅查看模式） -->
              <div v-if="currentTask && mode !== 'create'" class="text-sm font-mono text-gray-500 flex-shrink-0">
                #{{ currentTask.displayId }}
              </div>

              <!-- 创建模式标识 -->
              <div v-if="mode === 'create'" class="text-sm text-gray-500 flex-shrink-0 flex items-center gap-2">
                <span class="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">新建任务</span>
                <span v-if="!isSaved" class="text-xs text-orange-500">● 未保存</span>
                <span v-else class="text-xs text-green-500">● 已保存</span>
              </div>

              <!-- 任务标题 -->
              <div class="flex-1 min-w-0 px-3">
                <input
                  v-if="currentTask"
                  ref="titleInputRef"
                  :value="currentTask.title"
                  type="text"
                  class="w-full text-base font-semibold text-gray-900 border-0 border-b-2 border-transparent hover:border-gray-200 px-0 py-1 transition-colors bg-transparent focus:outline-none focus:border-blue-500"
                  placeholder="任务标题..."
                  @input="handleTitleInput"
                  @compositionstart="handleTitleCompositionStart"
                  @compositionend="handleTitleCompositionEnd"
                  @blur="mode === 'view' ? handleTaskUpdate({ title: ($event.target as HTMLInputElement).value }) : null"
                />
              </div>
            </div>

            <!-- 右侧按钮组 -->
            <div class="flex items-center gap-2 flex-shrink-0">
              <!-- 创建模式：保存按钮 -->
              <button
                v-if="mode === 'create'"
                class="px-4 py-1.5 text-sm text-white rounded transition-colors flex items-center gap-1"
                :class="isSaving ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'"
                :disabled="isSaving"
                title="保存任务 (Cmd+S)"
                @click="() => handleSaveTask(false)"
              >
                <svg v-if="isSaving" class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                {{ isSaving ? '保存中...' : '保存' }}
              </button>

              <!-- 查看模式：操作按钮组 -->
              <template v-if="mode === 'view'">
                <!-- 导出按钮 -->
                <button
                  class="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors flex items-center gap-1"
                  title="导出任务 (Cmd+E)"
                  @click="handleExportTask"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  导出
                </button>

                <!-- 导入按钮 -->
                <button
                  class="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors flex items-center gap-1"
                  title="导入任务 (Cmd+I)"
                  @click="handleImportTask"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 17l4-4m0 0l4 4m-4-4v12M4 4h16a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z" />
                  </svg>
                  导入
                </button>

                <!-- 删除按钮 -->
                <button
                  class="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded transition-colors flex items-center gap-1"
                  title="删除任务"
                  @click="handleTaskDelete"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  删除
                </button>
              </template>

              <!-- 关闭按钮 -->
              <button
                class="p-2 hover:bg-gray-100 rounded transition-colors text-gray-500"
                @click="closeDrawer"
                title="关闭 (Esc)"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <!-- 两列布局内容区域（独立滚动） -->
          <div class="flex-1 overflow-hidden">
            <div
              class="h-full grid gap-6 px-6 pt-6 pb-4"
              :class="isWideLayout ? 'grid-cols-2' : 'grid-cols-1'"
            >
              <!-- 左列：基础信息（独立滚动） -->
              <div class="overflow-y-auto pr-3 -mr-3">
                <div class="pr-3">
                  <TaskBasicInfo :task="currentTask" @update="handleTaskUpdate" />
                </div>
              </div>

              <!-- 右列：活动历史（内部滚动） -->
              <div class="h-full pl-3 -ml-3 overflow-hidden">
                <div class="h-full pl-3">
                  <TaskActivity :task="currentTask" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import TaskBasicInfo from './task/TaskBasicInfo.vue'
import TaskActivity from './task/TaskActivity.vue'
import { createTask as createTaskAPI, updateTask as updateTaskAPI, deleteTask as deleteTaskAPI } from '@/api/task'
import { exportTaskToMarkdown, copyToClipboard, importTasksFromMarkdown, readFromClipboard } from '@/utils/export'
import type { Task, TaskDetail } from '@/types/task'

interface Attachment {
  _id: string
  relatedType: 'task' | 'comment'
  relatedId: string
  name: string
  originalName: string
  size: number
  mimeType: string
  url: string
  thumbnailUrl?: string
  uploaderId: string
  projectId: string
  createdAt: number
  updatedAt: number
}

interface Props {
  isOpen: boolean
  mode?: 'view' | 'create'
  taskId?: string
  projectId?: string
  allTasks?: Task[]
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'view'
})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'update:taskId', taskId: string): void
  (e: 'task-created', task: Task | TaskDetail): void
  (e: 'task-updated', task: Task | TaskDetail): void
  (e: 'task-deleted', taskId: string): void
}>()

// 标题输入框引用
const titleInputRef = ref<HTMLInputElement>()

// 创建模式下的新任务数据
const newTaskData = ref<Partial<Task>>({
  title: '',
  status: 'todo',
  priority: 'medium',
  content: ''
})

// 保存状态
const isSaved = ref(true)
const isSaving = ref(false)

// 中文输入法标志（防止输入混乱）
const isComposing = ref(false)

// 抽屉宽度管理
const drawerWidth = ref(1000) // 默认宽度 1000px
const minWidth = 600
const maxWidth = 1600
const isResizing = ref(false)

// 响应式布局
const isWideLayout = computed(() => drawerWidth.value >= 900)

// 当前任务索引
const currentTaskIndex = computed(() => {
  if (!props.taskId || !props.allTasks) return 0
  return props.allTasks.findIndex(t => t._id === props.taskId)
})

const totalTasks = computed(() => props.allTasks?.length || 0)

const currentTask = computed(() => {
  // 创建模式下返回新任务数据
  if (props.mode === 'create') {
    return newTaskData.value as Task
  }

  // 查看模式下返回现有任务
  if (!props.taskId || !props.allTasks) return null
  return props.allTasks.find(t => t._id === props.taskId) || null
})

// 拖拽调整宽度
const startResize = (e: MouseEvent) => {
  isResizing.value = true
  const startX = e.clientX
  const startWidth = drawerWidth.value

  const handleMouseMove = (moveEvent: MouseEvent) => {
    const deltaX = startX - moveEvent.clientX // 注意：向左拖是增加宽度
    const newWidth = Math.min(maxWidth, Math.max(minWidth, startWidth + deltaX))
    drawerWidth.value = newWidth
  }

  const handleMouseUp = () => {
    isResizing.value = false
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }

  document.body.style.cursor = 'ew-resize'
  document.body.style.userSelect = 'none'
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

// 任务导航
const goToPrevTask = () => {
  if (currentTaskIndex.value > 0 && props.allTasks && props.allTasks.length > 0) {
    const prevTask = props.allTasks[currentTaskIndex.value - 1]
    if (prevTask) {
      emit('update:taskId', prevTask._id)
    }
  }
}

const goToNextTask = () => {
  if (currentTaskIndex.value < totalTasks.value - 1 && props.allTasks && props.allTasks.length > 0) {
    const nextTask = props.allTasks[currentTaskIndex.value + 1]
    if (nextTask) {
      emit('update:taskId', nextTask._id)
    }
  }
}

const closeDrawer = () => {
  emit('close')
}

// 导出当前任务
const handleExportTask = async () => {
  if (!currentTask.value || !currentTask.value.title) {
    ElMessage.warning('没有可导出的任务')
    return
  }

  try {
    const markdown = exportTaskToMarkdown(currentTask.value)
    const success = await copyToClipboard(markdown)

    if (success) {
      ElMessage.success('任务已复制到剪贴板')
    } else {
      ElMessage.error('复制失败，请重试')
    }
  } catch (error) {
    console.error('Export task error:', error)
    ElMessage.error('导出任务失败')
  }
}

// 导入任务
const handleImportTask = async () => {
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

      await importTaskFromMarkdown(input)
    } else {
      await importTaskFromMarkdown(markdown)
    }
  } catch (error) {
    console.error('Import task error:', error)
    ElMessage.error('导入任务失败')
  }
}

// 从 Markdown 导入任务
const importTaskFromMarkdown = async (markdown: string) => {
  try {
    const tasks = importTasksFromMarkdown(markdown, props.projectId!)

    if (tasks.length === 0) {
      ElMessage.warning('未能解析出任务，请检查 Markdown 格式')
      return
    }

    let createdCount = 0
    let updatedCount = 0

    // 处理每个任务（创建或更新）
    const promises = tasks.map(async task => {
      // 检查任务是否已经存在（通过 _id）
      const existingTask = task._id && props.allTasks?.find(t => t._id === task._id)

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
    if (tasks.length === 1) {
      if (updatedCount > 0) {
        ElMessage.success('成功更新 1 个任务')
        // 切换到更新的任务
        const task = processedTasks[0]
        if (task) {
          emit('task-updated', task as Task)
        }
      } else {
        ElMessage.success('成功创建 1 个任务')
        // 切换到新创建的任务
        const task = processedTasks[0]
        if (task) {
          emit('task-created', task as Task)
        }
      }
    } else {
      const messages: string[] = []
      if (createdCount > 0) messages.push(`创建 ${createdCount} 个`)
      if (updatedCount > 0) messages.push(`更新 ${updatedCount} 个`)
      ElMessage.success(`成功${messages.join('、')}任务`)

      // 刷新任务列表
      closeDrawer()
    }
  } catch (error: any) {
    console.error('Import from markdown error:', error)
    ElMessage.error(`导入失败：${error?.message || '未知错误'}`)
  }
}

// 键盘快捷键
const handleKeydown = (e: KeyboardEvent) => {
  if (!props.isOpen) return

  if (e.key === 'Escape') {
    // 如果有未保存的更改，提示用户
    if (!isSaved.value && props.mode === 'create') {
      e.preventDefault()
      ElMessageBox.confirm(
        '有未保存的更改，确定要关闭吗？',
        '提示',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        closeDrawer()
      }).catch(() => {
        // 用户取消，不做任何操作
      })
      return
    }
    closeDrawer()
  } else if (e.key === 'ArrowUp' && props.mode !== 'create') {
    // 检查是否在输入框中，避免误触
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      return
    }
    e.preventDefault()
    goToPrevTask()
  } else if (e.key === 'ArrowDown' && props.mode !== 'create') {
    // 检查是否在输入框中，避免误触
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      return
    }
    e.preventDefault()
    goToNextTask()
  } else if ((e.metaKey || e.ctrlKey) && e.key === 's') {
    // cmd+s 或 ctrl+s 保存
    // cmd+shift+s 保存并继续新建
    e.preventDefault()
    const continueCreate = e.shiftKey
    handleSaveTask(continueCreate)
  } else if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
    // cmd+e 或 ctrl+e 导出任务
    e.preventDefault()
    handleExportTask()
  } else if ((e.metaKey || e.ctrlKey) && e.key === 'i') {
    // cmd+i 或 ctrl+i 导入任务
    e.preventDefault()
    handleImportTask()
  }
}

// 标题输入处理（防止中文输入法混乱）
const handleTitleInput = (e: Event) => {
  // 如果正在使用中文输入法，不立即更新
  if (isComposing.value) return

  const value = (e.target as HTMLInputElement).value
  handleTaskUpdate({ title: value })
}

const handleTitleCompositionStart = () => {
  isComposing.value = true
}

const handleTitleCompositionEnd = (e: Event) => {
  isComposing.value = false
  const value = (e.target as HTMLInputElement).value
  handleTaskUpdate({ title: value })
}

// 任务更新处理
const handleTaskUpdate = async (updates: Partial<Task>) => {
  if (!currentTask.value) return

  // 创建模式下，只更新本地数据，标记为未保存
  if (props.mode === 'create') {
    Object.assign(newTaskData.value, updates)
    isSaved.value = false
    return
  }

  // 查看模式下，直接调用 API 更新
  try {
    const updatedTask = await updateTaskAPI({
      id: currentTask.value._id,
      ...updates
    })

    // 通知父组件任务已更新
    emit('task-updated', updatedTask)
  } catch (err: any) {
    console.error('Failed to update task:', err)
    ElMessage.error(err?.message || '更新任务失败')
  }
}

// 保存任务（创建或更新）
const handleSaveTask = async (continueCreate = false) => {
  if (isSaving.value) return

  // 强制失焦当前聚焦的元素，确保所有输入都已提交（修复 cmd+s 时内容缺失的问题）
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur()
    // 等待失焦事件处理完成
    await nextTick()
  }

  // 创建模式下
  if (props.mode === 'create') {
    if (!newTaskData.value.title || newTaskData.value.title.trim() === '') {
      ElMessage.warning('请输入任务标题')
      titleInputRef.value?.focus()
      return
    }

    if (!props.projectId) {
      ElMessage.error('缺少项目ID')
      return
    }

    isSaving.value = true

    try {
      const task = await createTaskAPI({
        projectId: props.projectId,
        title: newTaskData.value.title.trim(),
        status: newTaskData.value.status || 'todo',
        priority: newTaskData.value.priority || 'medium',
        content: newTaskData.value.content || '',
        assigneeId: newTaskData.value.assigneeId,
        moduleIds: newTaskData.value.moduleIds,
        tagIds: newTaskData.value.tagIds,
        dueDate: newTaskData.value.dueDate
      })

      isSaved.value = true

      if (continueCreate) {
        // cmd+shift+s：保存并继续新建
        ElMessage.success('任务创建成功，可继续新建')

        // 重置表单
        newTaskData.value = {
          title: '',
          status: 'todo',
          priority: 'medium',
          content: ''
        }
        isSaved.value = false

        // 聚焦标题输入框
        await nextTick()
        titleInputRef.value?.focus()

        // 通知父组件任务已创建（但不切换模式）
        emit('task-updated', task)
      } else {
        // cmd+s：保存并切换到查看模式
        ElMessage.success('任务创建成功')

        // 通知父组件任务已创建并切换到查看模式
        emit('task-created', task)
      }
    } catch (err: any) {
      console.error('Failed to create task:', err)
      ElMessage.error(err?.message || '创建任务失败')
    } finally {
      isSaving.value = false
    }
  }
  // 查看模式下不需要手动保存，已经自动保存
}

// 删除任务处理
const handleTaskDelete = async () => {
  if (!currentTask.value) return

  try {
    await ElMessageBox.confirm(
      `确定要删除任务 #${currentTask.value.displayId} - ${currentTask.value.title} 吗？`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    emit('task-deleted', currentTask.value._id)
  } catch (err: any) {
    // 用户取消删除，不做任何操作
    if (err === 'cancel') return

    console.error('Failed to delete task:', err)
    ElMessage.error(err?.message || '删除任务失败')
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

// 监听抽屉打开状态
watch(() => props.isOpen, async (newValue, oldValue) => {
  if (newValue && !oldValue) {
    // 抽屉打开时
    if (props.mode === 'create') {
      // 创建模式：重置新任务数据
      newTaskData.value = {
        title: '',
        status: 'todo',
        priority: 'medium',
        content: ''
      }
      isSaved.value = false

      // 等待 DOM 更新后聚焦标题输入框
      await nextTick()
      titleInputRef.value?.focus()
    }
  }
})

// 监听模式变化
watch(() => props.mode, async (newMode) => {
  if (newMode === 'create' && props.isOpen) {
    // 切换到创建模式时聚焦标题
    await nextTick()
    titleInputRef.value?.focus()
  }
})
</script>
