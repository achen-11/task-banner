<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
    <div class="flex flex-wrap gap-4">
      <!-- 项目筛选 -->
      <div class="flex-1 min-w-[200px]">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">项目</label>
        <el-select
          v-model="localFilters.projectIds"
          multiple
          collapse-tags
          collapse-tags-tooltip
          placeholder="全部项目"
          class="w-full"
          @change="handleFiltersChange"
        >
          <el-option
            v-for="project in projects"
            :key="project._id"
            :label="project.name"
            :value="project._id"
          >
            <div class="flex items-center gap-2">
              <div
                class="w-3 h-3 rounded-full"
                :style="{ backgroundColor: project.color }"
              ></div>
              {{ project.name }}
            </div>
          </el-option>
        </el-select>
      </div>

      <!-- 状态筛选 -->
      <div class="flex-1 min-w-[200px]">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">状态</label>
        <el-select
          v-model="localFilters.status"
          placeholder="全部状态"
          class="w-full"
          clearable
          multiple
          @change="handleFiltersChange"
        >
          <el-option label="待办" value="todo" />
          <el-option label="待验收" value="review" />
          <el-option label="已完成" value="completed" />
          <el-option label="审核中" value="in_progress" />
        </el-select>
      </div>

      <!-- 优先级筛选 -->
      <div class="flex-1 min-w-[200px]">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">优先级</label>
        <el-select
          v-model="localFilters.priority"
          placeholder="全部优先级"
          class="w-full"
          clearable
          @change="handleFiltersChange"
        >
          <el-option label="高" value="high" />
          <el-option label="中" value="medium" />
          <el-option label="低" value="low" />
        </el-select>
      </div>

      
      <!-- 搜索 -->
      <div class="flex-1 min-w-[200px]">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">搜索</label>
        <el-input
          v-model="localFilters.search"
          placeholder="搜索任务标题"
          class="w-full"
          clearable
          @input="debouncedSearch"
        >
          <template #prefix>
            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </template>
        </el-input>
      </div>

      <!-- 快捷操作 -->
      <div class="flex items-end gap-2">
        <el-button @click="handleResetFilters">重置</el-button>
        <el-button type="primary" @click="handleQuickCreate">快速创建</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useProjectStore } from '@/stores/project'
import { useUserTasksStore } from '@/stores/userTasks'
import type { UserTaskFilters } from '@/api/user'
import { ElMessage } from 'element-plus'

interface Props {
  modelValue?: UserTaskFilters
}

interface Emits {
  (e: 'update:modelValue', filters: UserTaskFilters): void
  (e: 'quick-create'): void
}

const props = withDefaults(defineProps<Props>(), {})
const emit = defineEmits<Emits>()

const projectStore = useProjectStore()
const userTasksStore = useUserTasksStore()

// 本地筛选条件 - 默认显示待验收和待办任务
const localFilters = ref<UserTaskFilters>({
  projectIds: [],
  status: ['todo', 'review'], // 默认显示待验收和待办（通过API处理）
  priority: undefined,
  search: ''
})

// 获取项目列表
const projects = computed(() => projectStore.projects || [])

// 监听外部变化
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    // 合并外部值和本地默认值，确保status有默认值
    localFilters.value = {
      projectIds: [],
      status: ['todo', 'review'], // 默认值
      priority: undefined,
      search: '',
      ...newValue
    }
  }
}, { immediate: true })

// 处理筛选条件变化
const handleFiltersChange = () => {
  emit('update:modelValue', localFilters.value)
  userTasksStore.updateFilters(localFilters.value)
}

// 重置筛选条件
const handleResetFilters = () => {
  localFilters.value = {
    projectIds: [],
    status: ['todo', 'review'], // 重置为默认显示待验收和待办
    priority: undefined,
    search: ''
  }
  handleFiltersChange()
  ElMessage.success('筛选条件已重置')
}

// 快速创建任务
const handleQuickCreate = () => {
  emit('quick-create')
}

// 防抖搜索
let searchTimeout: ReturnType<typeof setTimeout> | null = null
const debouncedSearch = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  searchTimeout = setTimeout(() => {
    handleFiltersChange()
  }, 300)
}
</script>