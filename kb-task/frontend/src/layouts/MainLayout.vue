<template>
  <div class="flex h-screen bg-gray-50">
    <!-- 侧边栏 -->
    <Sidebar :is-collapsed="sidebarCollapsed" />

    <!-- 主内容区域 -->
    <div class="flex-1 flex flex-col min-h-screen overflow-hidden">
      <!-- Header -->
      <AppHeader @toggle-sidebar="toggleSidebar" />

      <!-- 页面内容 -->
      <main class="flex-1 overflow-auto">
        <div class="w-full px-4 py-4 mx-auto">
          <router-view />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Sidebar from '@/components/Sidebar.vue'
import AppHeader from '@/components/AppHeader.vue'

// 侧边栏收起状态
const sidebarCollapsed = ref(false)

// 切换侧边栏
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}
</script>
