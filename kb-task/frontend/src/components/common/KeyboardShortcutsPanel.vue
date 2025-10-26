<template>
  <el-dialog
    v-model="visible"
    title="快捷键说明"
    width="600px"
    align-center
    :append-to-body="true"
  >
    <div class="shortcuts-panel">
      <!-- 按类别分组 -->
      <div v-for="(group, category) in groupedShortcuts" :key="category" class="shortcut-category">
        <h3 class="category-title">{{ category }}</h3>
        <div class="shortcuts-list">
          <div
            v-for="(shortcut, index) in group"
            :key="index"
            class="shortcut-item"
          >
            <span class="shortcut-description">{{ shortcut.description }}</span>
            <kbd class="shortcut-keys">{{ formatShortcut(shortcut) }}</kbd>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, defineExpose } from 'vue'
import { shortcuts, formatShortcut, type KeyboardShortcut } from '@/composables/useKeyboard'

const visible = ref(false)

// 按类别分组
const groupedShortcuts = computed(() => {
  const groups: Record<string, KeyboardShortcut[]> = {}

  shortcuts.forEach(shortcut => {
    const category = shortcut.category || '其他'
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(shortcut)
  })

  return groups
})

// 显示/隐藏面板
const show = () => {
  visible.value = true
}

const hide = () => {
  visible.value = false
}

const toggle = () => {
  visible.value = !visible.value
}

defineExpose({
  show,
  hide,
  toggle
})
</script>

<style scoped>
.shortcuts-panel {
  max-height: 500px;
  overflow-y: auto;
}

.shortcut-category {
  margin-bottom: 24px;
}

.shortcut-category:last-child {
  margin-bottom: 0;
}

.category-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 12px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #e4e7ed;
}

.shortcuts-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.shortcut-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.shortcut-item:hover {
  background: #e9ecef;
}

.shortcut-description {
  font-size: 13px;
  color: #606266;
}

.shortcut-keys {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: #ffffff;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-family: 'SF Mono', 'Monaco', 'Menlo', monospace;
  font-size: 12px;
  color: #409eff;
  font-weight: 500;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}
</style>
