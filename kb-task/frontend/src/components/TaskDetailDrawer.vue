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
              <!-- 任务导航 -->
              <div class="flex items-center gap-2 text-sm text-gray-500 flex-shrink-0">
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

              <!-- 任务 ID -->
              <div v-if="currentTask" class="text-sm font-mono text-gray-500 flex-shrink-0">
                #{{ currentTask.displayId }}
              </div>

              <!-- 任务标题 -->
              <div class="flex-1 min-w-0 px-3">
                <input
                  v-if="currentTask"
                  :value="currentTask.title"
                  type="text"
                  class="w-full text-base font-semibold text-gray-900 border-0 border-b-2 border-transparent hover:border-gray-200 px-0 py-1 transition-colors bg-transparent focus:outline-none"
                  placeholder="任务标题..."
                  @blur="handleTaskUpdate({ title: ($event.target as HTMLInputElement).value })"
                />
              </div>
            </div>

            <!-- 右侧按钮组 -->
            <div class="flex items-center gap-2 flex-shrink-0">
              <button
                class="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors flex items-center gap-1"
                title="在新页面打开"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                新窗口打开
              </button>
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
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import TaskBasicInfo from './task/TaskBasicInfo.vue'
import TaskActivity from './task/TaskActivity.vue'

interface Attachment {
  _id: string
  name: string
  size: number
  type: string
  url: string
  thumbnailUrl?: string
  uploadedAt: number
}

interface Task {
  _id: string
  displayId: number
  projectId: string
  title: string
  status: 'todo' | 'in_progress' | 'completed'
  priority: 'low' | 'medium' | 'high'
  content?: string  // 任务描述内容
  assigneeId?: string
  creatorId: string
  moduleIds?: string[]  // 模块 ID 数组
  tagIds?: string[]  // 标签 ID 数组
  dueDate?: number
  progress?: number
  order: number
  attachments?: Attachment[]
  createdAt: number
  updatedAt: number
}

interface Props {
  isOpen: boolean
  taskId?: string
  allTasks?: Task[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'update:taskId', taskId: string): void
}>()

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

// 键盘快捷键
const handleKeydown = (e: KeyboardEvent) => {
  if (!props.isOpen) return

  if (e.key === 'Escape') {
    closeDrawer()
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    goToPrevTask()
  } else if (e.key === 'ArrowDown') {
    e.preventDefault()
    goToNextTask()
  }
}

// 任务更新处理
const handleTaskUpdate = (updates: Partial<Task>) => {
  console.log('Task updated:', updates)
  // TODO: 实际项目中这里会调用 API 更新任务
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

// 监听抽屉打开状态，添加/移除 body 滚动锁定
watch(() => props.isOpen, (newValue) => {
  // 注意：我们不锁定 body 滚动，因为用户需要能够点击左侧任务列表
  // 这是与传统抽屉的关键区别
})
</script>
