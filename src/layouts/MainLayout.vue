<script setup lang="ts">
import { ref, provide } from 'vue'
import Sidebar from '@/components/Sidebar.vue'

const sidebarCollapsed = ref(false)
provide('sidebarCollapsed', sidebarCollapsed)
</script>

<template>
  <div class="main-layout">
    <Sidebar @update:collapsed="sidebarCollapsed = $event" />
    <div :class="['main-content', { 'sidebar-collapsed': sidebarCollapsed }]">
      <router-view />
    </div>
  </div>
</template>

<style scoped>
.main-layout {
  display: flex;
  min-height: 100vh;
}

.main-content {
  flex: 1;
  margin-left: 260px;
  background: #ffffff;
  min-height: 100vh;
  transition: margin-left 0.3s ease;
}

.main-content.sidebar-collapsed {
  margin-left: 0;
}
</style>
