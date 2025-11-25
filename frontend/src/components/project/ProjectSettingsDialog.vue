<template>
  <el-dialog
    v-model="visible"
    title="项目设置"
    width="600px"
    :append-to-body="true"
    @close="handleClose"
  >
    <div class="space-y-6">
      <!-- 基本信息 -->
      <div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">基本信息</h3>
        <div class="space-y-4">
          <!-- 项目名称 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">项目名称</label>
            <el-input
              v-model="formData.name"
              placeholder="请输入项目名称"
              maxlength="50"
              show-word-limit
            />
          </div>

          <!-- 项目描述 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">项目描述</label>
            <el-input
              v-model="formData.description"
              type="textarea"
              :rows="3"
              placeholder="请输入项目描述"
              maxlength="200"
              show-word-limit
            />
          </div>

          <!-- 项目颜色 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">项目颜色</label>
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-lg border-2 border-gray-300 dark:border-gray-600"
                :style="{ backgroundColor: formData.color }"
              ></div>
              <el-color-picker v-model="formData.color" />
              <span class="text-sm text-gray-500 dark:text-gray-400">选择项目的主题色</span>
            </div>
          </div>

          <!-- 项目图标 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">项目图标</label>
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-lg border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center text-white text-lg font-semibold"
                :style="{ backgroundColor: formData.color }"
              >
                {{ formData.icon || projectInitial }}
              </div>
              <el-input
                v-model="formData.icon"
                placeholder="输入图标（建议1-2个字符）"
                maxlength="2"
                style="width: 200px"
              />
              <span class="text-sm text-gray-500 dark:text-gray-400">1-2个字符的图标</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 危险操作 -->
      <div class="pt-6 border-t border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-medium text-red-600 dark:text-red-400 mb-4">危险操作</h3>
        <div class="bg-red-50 dark:bg-red-900/30 rounded-lg p-4 border border-red-200 dark:border-red-800">
          <div class="flex items-center justify-between">
            <div>
              <h4 class="text-sm font-medium text-red-800 dark:text-red-300">删除项目</h4>
              <p class="text-sm text-red-600 dark:text-red-400 mt-1">删除后将无法恢复，所有任务和数据将被永久删除</p>
            </div>
            <el-button
              type="danger"
              plain
              @click="showDeleteConfirm = true"
            >
              删除项目
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <el-button @click="handleClose">取消</el-button>
        <el-button
          type="primary"
          :loading="loading"
          @click="handleSave"
        >
          保存更改
        </el-button>
      </div>
    </template>
  </el-dialog>

  <!-- 删除确认对话框 -->
  <el-dialog
    v-model="showDeleteConfirm"
    title="确认删除项目"
    width="400px"
    :append-to-body="true"
  >
    <div class="space-y-4">
      <div class="bg-red-50 dark:bg-red-900/30 rounded-lg p-4 border border-red-200 dark:border-red-800">
        <div class="flex items-center gap-3 text-red-800 dark:text-red-300">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <h4 class="font-medium">警告：此操作不可恢复</h4>
            <p class="text-sm mt-1">删除项目后将永久删除所有任务和相关数据</p>
          </div>
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          请输入项目名称 "<strong>{{ project?.name }}</strong>" 确认删除
        </label>
        <el-input
          v-model="deleteConfirmText"
          placeholder="输入项目名称"
        />
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <el-button @click="showDeleteConfirm = false">取消</el-button>
        <el-button
          type="danger"
          :disabled="deleteConfirmText !== project?.name"
          :loading="deleteLoading"
          @click="handleDelete"
        >
          确认删除
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { Project, UpdateProjectParams } from '@/types/project'
import { updateProject } from '@/api/project'
import { useProjectStore } from '@/stores/project'

interface Props {
  visible: boolean
  project: Project | null
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'updated', project: Project): void
  (e: 'deleted'): void
}

const props = withDefaults(defineProps<Props>(), {
  project: null
})

const emit = defineEmits<Emits>()

// Project store
const projectStore = useProjectStore()

// 表单数据
const formData = ref<UpdateProjectParams>({
  id: '',
  name: '',
  description: '',
  color: '#3B82F6',
  icon: ''
})

// 状态
const loading = ref(false)
const showDeleteConfirm = ref(false)
const deleteLoading = ref(false)
const deleteConfirmText = ref('')

// 计算属性
const visible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const projectInitial = computed(() => {
  return props.project?.name?.charAt(0).toUpperCase() || 'P'
})

// 监听project变化，初始化表单数据
watch(() => props.project, (newProject) => {
  if (newProject) {
    formData.value = {
      id: newProject._id,
      name: newProject.name,
      description: newProject.description,
      color: newProject.color,
      icon: newProject.icon
    }
  }
}, { immediate: true })

// 监听visible变化，重置删除相关状态
watch(visible, (newValue) => {
  if (!newValue) {
    showDeleteConfirm.value = false
    deleteConfirmText.value = ''
  }
})

// 保存项目
const handleSave = async () => {
  if (!props.project) return

  try {
    loading.value = true

    const updatedProject = await updateProject(formData.value)

    ElMessage.success('项目信息已更新')
    emit('updated', updatedProject)
    handleClose()
  } catch (error) {
    console.error('更新项目失败:', error)
    ElMessage.error('更新项目失败，请重试')
  } finally {
    loading.value = false
  }
}

// 删除项目
const handleDelete = async () => {
  if (!props.project) return

  try {
    await ElMessageBox.confirm(
      '确定要删除这个项目吗？删除后将无法恢复。',
      '确认删除',
      {
        confirmButtonText: '确认删除',
        cancelButtonText: '取消',
        type: 'error',
        confirmButtonClass: 'el-button--danger'
      }
    )

    deleteLoading.value = true

    await projectStore.deleteProject(props.project._id)

    ElMessage.success('项目已删除')
    emit('deleted')
    handleClose()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除项目失败:', error)
      ElMessage.error('删除项目失败，请重试')
    }
  } finally {
    deleteLoading.value = false
    showDeleteConfirm.value = false
  }
}

// 关闭对话框
const handleClose = () => {
  emit('update:visible', false)
}
</script>

<style scoped>
.el-color-picker {
  width: 40px;
  height: 40px;
}
</style>