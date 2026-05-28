<template>
  <Teleport to="body">
    <Transition name="focus-hint">
      <div
        v-if="uiStore.focusEnterHintVisible && uiStore.pageFocusMode"
        class="focus-hint-toast"
        role="status"
        aria-live="polite"
      >
        <span>若要退出专注模式，请按</span>
        <kbd class="focus-hint-key" aria-label="F1">f1</kbd>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { useUIStore } from '@/stores/ui'

const uiStore = useUIStore()
</script>

<style scoped>
.focus-hint-toast {
  position: fixed;
  top: 3.5rem;
  left: 50%;
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.625rem 1rem;
  transform: translateX(-50%);
  font-size: 0.8125rem;
  line-height: 1.25;
  color: #fff;
  white-space: nowrap;
  pointer-events: none;
  background: rgba(60, 64, 67, 0.92);
  border-radius: 0.5rem;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.28),
    0 4px 12px rgba(0, 0, 0, 0.18);
}

.focus-hint-key {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.75rem;
  padding: 0.125rem 0.5rem;
  margin-left: 0.125rem;
  font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1.2;
  color: #fff;
  text-transform: lowercase;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: 0.25rem;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.2);
}

.focus-hint-enter-active {
  transition: opacity 0.35s ease;
}

.focus-hint-leave-active {
  transition: opacity 0.6s ease;
}

.focus-hint-enter-from,
.focus-hint-leave-to {
  opacity: 0;
}
</style>
