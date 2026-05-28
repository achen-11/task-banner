<template>
  <div
    v-if="uiStore.focusEnterHintVisible && uiStore.pageFocusMode"
    class="flex items-center justify-between gap-4 px-6 py-2.5 bg-blue-50 dark:bg-blue-950/40 border-b border-blue-100 dark:border-blue-900/50 text-sm text-blue-900 dark:text-blue-100"
    role="status"
  >
    <div class="flex items-center gap-2 min-w-0">
      <Maximize2 class="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400" />
      <span class="truncate">
        已进入专注模式：点击顶栏「退出专注」、按 <kbd class="px-1 py-0.5 rounded bg-white/80 dark:bg-gray-800 text-xs font-mono">F1</kbd>，或切换列表/其他 Tab 可退出
      </span>
    </div>
    <div class="flex items-center gap-3 shrink-0">
      <button
        type="button"
        class="text-blue-700 dark:text-blue-300 hover:underline text-xs"
        @click="uiStore.dismissFocusHintPermanent()"
      >
        不再提示
      </button>
      <button
        type="button"
        class="p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400"
        aria-label="关闭提示"
        @click="uiStore.hideFocusEnterHint()"
      >
        <X class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Maximize2, X } from 'lucide-vue-next'
import { useUIStore } from '@/stores/ui'

const uiStore = useUIStore()
</script>
