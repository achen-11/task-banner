<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectStore } from '@/stores/project'

const router = useRouter()
const projectStore = useProjectStore()

const isCollapsed = ref(false) // 侧边栏是否收起

const emit = defineEmits<{
  (e: 'update:collapsed', value: boolean): void
}>()

// 监听收起状态变化并通知父组件
watch(isCollapsed, (newValue) => {
  emit('update:collapsed', newValue)
})

// 快捷键处理
function handleKeyDown(event: KeyboardEvent) {
  // Cmd+B (Mac) 或 Ctrl+B (Windows/Linux)
  if ((event.metaKey || event.ctrlKey) && event.key === 'b') {
    event.preventDefault()
    isCollapsed.value = !isCollapsed.value
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <div :class="['sidebar', { 'sidebar-collapsed': isCollapsed }]">
    <!-- 收起/展开按钮 -->
    <button class="collapse-button" @click="isCollapsed = !isCollapsed">
      <svg v-if="!isCollapsed" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"></path>
      </svg>
      <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"></path>
      </svg>
    </button>

    <!-- 顶部 -->
    <div class="sidebar-header" v-if="!isCollapsed">
      <div class="company-info">
        <div class="company-logo">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
          </svg>
        </div>
        <div class="company-text">
          <div class="company-name">Task Banner</div>
          <div class="company-subtitle">看板系统</div>
        </div>
      </div>
      <button class="icon-button">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </button>
    </div>

    <!-- 主导航区域 -->
    <div class="sidebar-nav" v-if="!isCollapsed">
      <!-- Platform 区域 -->
      <div class="nav-section">
        <div class="nav-section-header">
          <span class="nav-section-title">Platform</span>
        </div>
        <div class="nav-items">
          <router-link to="/" class="nav-item">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
            </svg>
            <span>主页</span>
          </router-link>

          <router-link to="/projects" class="nav-item">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
            </svg>
            <span>项目列表</span>
          </router-link>

          <router-link to="/data-management" class="nav-item">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path>
            </svg>
            <span>数据管理</span>
          </router-link>
        </div>
      </div>

      <!-- Projects 区域 -->
      <div class="nav-section">
        <div class="nav-section-header">
          <span class="nav-section-title">Projects</span>
        </div>
        <div class="nav-items">
          <div
            v-for="project in projectStore.projects.slice(0, 5)"
            :key="project.id"
            class="nav-item"
            @click="router.push(`/board/${project.id}`)"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <span>{{ project.name }}</span>
          </div>

          <div v-if="projectStore.projects.length > 5" class="nav-item">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"></path>
            </svg>
            <span>更多</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部用户信息 -->
    <div class="sidebar-footer" v-if="!isCollapsed">
      <div class="user-info">
        <div class="user-avatar">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
          </svg>
        </div>
        <div class="user-text">
          <div class="user-name">用户</div>
          <div class="user-email">user@example.com</div>
        </div>
      </div>
      <button class="icon-button">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.sidebar {
  width: 260px;
  height: 100vh;
  background: #f7f7f5;
  border-right: 1px solid #e5e5e5;
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0;
  top: 0;
  transition: width 0.3s ease;
}

.sidebar-collapsed {
  width: 0;
  border-right: none;
}

.sidebar:not(.sidebar-collapsed) .collapse-button {
  position: absolute;
  top: 16px;
  right: -12px;
  width: 24px;
  height: 24px;
  background: white;
  border: 1px solid #e5e5e5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 1000;
  transition: all 0.3s ease;
  color: #6b6b6b;
}

.sidebar.sidebar-collapsed .collapse-button {
  position: fixed;
  top: 16px;
  left: 12px;
  width: 24px;
  height: 24px;
  background: white;
  border: 1px solid #e5e5e5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 1000;
  transition: all 0.3s ease;
  color: #6b6b6b;
}

.collapse-button:hover {
  background: #f7f7f5;
  color: #1a1a1a;
  transform: scale(1.1);
}

.sidebar-header {
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e5e5e5;
}

.company-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.company-logo {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.company-text {
  flex: 1;
  min-width: 0;
}

.company-name {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
  line-height: 1.2;
}

.company-subtitle {
  font-size: 12px;
  color: #6b6b6b;
  line-height: 1.2;
}

.icon-button {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  color: #6b6b6b;
  border-radius: 4px;
  transition: all 0.2s;
}

.icon-button:hover {
  background: #e5e5e5;
  color: #1a1a1a;
}

.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.nav-section {
  margin-bottom: 20px;
}

.nav-section-header {
  padding: 4px 16px;
  margin-bottom: 4px;
}

.nav-section-title {
  font-size: 12px;
  font-weight: 600;
  color: #6b6b6b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.nav-items {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 16px;
  margin: 0 8px;
  border-radius: 6px;
  font-size: 14px;
  color: #3a3a3a;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
}

.nav-item:hover {
  background: #e8e8e8;
  color: #1a1a1a;
}

.nav-item.router-link-active {
  background: #e0e0e0;
  color: #1a1a1a;
  font-weight: 500;
}

.sidebar-footer {
  padding: 12px 16px;
  border-top: 1px solid #e5e5e5;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.user-avatar {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-text {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 13px;
  font-weight: 500;
  color: #1a1a1a;
  line-height: 1.2;
}

.user-email {
  font-size: 12px;
  color: #6b6b6b;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
