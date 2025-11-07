<template>
  <div
    v-if="visible"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    @click="handleBackdropClick"
  >
    <div
      class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4"
      @click.stop
    >
      <!-- 对话框头部 -->
      <div class="px-6 py-4 border-b border-gray-200">
        <h3 class="text-lg font-semibold text-gray-900">
          {{ isEditing ? '编辑模块' : '新建模块' }}
        </h3>
      </div>

      <!-- 对话框内容 -->
      <form @submit.prevent="handleSubmit">
        <div class="px-6 py-4 space-y-4">
          <!-- 模块名称 -->
          <div>
            <label for="moduleName" class="block text-sm font-medium text-gray-700 mb-1">
              模块名称 <span class="text-red-500">*</span>
            </label>
            <input
              id="moduleName"
              v-model="formData.name"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              placeholder="请输入模块名称"
            />
          </div>

          <!-- 模块颜色 -->
          <div>
            <label for="moduleColor" class="block text-sm font-medium text-gray-700 mb-1">
              模块颜色
            </label>
            <div class="space-y-3">
              <!-- 预设颜色选择 -->
              <div class="flex items-center gap-2 flex-wrap">
                <button
                  v-for="presetColor in presetColors"
                  :key="presetColor"
                  type="button"
                  @click="formData.color = presetColor"
                  class="w-8 h-8 rounded border-2 transition-all"
                  :class="formData.color === presetColor
                    ? 'border-blue-500 shadow-md scale-110'
                    : 'border-gray-300 hover:border-gray-400'"
                  :style="{ backgroundColor: presetColor }"
                  :title="presetColor"
                ></button>
              </div>

              <!-- 自定义颜色选择 -->
              <div class="flex items-center gap-2">
                <input
                  id="moduleColor"
                  v-model="formData.color"
                  type="color"
                  class="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  v-model="formData.color"
                  type="text"
                  class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  placeholder="#6B7280"
                />
              </div>
            </div>
          </div>

          <!-- 父模块（暂时隐藏，后续版本支持） -->
          <div class="hidden">
            <label for="parentModule" class="block text-sm font-medium text-gray-700 mb-1">
              父模块
            </label>
            <select
              id="parentModule"
              v-model="formData.parentId"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
            >
              <option value="">顶级模块</option>
              <!-- 这里可以添加其他模块作为选项 -->
            </select>
          </div>
        </div>

        <!-- 对话框底部 -->
        <div class="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
          <button
            type="button"
            @click="handleCancel"
            class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            :disabled="loading"
            class="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div v-if="loading" class="flex items-center">
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {{ isEditing ? '更新中...' : '创建中...' }}
            </div>
            <span v-else>{{ isEditing ? '更新' : '创建' }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { createModule, updateModule } from '@/api/module'
import type { Module, CreateModuleParams, UpdateModuleParams } from '@/types/module'

interface Props {
  visible: boolean
  projectId: string
  module?: Module | null
}

interface Emits {
  (e: 'update:visible', visible: boolean): void
  (e: 'saved'): void
  (e: 'cancelled'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 响应式数据
const loading = ref(false)
const formData = ref({
  name: '',
  color: '#6B7280',
  parentId: ''
})

// 预设颜色选项
const presetColors = [
  '#EF4444', // 红色
  '#F97316', // 橙色
  '#F59E0B', // 黄色
  '#84CC16', // 绿色
  '#10B981', // 青色
  '#06B6D4', // 天蓝色
  '#3B82F6', // 蓝色
  '#6366F1', // 靛蓝色
  '#8B5CF6', // 紫色
  '#A855F7', // 紫红色
  '#EC4899', // 粉色
  '#F43F5E', // 玫红色
  '#6B7280', // 灰色（默认）
  '#0EA5E9', // 天蓝色
  '#14B8A6', // 青绿色
  '#22C55E', // 绿色
  '#EAB308', // 金黄色
  '#DC2626', // 深红色
  '#7C3AED', // 深紫色
  '#0891B2', // 深青色
  '#15803D', // 深绿色
]

// 计算属性
const isEditing = computed(() => !!props.module)

// 监听对话框显示状态和模块数据变化
watch(() => props.visible, (visible) => {
  if (visible) {
    if (props.module) {
      // 编辑模式：填充模块数据
      formData.value = {
        name: props.module.name,
        color: props.module.color,
        parentId: props.module.parentId
      }
    } else {
      // 创建模式：重置表单
      resetForm()
    }
  }
})

// 监听模块数据变化（用于编辑时切换不同模块）
watch(() => props.module, (module) => {
  if (module && props.visible) {
    formData.value = {
      name: module.name,
      color: module.color,
      parentId: module.parentId
    }
  }
})

// 重置表单
const resetForm = () => {
  formData.value = {
    name: '',
    color: '#6B7280',
    parentId: ''
  }
}

// 处理提交
const handleSubmit = async () => {
  if (!formData.value.name.trim()) {
    return
  }

  loading.value = true

  try {
    if (isEditing.value && props.module) {
      // 更新模块
      const updateData: UpdateModuleParams = {
        id: props.module._id,
        name: formData.value.name.trim(),
        color: formData.value.color,
        parentId: formData.value.parentId
      }
      await updateModule(updateData)
    } else {
      // 创建模块
      const createData: CreateModuleParams = {
        projectId: props.projectId,
        name: formData.value.name.trim(),
        color: formData.value.color,
        parentId: formData.value.parentId || undefined
      }
      await createModule(createData)
    }

    emit('saved')
  } catch (error) {
    console.error('Failed to save module:', error)
  } finally {
    loading.value = false
  }
}

// 处理取消
const handleCancel = () => {
  emit('cancelled')
}

// 处理背景点击
const handleBackdropClick = () => {
  emit('cancelled')
}
</script>