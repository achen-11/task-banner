<template>
  <aside class="h-full flex flex-col border-l border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/40 w-[220px] flex-shrink-0">
    <div class="flex-shrink-0 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
      <h4 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        计划
      </h4>
    </div>
    <div class="flex-1 overflow-y-auto px-4 py-4 space-y-5">
      <div>
        <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">截止日期</label>
        <el-date-picker
          :model-value="dueDate"
          type="date"
          size="small"
          class="w-full"
          placeholder="选择日期"
          format="YYYY/MM/DD"
          :disabled="readonly"
          @update:model-value="onDueDateChange"
        />
      </div>

      <div v-if="createdAt" class="pt-2 border-t border-gray-200 dark:border-gray-700">
        <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">信息</p>
        <p class="text-xs text-gray-600 dark:text-gray-300">
          创建于 {{ formatDate(createdAt) }}
        </p>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
defineProps<{
  dueDate?: number
  createdAt?: number
  readonly?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:dueDate', value: number | undefined): void
}>()

const onDueDateChange = (value: number | null) => {
  emit('update:dueDate', value || undefined)
}

const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}
</script>
