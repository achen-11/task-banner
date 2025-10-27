<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-100">
    <!-- 顶部工具栏 - 移除了标题 -->
    <div class="p-3 border-b border-gray-100 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <div class="text-sm text-gray-500">
          <span v-if="isLoading">加载中...</span>
          <span v-else-if="error" class="text-red-500">{{ error }}</span>
          <span v-else>
            {{ tasks.length }} / {{ total }} 个任务
            <span v-if="hasMore" class="text-gray-400 ml-1">(向下滚动加载更多)</span>
          </span>
        </div>
        <div v-if="selectedTaskIds.size > 0" class="flex items-center gap-2">
          <span class="text-sm text-blue-600 font-medium">已选择 {{ selectedTaskIds.size }} 个</span>
          <button class="px-3 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors"
            @click="handleBatchExport" title="导出选中任务 (Cmd+E)">
            <svg class="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            批量导出
          </button>
          <button class="px-3 py-1 text-xs text-gray-600 hover:bg-gray-50 rounded transition-colors"
            @click="clearSelection">
            取消选择
          </button>
        </div>
      </div>
      <el-tooltip content="快捷键：N" placement="bottom">
        <button class="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          @click="handleCreateTask">
          <svg class="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          新建任务
        </button>
      </el-tooltip>
    </div>

    <div v-if="isLoading" class="p-8 text-center text-gray-400">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p>加载任务中...</p>
    </div>

    <div v-else-if="error" class="p-8 text-center text-red-500">
      <svg class="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p>{{ error }}</p>
      <button class="mt-4 px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700" @click="loadTasks()">
        重试
      </button>
    </div>

    <div v-else-if="tasks.length === 0" class="p-8 text-center text-gray-400">
      <svg class="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
      <p>暂无任务</p>
    </div>

    <!-- 任务表格 -->
    <div v-else>
      <!-- 表头 -->
      <div
        class="grid grid-cols-[40px_80px_1fr_120px_100px_120px_80px] gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wider">
        <div class="flex items-center justify-center">
          <input type="checkbox"
            class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
            :checked="isAllSelected" :indeterminate="isSomeSelected" @change="toggleSelectAll" />
        </div>
        <div class="flex items-center gap-1 cursor-pointer hover:text-gray-700 transition-colors"
          @click="toggleSort('displayId')">
          <span>ID</span>
          <svg v-if="sortField === 'displayId'" class="w-3 h-3" :class="{ 'rotate-180': sortDirection === 'desc' }"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
          </svg>
        </div>
        <div class="flex items-center gap-1 cursor-pointer hover:text-gray-700 transition-colors"
          @click="toggleSort('title')">
          <span>标题</span>
          <svg v-if="sortField === 'title'" class="w-3 h-3" :class="{ 'rotate-180': sortDirection === 'desc' }"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
          </svg>
        </div>
        <div class="flex items-center gap-1 cursor-pointer hover:text-gray-700 transition-colors"
          @click="toggleSort('assigneeId')">
          <span>指派人</span>
          <svg v-if="sortField === 'assigneeId'" class="w-3 h-3" :class="{ 'rotate-180': sortDirection === 'desc' }"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
          </svg>
        </div>
        <div class="flex items-center gap-1 cursor-pointer hover:text-gray-700 transition-colors"
          @click="toggleSort('priority')">
          <span>优先级</span>
          <svg v-if="sortField === 'priority'" class="w-3 h-3" :class="{ 'rotate-180': sortDirection === 'desc' }"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
          </svg>
        </div>
        <div class="flex items-center gap-1 cursor-pointer hover:text-gray-700 transition-colors"
          @click="toggleSort('updatedAt')">
          <span>最后更新</span>
          <svg v-if="sortField === 'updatedAt'" class="w-3 h-3" :class="{ 'rotate-180': sortDirection === 'desc' }"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
          </svg>
        </div>
        <div class="flex items-center gap-1 cursor-pointer hover:text-gray-700 transition-colors"
          @click="toggleSort('status')">
          <span>状态</span>
          <svg v-if="sortField === 'status'" class="w-3 h-3" :class="{ 'rotate-180': sortDirection === 'desc' }"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
          </svg>
        </div>
      </div>

      <!-- 表格内容 -->
      <div class="divide-y divide-gray-100">
        <div v-for="task in tasks" :key="task._id"
          class="grid grid-cols-[40px_80px_1fr_120px_100px_120px_80px] gap-4 px-4 py-3 hover:bg-gray-50 transition-colors items-center"
          :class="{ 'bg-blue-50': selectedTaskIds.has(task._id) }">
          <!-- Checkbox -->
          <div class="flex items-center justify-center" @click.stop>
            <input type="checkbox"
              class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
              :checked="selectedTaskIds.has(task._id)" @change="toggleTaskSelection(task._id)" />
          </div>

          <!-- ID -->
          <div class="text-sm font-mono text-gray-500 cursor-pointer" @click="openTaskDetail(task._id)">
            #{{ task.displayId }}
          </div>

          <!-- 标题 -->
          <div class="min-w-0 cursor-pointer" @click="openTaskDetail(task._id)">
            <div class="font-medium text-gray-900 truncate">{{ task.title }}</div>
            <div v-if="task.tagIds && task.tagIds.length > 0" class="flex items-center gap-1 mt-1">
              <span v-for="tagId in task.tagIds.slice(0, 2)" :key="tagId"
                class="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                {{ tagId }}
              </span>
              <span v-if="task.tagIds.length > 2" class="text-xs text-gray-400">
                +{{ task.tagIds.length - 2 }}
              </span>
            </div>
          </div>

          <!-- 指派人 -->
          <div class="text-sm text-gray-600 cursor-pointer" @click="openTaskDetail(task._id)">
            <div v-if="task.assignee || task.assigneeId" class="flex items-center gap-2">
              <el-tooltip
                :content="task.assignee?.displayName || task.assignee?.username || task.assignee?.email || task.assigneeId"
                placement="top">
                <div
                  class="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                  {{ (task.assignee?.displayName || task.assignee?.username || task.assignee?.email || task.assigneeId
                    || '').charAt(0).toUpperCase() }}
                </div>

              </el-tooltip>
            </div>
            <span v-else class="text-gray-400">未指派</span>
          </div>

          <!-- 优先级 -->
          <div class="cursor-pointer" @click="openTaskDetail(task._id)">
            <span class="inline-block px-2 py-1 text-xs font-medium rounded-full"
              :class="getPriorityBadgeClass(task.priority)">
              {{ getPriorityText(task.priority) }}
            </span>
          </div>

          <!-- 最后更新 -->
          <div class="text-sm text-gray-500 cursor-pointer" @click="openTaskDetail(task._id)">
            {{ formatDate(task.updatedAt) }}
          </div>

          <!-- 状态 -->
          <div class="cursor-pointer" @click="openTaskDetail(task._id)">
            <div class="w-5 h-5 rounded flex items-center justify-center" :class="getStatusIconClass(task.status)">
              <svg v-if="task.status === 'completed'" class="w-3 h-3" fill="none" stroke="currentColor"
                viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
              </svg>
              <div v-else class="w-2 h-2 rounded-full bg-current"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 加载更多指示器 -->
      <div ref="loadMoreTrigger" v-if="hasMore && !isLoading" class="p-4 text-center border-t border-gray-100">
        <div v-if="isLoadingMore" class="flex items-center justify-center gap-2 text-sm text-gray-500">
          <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span>加载更多任务...</span>
        </div>
        <button v-else
          class="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
          @click="loadMoreTasks">
          加载更多 (剩余 {{ total - tasks.length }} 个)
        </button>
      </div>

      <!-- 全部加载完成提示 -->
      <div v-if="!hasMore && tasks.length > 0 && !isLoading" class="p-4 text-center border-t border-gray-100">
        <span class="text-sm text-gray-400">已加载全部任务</span>
      </div>
    </div>

    <!-- 任务详情抽屉 -->
    <TaskDetailDrawer :is-open="isDrawerOpen" :mode="drawerMode" :task-id="selectedTaskId" :project-id="projectId"
      :all-tasks="tasks" @close="closeDrawer" @update:task-id="selectedTaskId = $event"
      @task-created="handleTaskCreated" @task-updated="handleTaskUpdated" @task-deleted="handleTaskDeleted" />

    <!-- 导入确认对话框 -->
    <el-dialog v-model="importConfirmVisible" title="确认导入任务" width="700px" :append-to-body="true">
      <div class="space-y-4">
        <div class="text-sm text-gray-600 mb-4">
          检测到 {{ tasksToImport.length }} 个任务，请确认并编辑任务摘要：
        </div>

        <div class="max-h-96 overflow-y-auto space-y-2">
          <div v-for="(task, index) in tasksToImport" :key="index" class="border border-gray-200 rounded-lg p-3">
            <div class="flex items-start gap-2 mb-2">
              <div class="flex-1">
                <h4 class="text-sm font-medium text-gray-900 mb-1">{{ task.title || '未命名任务' }}</h4>
                <div class="flex items-center gap-1.5 text-xs text-gray-500">
                  <span class="px-1.5 py-0.5 rounded bg-gray-100 text-xs">{{ task.status === 'todo' ? '待办' : task.status
                    === 'in_progress' ? '进行中' : '已完成' }}</span>
                  <span class="px-1.5 py-0.5 rounded bg-gray-100 text-xs">{{ task.priority === 'high' ? '高' :
                    task.priority === 'low' ? '低' : '中' }}优先级</span>
                  <span v-if="task._id" class="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 text-xs">更新</span>
                  <span v-else class="px-1.5 py-0.5 rounded bg-green-100 text-green-700 text-xs">新建</span>
                </div>
              </div>
            </div>

            <div class="space-y-1.5">
              <label class="block text-xs font-medium text-gray-700">任务摘要</label>
              <el-input v-model="editableSummaries[index]" type="textarea" :rows="2" placeholder="简要描述此次变更的内容..."
                maxlength="100" show-word-limit size="small" />
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <el-button @click="importConfirmVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmImportTasks">确认导入</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import TaskDetailDrawer from '../TaskDetailDrawer.vue'
import { getTaskList, getTaskDetail, createTask as createTaskAPI, updateTask as updateTaskAPI, deleteTask as deleteTaskAPI } from '@/api/task'
import { importTasksFromMarkdown, importTasksFromJSON, readFromClipboard, exportTasksToMarkdown, copyToClipboard } from '@/utils/export'
import { registerShortcut, unregisterShortcut } from '@/composables/useKeyboard'
import type { Task } from '@/types/task'

interface Props {
  projectId: string
}

const props = defineProps<Props>()

// 任务数据
const tasks = ref<Task[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)

// 分页状态
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const hasMore = ref(true)
const isLoadingMore = ref(false)

// 排序状态
const sortField = ref<string | null>(null)
const sortDirection = ref<'asc' | 'desc'>('asc')

// 批量选择状态
const selectedTaskIds = ref<Set<string>>(new Set())

// 导入确认对话框状态
const importConfirmVisible = ref(false)
const tasksToImport = ref<Array<Partial<Task> & { summary?: string }>>([])
const editableSummaries = ref<Record<number, string>>({})

// 无限滚动相关
const loadMoreTrigger = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

// 计算属性：是否全选
const isAllSelected = computed(() => {
  return tasks.value.length > 0 && selectedTaskIds.value.size === tasks.value.length
})

// 计算属性：是否部分选中
const isSomeSelected = computed(() => {
  return selectedTaskIds.value.size > 0 && selectedTaskIds.value.size < tasks.value.length
})

// 切换排序（重新加载数据）
const toggleSort = (field: string) => {
  if (sortField.value === field) {
    // 同一字段：切换方向
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    // 新字段：默认升序
    sortField.value = field
    sortDirection.value = 'asc'
  }
  // 重新加载任务以应用新的排序
  loadTasks()
}

// 加载任务列表（初始加载或重新加载）
const loadTasks = async (reset = true) => {
  if (!props.projectId) return

  // 如果是重置加载，显示全局加载状态
  if (reset) {
    isLoading.value = true
    currentPage.value = 1
    tasks.value = []
  } else {
    // 如果是加载更多，显示加载更多状态
    isLoadingMore.value = true
  }

  error.value = null

  try {
    const response = await getTaskList({
      projectId: props.projectId,
      page: reset ? 1 : currentPage.value,
      size: pageSize.value,
      sortField: sortField.value || undefined,
      sortDirection: sortDirection.value
    })

    // 如果是重置，直接赋值；否则追加
    if (reset) {
      tasks.value = response.items
    } else {
      tasks.value = [...tasks.value, ...response.items]
    }

    // 更新分页信息
    total.value = response.total
    hasMore.value = tasks.value.length < response.total
  } catch (err: any) {
    error.value = err?.message || '加载任务失败'
    console.error('Failed to load tasks:', err)
  } finally {
    if (reset) {
      isLoading.value = false
    } else {
      isLoadingMore.value = false
    }
  }
}

// 加载更多任务
const loadMoreTasks = async () => {
  if (!hasMore.value || isLoadingMore.value || isLoading.value) return

  currentPage.value++
  await loadTasks(false)
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

// 从剪贴板导入任务（支持 JSON 和 Markdown）
const handleImportTasks = async () => {
  if (!props.projectId) {
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
    let parsedTasks: Array<Partial<Task>> = []

    // 先尝试解析为 JSON
    try {
      parsedTasks = importTasksFromJSON(content, props.projectId!)
    } catch (jsonError) {
      // JSON 解析失败，尝试 Markdown 解析
      try {
        parsedTasks = importTasksFromMarkdown(content, props.projectId!)
      } catch (mdError) {
        console.error('Both JSON and Markdown import failed:', { jsonError, mdError })
        ElMessage.error('导入失败：内容格式不正确（请使用 JSON 或 Markdown 格式）')
        return
      }
    }

    if (parsedTasks.length === 0) {
      ElMessage.warning('未能解析出任务，请检查格式')
      return
    }

    // 保存待导入的任务并显示确认对话框
    tasksToImport.value = parsedTasks
    editableSummaries.value = {}
    parsedTasks.forEach((task, index) => {
      editableSummaries.value[index] = task.summary || ''
    })
    importConfirmVisible.value = true
  } catch (error) {
    console.error('Parse tasks error:', error)
    ElMessage.error('解析任务失败')
  }
}

// 确认导入任务
const confirmImportTasks = async () => {
  try {
    // 更新任务的 summary
    const finalTasks = tasksToImport.value.map((task, index) => ({
      ...task,
      summary: editableSummaries.value[index] || ''
    }))

    // 处理每个任务（创建或更新），返回操作类型和结果
    const promises = finalTasks.map(async task => {
      // 如果有 _id，先检查任务是否存在
      if (task._id) {
        try {
          // 尝试获取任务详情，检查是否存在
          const existingTask = await getTaskDetail(task._id)

          // 任务存在，更新它
          const result = await updateTaskAPI({
            id: task._id!,
            title: task.title || existingTask.title,
            content: task.content !== undefined ? task.content : existingTask.content,
            status: task.status || existingTask.status,
            priority: task.priority || existingTask.priority,
            assigneeId: task.assigneeId !== undefined ? task.assigneeId : existingTask.assigneeId,
            tagIds: task.tagIds || existingTask.tagIds,
            moduleIds: task.moduleIds || existingTask.moduleIds,
            dueDate: task.dueDate !== undefined ? task.dueDate : existingTask.dueDate,
            summary: task.summary || ''
          })
          return { type: 'updated' as const, result }
        } catch (error: any) {
          // 任务不存在（404错误），创建新任务
          if (error?.response?.status === 404 || error?.message?.includes('not found')) {
            console.log(`Task ${task._id} not found, creating new task`)
            const result = await createTaskAPI({
              projectId: props.projectId!,
              title: task.title || '未命名任务',
              content: task.content || '',
              status: task.status || 'todo',
              priority: task.priority || 'medium',
              assigneeId: task.assigneeId,
              tagIds: task.tagIds || [],
              moduleIds: task.moduleIds || [],
              summary: task.summary || ''
            })
            return { type: 'created' as const, result }
          }
          // 其他错误，继续抛出
          throw error
        }
      } else {
        // 没有 _id，直接创建新任务
        const result = await createTaskAPI({
          projectId: props.projectId!,
          title: task.title || '未命名任务',
          content: task.content || '',
          status: task.status || 'todo',
          priority: task.priority || 'medium',
          assigneeId: task.assigneeId,
          tagIds: task.tagIds || [],
          moduleIds: task.moduleIds || [],
          summary: task.summary || ''
        })
        return { type: 'created' as const, result }
      }
    })

    const results = await Promise.all(promises)

    // 统计创建和更新的数量
    const createdCount = results.filter(r => r.type === 'created').length
    const updatedCount = results.filter(r => r.type === 'updated').length

    // 显示结果消息
    const messages: string[] = []
    if (createdCount > 0) messages.push(`创建 ${createdCount} 个`)
    if (updatedCount > 0) messages.push(`更新 ${updatedCount} 个`)
    ElMessage.success(`成功${messages.join('、')}任务`)

    // 关闭对话框
    importConfirmVisible.value = false
    tasksToImport.value = []
    editableSummaries.value = {}

    // 刷新任务列表
    await loadTasks()
  } catch (error: any) {
    console.error('Import from markdown error:', error)
    ElMessage.error(`导入失败：${error?.message || '未知错误'}`)
  }
}

// 组件挂载时加载任务和注册快捷键
onMounted(() => {
  loadTasks()

  // 设置无限滚动观察器
  observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0]
      // 当加载更多触发器进入视口时，自动加载更多
      if (entry && entry.isIntersecting && hasMore.value && !isLoadingMore.value && !isLoading.value) {
        loadMoreTasks()
      }
    },
    {
      root: null, // 使用视口作为根元素
      rootMargin: '100px', // 提前 100px 开始加载
      threshold: 0.1
    }
  )

  // 开始观察加载更多触发器
  watch(
    loadMoreTrigger,
    (el) => {
      if (el && observer) {
        observer.observe(el)
      }
    },
    { immediate: true }
  )

  // 注册组件级快捷键
  registerShortcut({
    key: 'n',
    description: '新建任务',
    category: '任务操作',
    handler: () => {
      if (!isDrawerOpen.value) {
        handleCreateTask()
      }
    }
  })

  registerShortcut({
    key: 'i',
    meta: true,
    description: '快捷导入任务',
    category: '任务操作',
    handler: () => {
      if (!isDrawerOpen.value && props.projectId) {
        handleImportTasks()
      }
    }
  })

  registerShortcut({
    key: 'e',
    meta: true,
    description: '快捷导出任务',
    category: '任务操作',
    handler: () => {
      if (!isDrawerOpen.value && selectedTaskIds.value.size > 0) {
        handleBatchExport()
      }
    }
  })
})

onUnmounted(() => {
  // 清理无限滚动观察器
  if (observer) {
    observer.disconnect()
    observer = null
  }

  // 移除组件级快捷键
  unregisterShortcut('n')
  unregisterShortcut('i')
  unregisterShortcut('e')
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

  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diff < minute) {
    return '刚刚'
  } else if (diff < hour) {
    const minutes = Math.floor(diff / minute)
    return `${minutes}分钟前`
  } else if (diff < day) {
    const hours = Math.floor(diff / hour)
    return `${hours}小时前`
  } else {
    // 计算今天0点的时间
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayTime = today.getTime()

    // 计算 timestamp 是哪一天，和今天的天数差
    const inputDate = new Date(timestamp)
    inputDate.setHours(0, 0, 0, 0)
    const inputTime = inputDate.getTime()
    const dayDiff = Math.floor((todayTime - inputTime) / day)

    if (dayDiff === 0) {
      // 今天，但是前面已判断过 <day，不会到这里
      return '今天'
    } else if (dayDiff === 1) {
      return '昨天'
    } else if (dayDiff === 2) {
      return '前天'
    } else {
      // 超过前天显示具体日期
      return new Date(timestamp).toLocaleDateString('zh-CN', {
        month: '2-digit',
        day: '2-digit'
      })
    }
  }
}
</script>
