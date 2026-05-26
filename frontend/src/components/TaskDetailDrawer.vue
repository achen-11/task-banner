<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 pointer-events-none"
    >
      <!-- 抽屉容器 - 右侧滑出 -->
      <div
        :style="{ width: drawerWidth + 'px' }"
        class="absolute top-0 right-0 h-full bg-white dark:bg-gray-800 shadow-2xl pointer-events-auto flex transition-transform duration-300 ease-out"
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
          <div class="border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 py-3 flex-shrink-0">
            <div class="flex items-center gap-3 flex-1 min-w-0">
              <!-- 任务导航（仅查看模式） -->
              <div v-if="mode !== 'create'" class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">
                <button
                  class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  @click="goToPrevTask"
                  title="上一个任务 (↑)"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
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
              <div v-if="currentTask && mode !== 'create'" class="text-sm font-mono text-gray-500 dark:text-gray-400 flex-shrink-0">
                #{{ currentTask.displayId }}
              </div>

              <!-- 创建模式标识 -->
              <div v-if="mode === 'create'" class="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0 flex items-center gap-2">
                <span class="px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded text-xs font-medium">新建任务</span>
                <span v-if="!isSaved" class="text-xs text-orange-500 dark:text-orange-400">● 未保存</span>
                <span v-else class="text-xs text-green-500 dark:text-green-400">● 已保存</span>
              </div>

              <!-- 任务标题 -->
              <div class="flex-1 min-w-0 px-3">
                <input
                  v-if="currentTask"
                  ref="titleInputRef"
                  :value="currentTask.title"
                  type="text"
                  class="w-full text-base font-semibold text-gray-900 dark:text-gray-100 border-0 border-b-2 border-transparent hover:border-gray-200 dark:hover:border-gray-600 px-0 py-1 transition-colors bg-transparent focus:outline-none focus:border-blue-500 dark:focus:border-blue-400"
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
                  class="px-3 py-1.5 text-sm transition-colors flex items-center gap-1"
                  :class="isCommentSelectionMode
                    ? 'bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'"
                  :title="isCommentSelectionMode ? '导出选中的评论 (Cmd+E)' : '导出任务 (Cmd+E)'"
                  @click="isCommentSelectionMode ? exportSelectedCommentsToClipboard() : toggleCommentSelectionMode()"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  {{ isCommentSelectionMode ? `导出 (${selectedCommentIds.length})` : '导出' }}
                </button>

                <!-- 取消选择按钮（仅在选择模式下显示） -->
                <button
                  v-if="isCommentSelectionMode"
                  class="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors flex items-center gap-1"
                  title="取消选择 (Esc)"
                  @click="toggleCommentSelectionMode"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  取消
                </button>

                
                <!-- 删除按钮 -->
                <button
                  class="px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors flex items-center gap-1"
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
                class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors text-gray-500 dark:text-gray-400"
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
                  <TaskBasicInfo ref="taskBasicInfoRef" :task="currentTask" :mode="mode" :project-id="projectId" @update="handleTaskUpdate" />
                </div>
              </div>

              <!-- 右列：评论列表（内部滚动） -->
              <div class="h-full pl-3 -ml-3 overflow-hidden">
                <div class="h-full pl-3">
                  <TaskActivity
                    v-if="currentTask && mode === 'view'"
                    ref="taskActivityRef"
                    :task="currentTask"
                    :comment-selection-mode="isCommentSelectionMode"
                    :selected-comment-ids="selectedCommentIds"
                    @comment-selection-change="handleCommentSelectionChange"
                  />
                  <div v-else-if="mode === 'create'" class="h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                    <div class="text-center">
                      <svg class="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <p>创建任务后将显示活动历史</p>
                    </div>
                  </div>
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
import { createTask as createTaskAPI, updateTask as updateTaskAPI, deleteTask as deleteTaskAPI, addTaskComment } from '@/api/task'
import { exportTaskToMarkdown, copyToClipboard, importTasksFromMarkdown, importTasksFromJSON, readFromClipboard, formatDate, ImportService } from '@/utils/export'
import {
  getStatusBadgeClass,
  getStatusText,
  getPriorityBadgeClass,
  getPriorityText
} from '@/utils/taskStatus'
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
  (e: 'import-tasks'): void
}>()

// 标题输入框引用
const titleInputRef = ref<HTMLInputElement>()
const taskActivityRef = ref<InstanceType<typeof TaskActivity>>()
const taskBasicInfoRef = ref<InstanceType<typeof TaskBasicInfo>>()


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

// 评论选择模式相关
const isCommentSelectionMode = ref(false)
const selectedCommentIds = ref<string[]>([])

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

// 处理评论选择变化
const handleCommentSelectionChange = (selectedIds: string[]) => {
  selectedCommentIds.value = selectedIds
}

// 切换评论选择模式
const toggleCommentSelectionMode = () => {
  isCommentSelectionMode.value = !isCommentSelectionMode.value
  if (!isCommentSelectionMode.value) {
    selectedCommentIds.value = []
  }
}

// 导出选中评论到剪切板
const exportSelectedCommentsToClipboard = async () => {
  if (!currentTask.value) return

  try {
    // 获取选中的评论数据
    const selectedComments = taskActivityRef.value?.getSelectedComments() || []

    if (selectedComments.length === 0) {
      ElMessage.warning('没有选中的评论，将导出任务信息')
      await exportTaskToClipboard()
      return
    }

    // 生成导出内容
    const exportContent = generateExportContent(currentTask.value, selectedComments)

    // 复制到剪切板
    await navigator.clipboard.writeText(exportContent)

    ElMessage.success(`已导出任务信息和 ${selectedComments.length} 条评论到剪切板`)

    // 退出选择模式
    isCommentSelectionMode.value = false
    selectedCommentIds.value = []
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败，请重试')
  }
}

// 生成导出内容
const generateExportContent = (task: Task | TaskDetail, comments: any[]) => {
  // 使用标准的 exportTaskToMarkdown 函数获取基础内容（包含AI指引）
  const baseMarkdown = exportTaskToMarkdown(task, undefined, { includeComments: false })

  // 如果有选中的评论，添加自定义评论部分
  if (comments && comments.length > 0) {
    const lines = baseMarkdown.split('\n')

    // 在AI解决方案部分之前插入评论部分
    const aiSolutionIndex = lines.findIndex(line => line.includes('## 🛠️ AI 解决方案'))

    if (aiSolutionIndex !== -1) {
      // 在AI解决方案之前插入评论
      const commentLines = [
        '',
        '---',
        '',
        '## 📝 选中评论',
        '',
        `> 共 ${comments.length} 条评论`,
        ''
      ]

      // 添加每条评论
      comments.forEach((comment, index) => {
        commentLines.push(`### 评论 ${index + 1}`)
        commentLines.push('')

        if (comment.user) {
          const userName = getUserDisplayName(comment.user)
          commentLines.push(`**作者:** ${userName}`)
        }

        commentLines.push(`**时间:** ${formatDate(comment.timestamp)}`)

        if (comment.summary) {
          commentLines.push(`**摘要:** ${comment.summary}`)
        }

        commentLines.push('')
        commentLines.push('**内容:**')
        commentLines.push('')
        commentLines.push(comment.content)
        commentLines.push('')
        commentLines.push('---')
        commentLines.push('')
      })

      // 将评论插入到AI解决方案之前
      lines.splice(aiSolutionIndex, 0, ...commentLines)

      return lines.join('\n')
    }
  }

  return baseMarkdown
}


// 导出任务信息到剪切板（不包含评论）
const exportTaskToClipboard = async () => {
  if (!currentTask.value) return

  const content = generateExportContent(currentTask.value, [])
  await navigator.clipboard.writeText(content)
}

// 获取用户显示名称
const getUserDisplayName = (user: any): string => {
  if (!user) return '未知用户'
  return user.displayName || user.username || user.email || user._id || '未知用户'
}

// 导出当前任务（复制 Markdown 到剪贴板）
const handleExportTask = async () => {
  if (!currentTask.value || !currentTask.value.title) {
    ElMessage.warning('没有可导出的任务')
    return
  }

  try {
    // 检查是否有评论
    const hasComments = true // TODO: 从评论组件获取评论数据

    if (hasComments) {
      // 显示导出选项对话框
      const result = await ElMessageBox.confirm(
        '是否包含评论历史？包含评论可以导出完整的 AI 完成记录和用户反馈。',
        '导出选项',
        {
          confirmButtonText: '包含评论',
          cancelButtonText: '仅任务信息',
          type: 'warning',
          distinguishCancelAndClose: true,
          beforeClose: (action, instance, done) => {
            if (action === 'confirm') {
              done()
            } else {
              done()
            }
          }
        }
      ).catch(() => {
        return { includeComments: false }
      })

      const includeComments = (result as any) !== 'cancel' && (result as any) !== 'close'
      const comments = includeComments ? await fetchComments() : []

      // 导出 Markdown 并复制到剪贴板
      const markdown = exportTaskToMarkdown(currentTask.value, undefined, { includeComments, comments })
      const success = await copyToClipboard(markdown)

      if (success) {
        ElMessage.success(`任务已导出到剪贴板${includeComments ? '（包含评论）' : ''}`)
      } else {
        ElMessage.error('复制失败，请重试')
      }
    } else {
      // 没有评论，直接导出
      const markdown = exportTaskToMarkdown(currentTask.value)
      const success = await copyToClipboard(markdown)

      if (success) {
        ElMessage.success('任务已导出到剪贴板')
      } else {
        ElMessage.error('复制失败，请重试')
      }
    }
  } catch (error) {
    console.error('Export task error:', error)
    ElMessage.error('导出任务失败')
  }
}

// 获取任务评论
const fetchComments = async () => {
  try {
    const response = await fetch(`/api/task/comments?taskId=${currentTask.value?._id}&size=100`)
    const data = await response.json()
    return data.code === 200 ? data.data.items : []
  } catch (error) {
    console.error('Failed to fetch comments:', error)
    return []
  }
}

// 导入任务（优先从剪贴板读取 JSON，失败则尝试 Markdown）
const handleImportTask = async () => {
  if (!props.projectId) {
    ElMessage.warning('缺少项目ID，无法导入任务')
    return
  }

  try {
    const clipboardContent = await readFromClipboard()

    if (!clipboardContent) {
      // 如果无法读取剪贴板，提示用户手动粘贴
      const input = prompt('请粘贴 JSON 或 Markdown 格式的任务内容：')
      if (!input) return

      await importTask(input)
    } else {
      await importTask(clipboardContent)
    }
  } catch (error) {
    console.error('Import task error:', error)
    ElMessage.error('导入任务失败')
  }
}

// 自动识别并导入任务（使用统一的ImportService）
const importTask = async (content: string) => {
  try {
    const { tasks, format } = ImportService.autoImport(content, props.projectId!)
    ImportService.validateTasks(tasks)
    await processImportedTasks(tasks)
    ElMessage.success(ImportService.getSuccessMessage(format, tasks.length))
  } catch (error) {
    console.error('Import failed:', error)
    ElMessage.error(error instanceof Error ? error.message : '导入失败')
  }
}

// 处理导入的任务（创建或更新）
const processImportedTasks = async (tasks: Array<Partial<Task>>) => {
  // 验证逻辑已在ImportService中处理

  try {
    let createdCount = 0
    let updatedCount = 0

    // 处理每个任务（创建或更新）
    const promises = tasks.map(async task => {
      // 检查任务是否已经存在（通过 _id）
      const existingTask = task._id && props.allTasks?.find(t => t._id === task._id)

      if (existingTask) {
        // 更新已存在的任务
        updatedCount++

        // 在任务详情抽屉中，如果导入的是当前打开的任务，则将内容作为评论添加
        if (currentTask.value && currentTask.value._id === task._id && task.content) {
          // 添加评论而不是更新描述
          await addTaskComment(currentTask.value._id, `导入内容：\n\n${task.content}`)
        }

        return updateTaskAPI({
          id: task._id!,
          title: task.title || existingTask.title,
          content: task.content !== undefined && (!currentTask.value || currentTask.value._id !== task._id) ? task.content : existingTask.content,
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
    // 如果在选择模式下，退出选择模式而不是关闭抽屉
    if (isCommentSelectionMode.value) {
      e.preventDefault()
      isCommentSelectionMode.value = false
      selectedCommentIds.value = []
      return
    }

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
    // cmd+e 或 ctrl+e 导出任务或选中评论
    e.preventDefault()
    if (isCommentSelectionMode.value) {
      exportSelectedCommentsToClipboard()
    } else {
      toggleCommentSelectionMode()
    }
  } else if ((e.metaKey || e.ctrlKey) && e.key === 'i') {
    // cmd+i 或 ctrl+i 导入任务 - 委托给父组件处理
    e.preventDefault()
    emit('import-tasks')
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

    // 强制失焦当前聚焦的元素，确保所有输入都已提交（修复 cmd+s 时内容缺失的问题）
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
      await nextTick()
    }

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

      // 关联待处理的附件
      if (taskBasicInfoRef.value && 'associatePendingAttachments' in taskBasicInfoRef.value) {
        await taskBasicInfoRef.value.associatePendingAttachments(task._id)
      }

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

// WebSocket 消息处理 - 评论相关
const handleWebSocketCommentCreated = (event: CustomEvent) => {
  const { data, message } = event.detail
  // 只处理当前任务的评论
  if (message.taskId === props.taskId && taskActivityRef.value) {
    // 重新加载活动历史
    taskActivityRef.value.loadActivities()
  }
}

const handleWebSocketCommentUpdated = (event: CustomEvent) => {
  const { data, message } = event.detail
  // 只处理当前任务的评论
  if (message.taskId === props.taskId && taskActivityRef.value) {
    // 重新加载活动历史
    taskActivityRef.value.loadActivities()
  }
}

const handleWebSocketCommentDeleted = (event: CustomEvent) => {
  const { data, message } = event.detail
  // 只处理当前任务的评论
  if (message.taskId === props.taskId && taskActivityRef.value) {
    // 重新加载活动历史
    taskActivityRef.value.loadActivities()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  
  // 监听 WebSocket 评论消息
  window.addEventListener('websocket:comment-created', handleWebSocketCommentCreated as EventListener)
  window.addEventListener('websocket:comment-updated', handleWebSocketCommentUpdated as EventListener)
  window.addEventListener('websocket:comment-deleted', handleWebSocketCommentDeleted as EventListener)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  
  // 移除 WebSocket 消息监听
  window.removeEventListener('websocket:comment-created', handleWebSocketCommentCreated as EventListener)
  window.removeEventListener('websocket:comment-updated', handleWebSocketCommentUpdated as EventListener)
  window.removeEventListener('websocket:comment-deleted', handleWebSocketCommentDeleted as EventListener)
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
