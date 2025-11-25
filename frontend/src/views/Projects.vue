<template>
  <div class="p-6 h-full flex flex-col bg-gray-50 dark:bg-gray-900">
    <!-- 顶部栏 -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">项目列表</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          管理你的所有项目，支持归档与恢复。归档后的项目不会出现在左侧菜单栏。
        </p>
      </div>
      <div class="flex items-center gap-3">
        <div class="w-44 flex-shrink-0">
          <el-select
            v-model="statusFilter"
            size="small"
            class="w-full"
          >
            <el-option label="全部项目" value="all" />
            <el-option label="进行中" value="active" />
            <el-option label="已完成" value="completed" />
            <el-option label="已暂停" value="paused" />
            <el-option label="已归档" value="archived" />
          </el-select>
        </div>

        <el-button
          type="primary"
          :style="{ backgroundColor: '#3762E3', borderColor: '#3762E3' }"
          @click="showCreateProject = true"
        >
          <el-icon class="mr-1">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </el-icon>
          新建项目
        </el-button>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="flex-1">
      <div v-if="loading" class="flex items-center justify-center h-64 text-gray-400 dark:text-gray-500">
        <div class="text-center">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p class="mt-2">加载项目中...</p>
        </div>
      </div>

      <div v-else>
        <div v-if="filteredProjects.length === 0" class="h-64 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
          <svg class="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <p class="text-sm">
            暂无{{ statusFilter === 'all' ? '' : statusTextMap[statusFilter] }}项目，
            可以点击右上角<span class="mx-1 text-blue-600 dark:text-blue-400">新建项目</span>开始。
          </p>
        </div>

        <div
          v-else
          class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
        >
          <div
            v-for="project in filteredProjects"
            :key="project._id"
            class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow duration-200 flex flex-col"
          >
            <div class="p-4 flex-1 flex flex-col">
              <div class="flex items-start justify-between mb-3">
                <div class="flex items-center gap-3">
                  <div
                    class="w-10 h-10 rounded-lg flex items-center justify-center text-white text-lg font-semibold shadow-sm"
                    :style="{ backgroundColor: project.color || '#6366f1' }"
                  >
                    {{ (project.icon || project.name?.charAt(0) || 'P').toUpperCase() }}
                  </div>
                  <div>
                    <h2 class="text-base font-semibold text-gray-900 dark:text-gray-100 leading-snug">
                      {{ project.name }}
                    </h2>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                      {{ project.description || '暂无项目描述' }}
                    </p>
                  </div>
                </div>
                <span
                  class="px-2 py-0.5 rounded-full text-xs font-medium"
                  :class="getStatusBadgeClass(project.status)"
                >
                  {{ getStatusText(project.status) }}
                </span>
              </div>

              <!-- 统计信息 -->
              <div class="grid grid-cols-3 gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                <div class="flex items-center gap-1">
                  <svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span>{{ project.taskCount ?? 0 }} 个任务</span>
                </div>
                <div class="flex items-center gap-1">
                  <svg class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>
                    {{ project.completedTaskCount ?? 0 }} 已完成
                  </span>
                </div>
                <div class="flex items-center gap-1">
                  <svg class="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M9 20h6m-6 0H4v-2a3 3 0 015.356-1.857M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{{ project.memberCount ?? 1 }} 人参与</span>
                </div>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="px-4 py-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 rounded-b-xl">
              <div class="flex items-center gap-2">
                <el-button
                  type="primary"
                  link
                  @click="goToProject(project)"
                >
                  进入项目
                </el-button>
                <el-button
                  type="default"
                  link
                  @click="openInNewTab(project)"
                >
                  新标签打开
                </el-button>
              </div>
              <div class="flex items-center gap-2">
                <el-dropdown trigger="click">
                  <span class="el-dropdown-link text-xs text-gray-500 dark:text-gray-400 cursor-pointer flex items-center gap-1">
                    更多
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item @click="handleArchiveToggle(project)">
                        {{ project.status === 'archived' ? '恢复项目' : '归档项目' }}
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建项目对话框 -->
    <CreateProjectDialog
      v-model="showCreateProject"
      @created="handleProjectCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useProjectStore } from '@/stores/project'
import CreateProjectDialog from '@/components/CreateProjectDialog.vue'
import type { Project } from '@/types/project'

const projectStore = useProjectStore()
const router = useRouter()

const showCreateProject = ref(false)
const statusFilter = ref<'all' | 'active' | 'completed' | 'paused' | 'archived'>('all')

const loading = computed(() => projectStore.loading)
const projects = computed(() => projectStore.projects)

const statusTextMap: Record<string, string> = {
  all: '全部',
  active: '进行中',
  completed: '已完成',
  paused: '已暂停',
  archived: '已归档'
}

const filteredProjects = computed(() => {
  if (statusFilter.value === 'all') return projects.value
  return projects.value.filter(p => p.status === statusFilter.value)
})

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-700'
    case 'completed':
      return 'bg-blue-100 text-blue-700'
    case 'paused':
      return 'bg-yellow-100 text-yellow-700'
    case 'archived':
      return 'bg-gray-100 text-gray-500'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

const getStatusText = (status: string) => {
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
      return status
  }
}

const goToProject = (project: Project) => {
  router.push(`/projects/${project._id}`)
}

const openInNewTab = (project: Project) => {
  const url = router.resolve({ name: 'project', params: { id: project._id } }).href
  window.open(url, '_blank')
}

const handleArchiveToggle = async (project: Project) => {
  const isArchived = project.status === 'archived'
  try {
    if (!isArchived) {
      await ElMessageBox.confirm(
        '归档项目后将从左侧菜单栏隐藏，但不会删除数据，仍可在项目列表中查看和恢复。',
        '确认归档项目',
        {
          confirmButtonText: '归档',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
    }

    await projectStore.updateProject({
      id: project._id,
      status: isArchived ? 'active' : 'archived'
    })

    ElMessage.success(isArchived ? '项目已恢复为进行中' : '项目已归档')
  } catch (error: any) {
    if (error === 'cancel') return
    console.error('Archive project failed:', error)
    ElMessage.error(error?.message || (isArchived ? '恢复项目失败' : '归档项目失败'))
  }
}

const handleProjectCreated = () => {
  ElMessage.success('项目创建成功')
}

onMounted(async () => {
  try {
    await projectStore.fetchProjects()
  } catch (error) {
    console.error('Failed to load projects:', error)
    ElMessage.error('加载项目列表失败')
  }
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>


