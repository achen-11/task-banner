<template>
  <div class="h-full flex flex-col min-h-0">
    <div class="flex-1 min-h-0 overflow-y-auto pr-1">
      <div v-if="isLoading" class="py-12 text-center text-sm text-gray-400">
        加载中…
      </div>

      <ul v-else-if="changelogItems.length" class="relative space-y-0 pb-4">
        <li
          v-for="(item, index) in changelogItems"
          :key="item.id"
          class="relative flex gap-3 pb-5"
        >
          <div
            v-if="index < changelogItems.length - 1"
            class="absolute left-[15px] top-8 bottom-0 w-px bg-gray-200 dark:bg-gray-600"
          />

          <div
            class="relative z-10 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-gray-800"
            :class="item.type === 'system'
              ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              : 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'"
          >
            <svg v-if="item.type === 'system'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>

          <div
            class="flex-1 min-w-0 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80 px-3.5 py-3 shadow-sm"
          >
            <div class="flex flex-wrap items-center gap-2 mb-2">
              <span
                class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium"
                :class="item.type === 'system'
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  : 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'"
              >
                {{ item.type === 'system' ? '系统' : item.fieldLabel || '字段变更' }}
              </span>
              <span class="text-xs text-gray-400 dark:text-gray-500">
                {{ formatRelativeTime(item.timestamp) }}
              </span>
            </div>

            <template v-if="item.type === 'field_change' && item.oldValue && item.newValue">
              <div class="flex flex-wrap items-center gap-2 text-sm">
                <span
                  class="inline-block max-w-[45%] truncate px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-700/80 text-gray-500 dark:text-gray-400 line-through"
                  :title="item.oldValue"
                >
                  {{ item.oldValue }}
                </span>
                <svg class="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                <span
                  class="inline-block max-w-[45%] truncate px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 font-medium"
                  :title="item.newValue"
                >
                  {{ item.newValue }}
                </span>
              </div>
            </template>
            <p v-else class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {{ item.content }}
            </p>
          </div>
        </li>
      </ul>

      <div v-else class="py-16 text-center">
        <div class="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
          <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p class="text-sm text-gray-500 dark:text-gray-400">暂无变更记录</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { getTaskActivities } from '@/api/task'
import { formatRelativeTime } from '@/utils/time'

interface Task {
  _id: string
}

interface ChangelogItem {
  id: string
  type: 'field_change' | 'system'
  field?: string
  fieldLabel?: string
  oldValue?: string
  newValue?: string
  content: string
  timestamp: number
}

const FIELD_LABELS: Record<string, string> = {
  title: '标题',
  content: '描述',
  status: '状态',
  priority: '优先级',
  assigneeId: '处理人',
  dueDate: '截止日期',
  moduleIds: '模块',
  tagIds: '标签'
}

const props = defineProps<{
  task: Task | null
  sortDescending: boolean
}>()

const emit = defineEmits<{
  (e: 'update:sortDescending', value: boolean): void
}>()

const isLoading = ref(false)
const items = ref<ChangelogItem[]>([])

const loadChangelog = async () => {
  if (!props.task?._id) {
    items.value = []
    return
  }
  isLoading.value = true
  try {
    const data = await getTaskActivities(props.task._id)
    items.value = data
      .filter(a => a.type === 'field_change' || a.type === 'system')
      .map(a => {
        if (a.type === 'field_change') {
          const fieldLabel = a.field ? (FIELD_LABELS[a.field] || a.field) : '字段'
          const oldValue = a.oldValue || ''
          const newValue = a.newValue || ''
          return {
            id: a.id,
            type: 'field_change' as const,
            field: a.field,
            fieldLabel,
            oldValue,
            newValue,
            content: a.summary || `${fieldLabel}已更新`,
            timestamp: a.timestamp
          }
        }
        return {
          id: a.id,
          type: 'system' as const,
          content: a.content || '系统事件',
          timestamp: a.timestamp
        }
      })
  } catch (e) {
    console.error('Failed to load changelog:', e)
    items.value = []
  } finally {
    isLoading.value = false
  }
}

const changelogItems = computed(() =>
  [...items.value].sort((a, b) =>
    props.sortDescending ? b.timestamp - a.timestamp : a.timestamp - b.timestamp
  )
)

watch(() => props.task?._id, () => {
  loadChangelog()
}, { immediate: true })

defineExpose({ reload: loadChangelog })
</script>
