<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      @click.self="handleClose"
    >
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">创建新项目</h2>
          <button
            @click="handleClose"
            class="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSubmit" class="p-6 space-y-4">
          <!-- 项目名称 -->
          <div>
            <label for="project-name" class="block text-sm font-medium text-gray-700 mb-1">
              项目名称 <span class="text-red-500">*</span>
            </label>
            <input
              id="project-name"
              v-model="formData.name"
              type="text"
              required
              placeholder="请输入项目名称"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              :disabled="loading"
            />
          </div>

          <!-- 项目描述 -->
          <div>
            <label for="project-description" class="block text-sm font-medium text-gray-700 mb-1">
              项目描述
            </label>
            <textarea
              id="project-description"
              v-model="formData.description"
              rows="3"
              placeholder="请输入项目描述（可选）"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              :disabled="loading"
            ></textarea>
          </div>

          <!-- 项目颜色 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              项目颜色
            </label>
            <div class="flex gap-2 flex-wrap">
              <button
                v-for="color in colorOptions"
                :key="color"
                type="button"
                @click="formData.color = color"
                class="w-8 h-8 rounded-md border-2 transition-all"
                :class="formData.color === color ? 'border-gray-900 scale-110' : 'border-transparent hover:scale-105'"
                :style="{ backgroundColor: color }"
                :disabled="loading"
              ></button>
            </div>
          </div>

          <!-- Error Message -->
          <div v-if="error" class="p-3 bg-red-50 border border-red-200 rounded-md">
            <p class="text-sm text-red-600">{{ error }}</p>
          </div>

          <!-- Footer -->
          <div class="flex justify-end gap-3 pt-4">
            <button
              type="button"
              @click="handleClose"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              :disabled="loading"
            >
              取消
            </button>
            <button
              type="submit"
              class="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="loading || !formData.name.trim()"
            >
              {{ loading ? '创建中...' : '创建项目' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useProjectStore } from '@/stores/project'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'created': [project: any]
}>()

const projectStore = useProjectStore()

// 表单数据
const formData = ref({
  name: '',
  description: '',
  color: '#6366f1'
})

// 颜色选项
const colorOptions = [
  '#6366f1', // 蓝色
  '#10b981', // 绿色
  '#f59e0b', // 橙色
  '#ec4899', // 粉色
  '#8b5cf6', // 紫色
  '#06b6d4', // 青色
  '#ef4444', // 红色
  '#84cc16', // 黄绿色
]

const loading = ref(false)
const error = ref('')

// 关闭对话框
const handleClose = () => {
  if (!loading.value) {
    emit('update:modelValue', false)
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!formData.value.name.trim()) {
    error.value = '请输入项目名称'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const project = await projectStore.createProject({
      name: formData.value.name.trim(),
      description: formData.value.description.trim() || undefined,
      color: formData.value.color
    })

    // 创建成功
    emit('created', project)
    emit('update:modelValue', false)

    // 重置表单
    formData.value = {
      name: '',
      description: '',
      color: '#6366f1'
    }
  } catch (err: any) {
    console.error('Failed to create project:', err)
    error.value = err.message || '创建项目失败，请重试'
  } finally {
    loading.value = false
  }
}

// 监听对话框打开状态，重置错误信息
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    error.value = ''
  }
})
</script>
