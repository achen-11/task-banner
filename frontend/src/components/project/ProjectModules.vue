<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-100">
    <!-- 头部：标题和新建按钮 -->
    <div class="p-4 border-b border-gray-100 flex items-center justify-between">
      <h2 class="text-lg font-semibold text-gray-900">项目模块</h2>
      <button
        @click="showCreateDialog = true"
        class="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
      >
        <svg class="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        新建模块
      </button>
    </div>

    <!-- 模块列表 -->
    <div class="p-4">
      <!-- 加载中状态 -->
      <div v-if="loading" class="flex justify-center items-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>

      <!-- 空状态 -->
      <div v-else-if="modules.length === 0" class="text-center py-8 text-gray-400">
        <svg class="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
        </svg>
        <p>暂无模块</p>
        <p class="text-sm mt-1">模块可以帮助你更好地组织任务</p>
      </div>

      <!-- 模块列表内容 -->
      <div v-else class="space-y-2">
        <div
          v-for="module in sortedModules"
          :key="module._id"
          class="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div class="flex items-center gap-3">
            <!-- 模块颜色标识 -->
            <div
              class="w-4 h-4 rounded"
              :style="{ backgroundColor: module.color }"
            ></div>

            <!-- 模块名称 -->
            <div>
              <h3 class="font-medium text-gray-900">{{ module.name }}</h3>
              <p class="text-sm text-gray-500">
                创建于 {{ formatDate(module.createdAt) }}
              </p>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="flex items-center gap-2">
            <button
              @click="handleEdit(module)"
              class="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
              title="编辑"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              @click="handleDelete(module)"
              class="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              title="删除"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建/编辑模块对话框 -->
    <ModuleDialog
      v-model:visible="showCreateDialog"
      :project-id="projectId"
      :module="editingModule"
      @saved="handleModuleSaved"
      @cancelled="handleDialogCancelled"
    />

    <!-- 删除确认对话框 -->
    <ConfirmDialog
      v-model:visible="showDeleteDialog"
      title="删除模块"
      :message="`确定要删除模块 '${deletingModule?.name}' 吗？此操作不可恢复。`"
      confirmText="删除"
      cancelText="取消"
      confirmClass="bg-red-600 hover:bg-red-700"
      @confirmed="handleDeleteConfirmed"
      @cancelled="handleDeleteCancelled"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getModuleList, deleteModule } from '@/api/module'
import type { Module } from '@/types/module'
import ModuleDialog from './ModuleDialog.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'

interface Props {
  projectId: string
}

const props = defineProps<Props>()

// 响应式数据
const loading = ref(false)
const modules = ref<Module[]>([])
const showCreateDialog = ref(false)
const showDeleteDialog = ref(false)
const editingModule = ref<Module | null>(null)
const deletingModule = ref<Module | null>(null)

// 计算属性：排序后的模块列表
const sortedModules = computed(() => {
  return modules.value.sort((a, b) => {
    // 顶级模块（空 parentId）排在前面
    if (a.parentId === '' && b.parentId !== '') return -1
    if (a.parentId !== '' && b.parentId === '') return 1
    if (a.parentId !== b.parentId) {
      return a.parentId.localeCompare(b.parentId)
    }
    return a.order - b.order
  })
})

// 加载模块列表
const loadModules = async () => {
  if (!props.projectId) return

  loading.value = true
  try {
    const response = await getModuleList(props.projectId)
    modules.value = response.items
  } catch (error) {
    console.error('Failed to load modules:', error)
  } finally {
    loading.value = false
  }
}

// 处理编辑模块
const handleEdit = (module: Module) => {
  editingModule.value = module
  showCreateDialog.value = true
}

// 处理删除模块
const handleDelete = (module: Module) => {
  deletingModule.value = module
  showDeleteDialog.value = true
}

// 处理模块保存成功
const handleModuleSaved = () => {
  showCreateDialog.value = false
  editingModule.value = null
  loadModules()
}

// 处理对话框取消
const handleDialogCancelled = () => {
  showCreateDialog.value = false
  editingModule.value = null
}

// 处理删除确认
const handleDeleteConfirmed = async () => {
  if (!deletingModule.value) return

  try {
    await deleteModule(deletingModule.value._id)
    showDeleteDialog.value = false
    deletingModule.value = null
    loadModules()
  } catch (error) {
    console.error('Failed to delete module:', error)
  }
}

// 处理删除取消
const handleDeleteCancelled = () => {
  showDeleteDialog.value = false
  deletingModule.value = null
}

// 格式化日期
const formatDate = (timestamp: number) => {
  const date = new Date(timestamp)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

// 组件挂载时加载数据
onMounted(() => {
  loadModules()
})
</script>
