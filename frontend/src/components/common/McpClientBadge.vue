<template>
  <div
    class="rounded-lg flex items-center justify-center font-semibold shrink-0 select-none"
    :class="[style.avatarClass, sizeClass]"
    :title="style.label"
  >
    <svg
      v-if="clientId === 'cursor'"
      class="shrink-0"
      :class="iconClass"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M6 4h12v16l-6-4-6 4V4z"
        fill="currentColor"
        opacity="0.95"
      />
    </svg>
    <svg
      v-else-if="clientId === 'codex'"
      class="shrink-0"
      :class="iconClass"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" />
      <path d="M8 12h8M12 8v8" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
    </svg>
    <span v-else :class="textClass">{{ style.initials }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getMcpClientStyle, normalizeMcpClientId } from '@/utils/mcpClient'

const props = withDefaults(
  defineProps<{
    clientId?: string
    size?: 'sm' | 'md'
  }>(),
  {
    clientId: 'ai',
    size: 'md'
  }
)

const clientId = computed(() => normalizeMcpClientId(props.clientId))
const style = computed(() => getMcpClientStyle(clientId.value))

const sizeClass = computed(() =>
  props.size === 'sm' ? 'w-7 h-7 text-[10px]' : 'w-9 h-9 text-xs'
)
const iconClass = computed(() => (props.size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'))
const textClass = computed(() => (props.size === 'sm' ? 'text-[10px]' : 'text-xs'))
</script>
