<template>
  <div class="flex h-screen bg-gray-50">
    <!-- 侧边栏 -->
    <Sidebar :is-collapsed="uiStore.sidebarCollapsed" />

    <!-- 主内容区域 -->
    <div class="flex-1 flex flex-col min-h-screen overflow-hidden">
      <!-- Header -->
      <AppHeader @toggle-sidebar="toggleSidebar" />

      <!-- 页面内容 -->
      <main class="flex-1 overflow-auto">
        <div class="w-full px-4 py-4 mx-auto h-full">
          <router-view />
        </div>
      </main>
    </div>

    <!-- 快捷键说明面板 -->
    <KeyboardShortcutsPanel ref="shortcutsPanelRef" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Sidebar from '@/components/Sidebar.vue'
import AppHeader from '@/components/AppHeader.vue'
import KeyboardShortcutsPanel from '@/components/common/KeyboardShortcutsPanel.vue'
import { useKeyboard, registerShortcut } from '@/composables/useKeyboard'
import { useUIStore } from '@/stores/ui'

// UI状态管理
const uiStore = useUIStore()

// 快捷键面板引用
const shortcutsPanelRef = ref<InstanceType<typeof KeyboardShortcutsPanel> | null>(null)

// 切换侧边栏
const toggleSidebar = () => {
  uiStore.toggleSidebar()
}

// 初始化快捷键系统
useKeyboard()

// 注册全局快捷键
onMounted(() => {
  // Cmd/Ctrl + B: 切换侧边栏
  registerShortcut({
    key: 'b',
    meta: true,
    description: '展开/收起左侧菜单栏',
    category: '导航',
    handler: toggleSidebar
  })

  // Cmd/Ctrl + Shift + .: 查看快捷键说明
  registerShortcut({
    key: '.',
    meta: true,
    shift: true,
    description: '查看快捷键说明',
    category: '帮助',
    handler: () => {
      shortcutsPanelRef.value?.toggle()
    }
  })
})
</script>
