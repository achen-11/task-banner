<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      @click.self="handleClose"
    >
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">选择标签</h2>
          <button
            @click="handleClose"
            class="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Tag List -->
        <div class="flex-1 overflow-y-auto p-6">
          <div v-if="availableTags.length === 0" class="text-center text-gray-400 py-8">
            <p>暂无其他标签</p>
            <p class="text-sm mt-1">可在项目设置中创建标签</p>
          </div>
          <div v-else class="space-y-2">
            <label
              v-for="tag in availableTags"
              :key="tag._id"
              class="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                :value="tag._id"
                :checked="selectedTagIds.includes(tag._id)"
                @change="toggleTag(tag._id)"
                class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div
                class="w-3 h-3 rounded flex-shrink-0"
                :style="{ backgroundColor: tag.color || '#3B82F6' }"
              ></div>
              <div class="flex-1 min-w-0">
                <div class="font-medium text-gray-900">{{ tag.name }}</div>
                <p v-if="tag.prompt" class="text-xs text-gray-500 mt-0.5 truncate">
                  {{ tag.prompt }}
                </p>
              </div>
            </label>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button
            type="button"
            @click="handleClose"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            type="button"
            @click="handleConfirm"
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Tag } from '@/types/tag'

interface Props {
  modelValue: boolean
  tags: Tag[]              // 所有标签列表
  selectedIds: string[]    // 已选中的标签 ID
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm', selectedIds: string[]): void
}>()

// 本地选中状态
const selectedTagIds = ref<string[]>([])

// 可选标签（排除快速访问栏的标签）
const availableTags = computed(() => {
  return props.tags.filter(tag => !tag.showInQuickBar)
})

// 监听弹窗打开，初始化选中状态
watch(() => props.modelValue, (open) => {
  if (open) {
    selectedTagIds.value = [...props.selectedIds]
  }
})

// 切换标签选中状态
const toggleTag = (tagId: string) => {
  const index = selectedTagIds.value.indexOf(tagId)
  if (index > -1) {
    selectedTagIds.value.splice(index, 1)
  } else {
    selectedTagIds.value.push(tagId)
  }
}

const handleClose = () => {
  emit('update:modelValue', false)
}

const handleConfirm = () => {
  emit('confirm', selectedTagIds.value)
  handleClose()
}
</script>
