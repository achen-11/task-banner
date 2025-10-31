<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center"
      @click.self="close"
    >
      <!-- 关闭按钮 -->
      <button
        class="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
        @click="close"
        title="关闭 (Esc)"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <!-- 图片计数器 -->
      <div class="absolute top-4 left-4 text-white text-sm font-medium px-3 py-1.5 bg-white/10 rounded-lg">
        {{ currentIndex + 1 }} / {{ images.length }}
      </div>

      <!-- 图片名称 -->
      <div class="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-4 py-2 rounded-lg max-w-md truncate">
        {{ images[currentIndex]?.name }}
      </div>

      <!-- 左箭头 -->
      <button
        v-if="images.length > 1"
        class="absolute left-4 top-1/2 -translate-y-1/2 p-3 text-white hover:bg-white/10 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        :disabled="currentIndex === 0"
        @click="goToPrev"
        title="上一张 (←)"
      >
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <!-- 右箭头 -->
      <button
        v-if="images.length > 1"
        class="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-white hover:bg-white/10 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        :disabled="currentIndex === images.length - 1"
        @click="goToNext"
        title="下一张 (→)"
      >
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <!-- 图片容器 -->
      <div class="max-w-[90vw] max-h-[90vh] flex items-center justify-center">
        <img
          :src="images[currentIndex]?.url"
          :alt="images[currentIndex]?.name"
          class="max-w-full max-h-full object-contain"
          @click.stop
        />
      </div>

      <!-- 缩放控制（可选，暂时注释） -->
      <!--
      <div class="absolute bottom-4 right-4 flex items-center gap-2 bg-white/10 rounded-lg p-2">
        <button class="p-2 text-white hover:bg-white/10 rounded transition-colors" title="放大">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
          </svg>
        </button>
        <button class="p-2 text-white hover:bg-white/10 rounded transition-colors" title="缩小">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
          </svg>
        </button>
      </div>
      -->
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface Image {
  url: string
  name: string
}

interface Props {
  images: Image[]
  initialIndex?: number
}

const props = withDefaults(defineProps<Props>(), {
  initialIndex: 0
})

const emit = defineEmits<{
  (e: 'close'): void
}>()

const currentIndex = ref(props.initialIndex)

// 导航方法
const goToPrev = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--
  }
}

const goToNext = () => {
  if (currentIndex.value < props.images.length - 1) {
    currentIndex.value++
  }
}

const close = () => {
  emit('close')
}

// 键盘快捷键
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    close()
  } else if (e.key === 'ArrowLeft') {
    goToPrev()
  } else if (e.key === 'ArrowRight') {
    goToNext()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  // 阻止 body 滚动
  document.body.style.overflow = 'hidden'
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  // 恢复 body 滚动
  document.body.style.overflow = ''
})
</script>
