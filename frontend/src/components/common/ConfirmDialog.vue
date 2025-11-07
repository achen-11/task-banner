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
        <h3 class="text-lg font-semibold text-gray-900">{{ title }}</h3>
      </div>

      <!-- 对话框内容 -->
      <div class="px-6 py-4">
        <p class="text-gray-700">{{ message }}</p>
      </div>

      <!-- 对话框底部 -->
      <div class="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
        <button
          type="button"
          @click="handleCancel"
          class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          {{ cancelText }}
        </button>
        <button
          type="button"
          @click="handleConfirm"
          :class="confirmClass"
          class="px-4 py-2 text-white rounded-lg transition-colors"
        >
          {{ confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  visible: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  confirmClass?: string
}

interface Emits {
  (e: 'update:visible', visible: boolean): void
  (e: 'confirmed'): void
  (e: 'cancelled'): void
}

const props = withDefaults(defineProps<Props>(), {
  confirmText: '确认',
  cancelText: '取消',
  confirmClass: 'bg-blue-600 hover:bg-blue-700'
})

const emit = defineEmits<Emits>()

// 处理确认
const handleConfirm = () => {
  emit('confirmed')
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