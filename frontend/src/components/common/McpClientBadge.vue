<template>
  <div
    class="rounded-lg flex items-center justify-center overflow-hidden shrink-0 select-none"
    :class="[sizeClass, !iconOk ? style.avatarClass : 'bg-white dark:bg-gray-800']"
    :title="style.label"
  >
    <img
      v-show="iconOk"
      :src="iconUrl"
      :alt="style.label"
      class="w-full h-full object-contain p-0.5"
      @load="iconOk = true"
      @error="onIconError"
    />
    <span v-if="!iconOk" class="font-semibold" :class="textClass">{{ style.initials }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { getMcpClientIconUrl } from '@/config/mcpClientIcons'
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
const iconUrl = computed(() => getMcpClientIconUrl(clientId.value))
const iconOk = ref(false)

watch(iconUrl, () => {
  iconOk.value = false
})

const onIconError = () => {
  iconOk.value = false
}

const sizeClass = computed(() =>
  props.size === 'sm' ? 'w-7 h-7' : 'w-9 h-9'
)
const textClass = computed(() => (props.size === 'sm' ? 'text-[10px]' : 'text-xs'))
</script>
