<script setup lang="ts">
import { ref } from 'vue'

const showPanel = ref(false)

// 检测操作系统
const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
const modKey = isMac ? '⌘' : 'Ctrl'
const altKey = isMac ? '⌥' : 'Alt'

// 快捷键分组
const shortcuts = [
  {
    category: '全局',
    items: [
      { keys: [`${modKey}+K`], description: '打开全局搜索' },
      { keys: [`${modKey}+B`], description: '收起/展开侧边栏' },
    ]
  },
  {
    category: '看板视图',
    items: [
      { keys: [`${altKey}+N`], description: '新建任务' },
      { keys: [`${modKey}+E`], description: '导出选中任务' },
      { keys: [`${modKey}+I`], description: '导入任务' },
    ]
  },
  {
    category: '任务编辑',
    items: [
      { keys: [`${modKey}+S`], description: '保存任务' },
      { keys: [`${modKey}+Shift+S`], description: '保存并新建' },
      { keys: [`${modKey}+E`], description: '导出当前任务' },
      { keys: [`${modKey}+Shift+K`], description: '清空表单内容' },
    ]
  },
]

const togglePanel = () => {
  showPanel.value = !showPanel.value
}
</script>

<template>
  <div class="shortcuts-container">
    <!-- 触发按钮 -->
    <button class="shortcuts-trigger" @click="togglePanel">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path>
      </svg>
    </button>

    <!-- 快捷键面板 -->
    <transition name="panel-fade">
      <div v-if="showPanel" class="shortcuts-panel">
        <div class="panel-header">
          <div class="panel-title">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path>
            </svg>
            <span>快捷键</span>
          </div>
          <button class="panel-close" @click="togglePanel">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <div class="panel-content">
          <div
            v-for="group in shortcuts"
            :key="group.category"
            class="shortcut-group"
          >
            <div class="group-title">{{ group.category }}</div>
            <div class="shortcut-list">
              <div
                v-for="(item, index) in group.items"
                :key="index"
                class="shortcut-item"
              >
                <span class="shortcut-description">{{ item.description }}</span>
                <div class="shortcut-keys">
                  <kbd
                    v-for="(key, keyIndex) in item.keys"
                    :key="keyIndex"
                    class="shortcut-key"
                  >
                    {{ key }}
                  </kbd>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- 遮罩层 -->
    <transition name="overlay-fade">
      <div
        v-if="showPanel"
        class="shortcuts-overlay"
        @click="togglePanel"
      ></div>
    </transition>
  </div>
</template>

<style scoped>
.shortcuts-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1000;
}

.shortcuts-trigger {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.shortcuts-trigger:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.5);
}

.shortcuts-trigger:active {
  transform: translateY(-2px);
}

.shortcuts-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 999;
}

.shortcuts-panel {
  position: absolute;
  bottom: 70px;
  right: 0;
  width: 400px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  z-index: 1001;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
}

.panel-close {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.panel-close:hover {
  background: rgba(255, 255, 255, 0.3);
}

.panel-content {
  padding: 20px;
  max-height: 500px;
  overflow-y: auto;
}

.shortcut-group {
  margin-bottom: 24px;
}

.shortcut-group:last-child {
  margin-bottom: 0;
}

.group-title {
  font-size: 13px;
  font-weight: 700;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
  padding-left: 4px;
}

.shortcut-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.shortcut-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.shortcut-item:hover {
  background: #f3f4f6;
}

.shortcut-description {
  font-size: 14px;
  color: #1f2937;
  flex: 1;
}

.shortcut-keys {
  display: flex;
  gap: 4px;
}

.shortcut-key {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 28px;
  padding: 0 8px;
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

/* 动画 */
.panel-fade-enter-active,
.panel-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.panel-fade-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.panel-fade-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.overlay-fade-enter-active,
.overlay-fade-leave-active {
  transition: opacity 0.3s ease;
}

.overlay-fade-enter-from,
.overlay-fade-leave-to {
  opacity: 0;
}

/* 滚动条样式 */
.panel-content::-webkit-scrollbar {
  width: 6px;
}

.panel-content::-webkit-scrollbar-track {
  background: #f9fafb;
  border-radius: 3px;
}

.panel-content::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

.panel-content::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
</style>
