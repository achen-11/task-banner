<template>
  <div class="flex items-center justify-between mb-6">
    <div class="flex items-center gap-4">
      <!-- <h1 class="text-2xl font-bold text-gray-900">我的任务</h1> -->
      <!-- <span class="text-sm text-gray-500">所有项目中分配给我和我创建的任务</span> -->
    </div>

    <div class="flex items-center gap-2">
      <!-- 视图切换 -->
      <div class="bg-gray-100 dark:bg-gray-800 rounded-lg p-1 flex">
        <button
          v-for="view in views"
          :key="view.value"
          @click="switchView(view.value as 'list' | 'board' | 'calendar' | 'timeline')"
          class="px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 flex items-center gap-2"
          :class="currentView === view.value
            ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'"
        >
          <component :is="view.icon" class="w-4 h-4" />
          {{ view.label }}
        </button>
      </div>

      <!-- 导出按钮 -->
      <el-button
        v-if="selectedTasksCount > 0"
        @click="handleExport"
        class="flex items-center gap-2"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        导出 ({{ selectedTasksCount }})
      </el-button>

      <!-- 刷新按钮 -->
      <el-button
        @click="handleRefresh"
        :loading="loading"
        class="flex items-center gap-2"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        刷新
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUserTasksStore } from '@/stores/userTasks'
import { List, Grid3x3, Calendar, CalendarDays } from 'lucide-vue-next'
import { ElMessage } from 'element-plus'

interface Emits {
  (e: 'export'): void
}

const emit = defineEmits<Emits>()

const userTasksStore = useUserTasksStore()

const currentView = computed(() => userTasksStore.currentView)
const loading = computed(() => userTasksStore.loading)
const selectedTasksCount = computed(() => userTasksStore.selectedTasksCount)

// 视图配置
const views = [
  { value: 'list', label: '列表', icon: List },
  { value: 'board', label: '看板', icon: Grid3x3 },
  { value: 'calendar', label: '日历', icon: Calendar },
  { value: 'timeline', label: '时间线', icon: CalendarDays }
]

// 切换视图
const switchView = (view: 'list' | 'board' | 'calendar' | 'timeline') => {
  // 暂时只支持列表和看板视图
  if (view === 'calendar' || view === 'timeline') {
    ElMessage.info('该视图正在开发中，敬请期待')
    return
  }

  userTasksStore.switchView(view as 'list' | 'board')
}

// 处理导出
const handleExport = () => {
  emit('export')
}

// 处理刷新
const handleRefresh = () => {
  userTasksStore.refresh()
  ElMessage.success('任务列表已刷新')
}
</script>