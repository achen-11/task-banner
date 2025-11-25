<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      @click.self="handleClose"
    >
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {{ isEdit ? '编辑标签' : '新建标签' }}
          </h2>
          <button
            @click="handleClose"
            class="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSubmit" class="p-6 space-y-4">
          <!-- 标签名称 -->
          <div>
            <label for="tag-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              标签名称 <span class="text-red-500">*</span>
            </label>
            <input
              id="tag-name"
              v-model="formData.name"
              type="text"
              required
              placeholder="请输入标签名称"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              :disabled="loading"
            />
          </div>

          <!-- 标签颜色 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              标签颜色
            </label>
            <div class="flex gap-2 flex-wrap">
              <button
                v-for="color in colorOptions"
                :key="color"
                type="button"
                @click="formData.color = color"
                class="w-8 h-8 rounded-md border-2 transition-all"
                :class="formData.color === color ? 'border-gray-900 dark:border-gray-100 scale-110' : 'border-transparent hover:scale-105'"
                :style="{ backgroundColor: color }"
                :disabled="loading"
              ></button>
            </div>
          </div>

          <!-- 快速访问栏 -->
          <div>
            <label class="flex items-center gap-2">
              <input
                v-model="formData.showInQuickBar"
                type="checkbox"
                class="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 bg-white dark:bg-gray-700"
                :disabled="loading"
              />
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">显示在快速访问栏</span>
            </label>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">
              勾选后，此标签将显示在任务详情页的标签栏中，方便快速选择
            </p>
          </div>

          <!-- AI 提示词 -->
          <div>
            <label for="tag-prompt" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              AI 提示词（可选）
            </label>
            <textarea
              id="tag-prompt"
              v-model="formData.prompt"
              rows="4"
              placeholder="例如：这是讨论型任务，你不要操作代码，先将你的想法输出到 md 文件和我讨论"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              :disabled="loading"
            ></textarea>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-start gap-1">
              <svg class="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>导出任务时，此提示词会自动添加到任务描述中，用于指导 AI 的行为</span>
            </p>
          </div>

          <!-- Error Message -->
          <div v-if="error" class="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md">
            <p class="text-sm text-red-600 dark:text-red-400">{{ error }}</p>
          </div>

          <!-- Footer -->
          <div class="flex justify-end gap-3 pt-4">
            <button
              type="button"
              @click="handleClose"
              class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              :disabled="loading"
            >
              取消
            </button>
            <button
              type="submit"
              class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="loading"
            >
              {{ loading ? '保存中...' : '保存' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { createTag, updateTag } from '@/api/tag'
import type { Tag, CreateTagParams } from '@/types/tag'
import { ElMessage } from 'element-plus'

interface Props {
  modelValue: boolean
  projectId: string
  tag?: Tag | null  // 如果传入 tag，则为编辑模式
}

const props = withDefaults(defineProps<Props>(), {
  tag: null
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'success', tag: Tag): void
}>()

// 颜色选项
const colorOptions = [
  '#EF4444', // red
  '#F97316', // orange
  '#F59E0B', // amber
  '#84CC16', // lime
  '#10B981', // emerald
  '#14B8A6', // teal
  '#3B82F6', // blue
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#6B7280', // gray
]

const loading = ref(false)
const error = ref('')

const formData = ref<CreateTagParams>({
  projectId: props.projectId,
  name: '',
  color: colorOptions[6], // 默认蓝色
  prompt: '',
  showInQuickBar: false
})

const isEdit = ref(false)

// 监听弹窗打开，初始化表单数据
watch(() => props.modelValue, (open) => {
  if (open) {
    error.value = ''
    isEdit.value = !!props.tag

    if (props.tag) {
      // 编辑模式：填充现有数据
      formData.value = {
        projectId: props.projectId,
        name: props.tag.name,
        color: props.tag.color || colorOptions[6],
        prompt: props.tag.prompt || '',
        showInQuickBar: props.tag.showInQuickBar
      }
    } else {
      // 创建模式：重置表单
      formData.value = {
        projectId: props.projectId,
        name: '',
        color: colorOptions[6],
        prompt: '',
        showInQuickBar: false
      }
    }
  }
})

const handleClose = () => {
  if (loading.value) return
  emit('update:modelValue', false)
}

// 处理键盘事件
const handleKeyDown = (event: KeyboardEvent) => {
  // ESC键关闭弹窗
  if (event.key === 'Escape' && props.modelValue) {
    event.preventDefault()
    handleClose()
  }
}

// 监听键盘事件
onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
})

// 组件卸载时移除监听器
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})

const handleSubmit = async () => {
  if (loading.value) return

  try {
    loading.value = true
    error.value = ''

    let result: Tag

    if (isEdit.value && props.tag) {
      // 编辑模式
      result = await updateTag({
        id: props.tag._id,
        ...formData.value
      })
      ElMessage.success('标签更新成功')
    } else {
      // 创建模式
      result = await createTag(formData.value)
      ElMessage.success('标签创建成功')
    }

    emit('success', result)
    handleClose()
  } catch (err: any) {
    console.error('Failed to save tag:', err)
    error.value = err.message || '保存失败，请重试'
  } finally {
    loading.value = false
  }
}
</script>
