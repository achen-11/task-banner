<template>
  <div
    class="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm"
  >
    <div
      v-for="(group, index) in groups"
      :key="group.key"
      class="flex flex-wrap items-center gap-2"
    >
      <span
        v-if="index > 0"
        class="hidden sm:block w-px h-4 bg-gray-200 dark:bg-gray-600 mr-1"
        aria-hidden="true"
      />
      <span class="text-xs text-gray-500 dark:text-gray-400 shrink-0">{{ group.label }}</span>
      <button
        v-for="option in group.options"
        :key="option.value"
        type="button"
        class="px-3 py-1 text-sm rounded-full transition-colors"
        :class="modelValue[group.modelKey] === option.value
          ? 'bg-[#3762E3] text-white'
          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'"
        @click="emit('update', group.modelKey, option.value)"
      >
        {{ option.label }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
export interface FilterGroupOption {
  value: string
  label: string
}

export interface FilterGroupConfig {
  key: string
  label: string
  modelKey: 'read' | 'type' | 'source'
  options: FilterGroupOption[]
}

defineProps<{
  groups: FilterGroupConfig[]
  modelValue: {
    read: string
    type: string
    source: string
  }
}>()

const emit = defineEmits<{
  update: [key: 'read' | 'type' | 'source', value: string]
}>()
</script>
