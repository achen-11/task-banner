<template>
  <div class="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
    <!-- 项目头部 - 专注模式时完全隐藏 -->
    <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700" v-show="!focusMode">
      <!-- 展开状态的头部 -->
      <div v-if="!collapsed" class="px-6 py-4">
        <!-- 项目标题和操作 -->
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center gap-3">
            <!-- 项目图标/颜色 -->
            <div
              class="w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl font-semibold"
              :style="{ backgroundColor: project?.color || '#6366f1' }"
            >
              {{ projectInitial }}
            </div>
            <div>
              <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ project?.name || '加载中...' }}</h1>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ project?.description }}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button
              @click="showSettingsDialog = true"
              class="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              <Settings class="w-4 h-4 inline-block mr-1" />
              项目设置
            </button>
            <el-button
              type="primary"
              :style="{ backgroundColor: '#3762E3', borderColor: '#3762E3' }"
              @click="handleHeaderCreateTask"
            >
              <el-icon class="mr-1">
                <Plus />
              </el-icon>
              新建任务
            </el-button>
            <button
              @click="collapsed = true"
              class="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="收起"
            >
              <ChevronUp class="w-5 h-5" />
            </button>
          </div>
        </div>

        <!-- 项目统计信息 -->
        <div class="flex items-center gap-6 text-sm">
          <!-- 状态 -->
          <div class="flex items-center gap-2">
            <span class="text-gray-500 dark:text-gray-400">状态:</span>
            <span
              class="px-2 py-1 rounded text-xs font-medium"
              :class="statusClasses"
            >
              {{ statusText }}
            </span>
          </div>

          <!-- 创建时间 -->
          <div class="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Calendar class="w-4 h-4" />
            <span>创建: {{ formatDate(project?.createdAt) }}</span>
          </div>

          <!-- 更新时间 -->
          <div class="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <RefreshCw class="w-4 h-4" />
            <span>更新: {{ formatDate(project?.updatedAt) }}</span>
          </div>

          <!-- 成员数 -->
          <div class="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Users class="w-4 h-4" />
            <span>成员: {{ memberCount }}</span>
          </div>

          <!-- 任务完成度 -->
          <div class="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <CheckSquare class="w-4 h-4" />
            <span>任务: {{ taskCompletionText }}</span>
            <div class="w-24 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                class="h-full bg-green-500 transition-all duration-300"
                :style="{ width: `${taskCompletionRate}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 折叠状态的头部 -->
      <div v-else class="px-6 py-3 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <!-- 项目图标/颜色 -->
          <div
            class="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-semibold"
            :style="{ backgroundColor: project?.color || '#6366f1' }"
          >
            {{ projectInitial }}
          </div>
          <div>
            <h1 class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ project?.name || '加载中...' }}</h1>
          </div>
          <!-- 简化的统计信息 -->
          <div class="flex items-center gap-4 ml-6 text-sm text-gray-600 dark:text-gray-400">
            <span
              class="px-2 py-1 rounded text-xs font-medium"
              :class="statusClasses"
            >
              {{ statusText }}
            </span>
            <span>{{ taskCompletionText }} 任务</span>
            <span>{{ memberCount }} 成员</span>
          </div>
        </div>
        <button
          @click="collapsed = false"
          class="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="展开"
        >
          <ChevronDown class="w-5 h-5" />
        </button>
      </div>

      <!-- Tab 栏 -->
      <nav class="flex px-6 space-x-8 bg-white dark:bg-gray-800">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          @click="currentTab = tab.value"
          class="py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 flex items-center gap-2"
          :class="currentTab === tab.value
            ? 'border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400'
            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'"
        >
          <component :is="tab.icon" class="w-4 h-4" />
          {{ tab.label }}
        </button>
      </nav>
    </div>

    <!-- Tab 内容 -->
    <div class="overflow-auto p-6" :class="focusMode ? 'h-full' : 'flex-1'">
      <ProjectOverview v-if="currentTab === 'overview'" :project="project" />
      <ProjectTaskList v-else-if="currentTab === 'list'" :project-id="projectId" />
      <ProjectBoard v-else-if="currentTab === 'board'" ref="projectBoardRef" :project="project" />
      <ProjectModules v-else-if="currentTab === 'modules'" :project-id="projectId" />
      <ProjectDocuments v-else-if="currentTab === 'documents'" :project-id="projectId" />
      <ProjectTags v-else-if="currentTab === 'tags'" :project-id="projectId" />
      <ProjectMembers v-else-if="currentTab === 'members'" :project-id="projectId" />
    </div>

    <!-- 项目设置对话框 -->
    <ProjectSettingsDialog
      v-model:visible="showSettingsDialog"
      :project="project"
      @updated="handleProjectUpdated"
      @deleted="handleProjectDeleted"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, inject, provide, nextTick } from 'vue'
import { ElIcon } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import { useProjectStore } from '@/stores/project'
import { useUIStore } from '@/stores/ui'
import { useTour } from '@/composables/useTour'
import type { Project } from '@/types/project'
import {
  Settings,
  Plus,
  ChevronUp,
  ChevronDown,
  Calendar,
  RefreshCw,
  Users,
  CheckSquare,
  BarChart3,
  List,
  LayoutGrid,
  Grid3x3,
  FileText,
  Tag,
  User
} from 'lucide-vue-next'
import ProjectOverview from '@/components/project/ProjectOverview.vue'
import ProjectTaskList from '@/components/project/ProjectTaskList.vue'
import ProjectBoard from '@/components/project/ProjectBoard.vue'
import ProjectModules from '@/components/project/ProjectModules.vue'
import ProjectTags from '@/components/project/ProjectTags.vue'
import ProjectMembers from '@/components/project/ProjectMembers.vue'
import ProjectDocuments from '@/components/project/ProjectDocuments.vue'
import ProjectSettingsDialog from '@/components/project/ProjectSettingsDialog.vue'

const route = useRoute()
const router = useRouter()
const projectStore = useProjectStore()
const uiStore = useUIStore()
const { checkAndStartProjectTour, markProjectTourCompleted } = useTour()

// 项目信息
const project = computed<Project | null>(() => projectStore.currentProject)

// 项目 ID - 兼容两种路由参数名称
const projectId = computed(() => {
  return (route.params.projectId || route.params.id) as string
})

// 文档 ID（从路由参数获取）
const documentId = computed(() => route.params.documentId as string | undefined)

// 头部展开/收起状态
const collapsed = ref(false)

// 当前 Tab - 从路由query获取，默认list
const currentTab = ref((route.query.tab as string) || 'overview')
const projectBoardRef = ref<InstanceType<typeof ProjectBoard> | null>(null)

const handleHeaderCreateTask = () => {
  currentTab.value = 'board'
  nextTick(() => {
    projectBoardRef.value?.openCreateTask?.()
  })
}

// 监听路由query变化，更新tab
watch(() => route.query.tab, (newTab) => {
  if (newTab && typeof newTab === 'string') {
    currentTab.value = newTab
  }
}, { immediate: true })

// 设置对话框状态
const showSettingsDialog = ref(false)

// 专注模式状态（在ProjectView中管理）
const focusMode = ref(false)

// 向子组件提供专注模式状态
provide('focusMode', focusMode)

// 专注模式切换方法 - F1专用
const toggleFocusMode = () => {
  focusMode.value = !focusMode.value

  // 直接控制三个元素的状态
  if (focusMode.value) {
    // 进入专注模式：收起所有元素
    collapsed.value = true // 收起顶部项目详情
    uiStore.setSidebarCollapsed(true) // 收起左侧菜单栏
    // 左侧文件列表由子组件的watch处理
  } else {
    // 退出专注模式：展开所有元素
    collapsed.value = false // 展开顶部项目详情
    uiStore.setSidebarCollapsed(false) // 展开左侧菜单栏
    // 左侧文件列表由子组件的watch处理
  }

  // 通知子组件状态变化
}

// 向子组件提供专注模式切换方法
provide('toggleFocusMode', toggleFocusMode)

// 向子组件提供文档ID
provide('documentId', documentId)

// 处理全局快捷键
const handleGlobalKeyboardShortcuts = (event: KeyboardEvent) => {
  // F1 - 在文档tab和看板tab中切换专注模式
  if (event.key === 'F1' && (currentTab.value === 'documents' || currentTab.value === 'board')) {
    event.preventDefault()
    toggleFocusMode()
  }

  // Cmd/Ctrl + B 已在MainLayout中处理，此处不需要重复处理
}

// Tab 列表
const tabs = [
  {
    value: 'overview',
    label: '概览',
    icon: BarChart3
  },
  {
    value: 'list',
    label: '列表',
    icon: List
  },
  {
    value: 'board',
    label: '看板',
    icon: LayoutGrid
  },
  {
    value: 'modules',
    label: '模块',
    icon: Grid3x3
  },
  {
    value: 'documents',
    label: '文档',
    icon: FileText
  },
  {
    value: 'tags',
    label: '标签',
    icon: Tag
  },
  {
    value: 'members',
    label: '成员',
    icon: User
  }
]

// 计算属性 - 项目首字母或自定义图标
const projectInitial = computed(() => {
  // 优先显示自定义图标，如果没有则使用项目名称首字母
  if (project.value?.icon) {
    return project.value.icon
  }
  return project.value?.name?.charAt(0).toUpperCase() || 'P'
})

// 计算属性 - 状态文本
const statusText = computed(() => {
  const status = project.value?.status
  switch (status) {
    case 'active':
      return '进行中'
    case 'completed':
      return '已完成'
    case 'paused':
      return '已暂停'
    case 'archived':
      return '已归档'
    default:
      return '未知'
  }
})

// 计算属性 - 状态样式
const statusClasses = computed(() => {
  const status = project.value?.status
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-700'
    case 'completed':
      return 'bg-blue-100 text-blue-700'
    case 'paused':
      return 'bg-yellow-100 text-yellow-700'
    case 'archived':
      return 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
    default:
      return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
  }
})

// 计算属性 - 成员数量
const memberCount = computed(() => {
  return project.value?.memberCount || 0
})

// 计算属性 - 任务完成文本
const taskCompletionText = computed(() => {
  const total = project.value?.taskCount || 0
  const completed = project.value?.completedTaskCount || 0
  return `${completed}/${total}`
})

// 计算属性 - 任务完成率
const taskCompletionRate = computed(() => {
  const total = project.value?.taskCount || 0
  const completed = project.value?.completedTaskCount || 0
  if (total === 0) return 0
  return Math.round((completed / total) * 100)
})

// 格式化日期
const formatDate = (timestamp: number | undefined) => {
  if (!timestamp) return '-'
  const date = new Date(timestamp)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

// 加载项目详情
const loadProject = async () => {
  const id = projectId.value
  if (!id) return

  try {
    await projectStore.fetchProjectDetail(id)
    // 项目加载完成后，检查是否需要启动引导
    await checkAndStartProjectTour(id)
  } catch (error) {
    console.error('Failed to load project:', error)
  }
}

// 监听 Tab 切换，自动展开/收起头部
watch(currentTab, (newTab) => {
  if (newTab === 'overview') {
    // 切换到概览时自动展开
    collapsed.value = false
  } else if (newTab === 'list' || newTab === 'board') {
    // 切换到列表或看板时自动收起
    collapsed.value = true
  }
})

// 处理项目更新
const handleProjectUpdated = (updatedProject: Project) => {
  // 更新store中的项目信息
  projectStore.setCurrentProject(updatedProject)
}

// 处理项目删除
const handleProjectDeleted = () => {
  // 跳转到首页
  router.push('/')
}

// 监听文档ID变化，自动切换到文档标签
watch(documentId, (newDocumentId) => {
  if (newDocumentId) {
    // 当URL中包含文档ID时，自动切换到文档标签
    currentTab.value = 'documents'
  }
}, { immediate: true })

// 监听路由变化，重新加载项目
watch(() => [route.params.id, route.params.projectId], ([id, projectId]) => {
  const effectiveProjectId = projectId || id
  if (effectiveProjectId) {
    loadProject()
  }
}, { immediate: true })

onMounted(() => {
  loadProject()

  // 添加全局键盘事件监听
  document.addEventListener('keydown', handleGlobalKeyboardShortcuts)
})

// 组件卸载时移除事件监听器
onUnmounted(() => {
  document.removeEventListener('keydown', handleGlobalKeyboardShortcuts)
})
</script>
