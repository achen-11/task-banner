<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useProjectStore } from '@/stores/project'
import { computed } from 'vue'

const router = useRouter()
const projectStore = useProjectStore()

const projectCount = computed(() => projectStore.projects.length)
const activeProjectCount = computed(() => projectStore.activeProjects.length)

const goToProjects = () => {
  router.push('/projects')
}
</script>

<template>
  <div class="min-h-screen home-container">
    <div class="container mx-auto px-4 py-16">
      <div class="text-center mb-16 hero-section">
        <div class="mb-6">
          <div class="inline-block p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-xl transform hover:scale-105 transition-transform">
            <svg class="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
            </svg>
          </div>
        </div>
        <h1 class="text-6xl font-extrabold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Task Banner
        </h1>
        <p class="text-xl text-gray-600 max-w-2xl mx-auto">
          现代化任务管理看板系统 · 让 AI 成为你的开发助手
        </p>
      </div>

      <div class="max-w-5xl mx-auto">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div class="stat-card">
            <div class="stat-icon bg-gradient-to-br from-blue-500 to-blue-600">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
              </svg>
            </div>
            <div class="stat-content">
              <div class="text-4xl font-bold text-gray-900 mb-1">{{ projectCount }}</div>
              <div class="text-sm text-gray-500">项目总数</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon bg-gradient-to-br from-green-500 to-green-600">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
            </div>
            <div class="stat-content">
              <div class="text-4xl font-bold text-gray-900 mb-1">{{ activeProjectCount }}</div>
              <div class="text-sm text-gray-500">进行中</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon bg-gradient-to-br from-purple-500 to-purple-600">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"></path>
              </svg>
            </div>
            <div class="stat-content">
              <div class="text-4xl font-bold text-gray-900 mb-1">0</div>
              <div class="text-sm text-gray-500">已导出</div>
            </div>
          </div>
        </div>

        <div class="action-card">
          <div class="mb-6">
            <h2 class="text-3xl font-bold text-gray-900 mb-3">开始你的任务管理之旅</h2>
            <p class="text-gray-600 text-lg">
              创建项目 → 添加任务 → 导出需求 → 让 AI 帮你完成
            </p>
          </div>
          <el-button
            type="primary"
            size="large"
            class="cta-button"
            @click="goToProjects"
          >
            <span class="flex items-center gap-2">
              <span>查看我的项目</span>
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
              </svg>
            </span>
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-container {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  background-attachment: fixed;
  position: relative;
}

.home-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.95) 100%);
}

.home-container > * {
  position: relative;
  z-index: 1;
}

.hero-section {
  animation: fadeInUp 0.8s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.stat-content {
  flex: 1;
}

.action-card {
  background: white;
  border-radius: 20px;
  padding: 48px;
  text-align: center;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.cta-button {
  height: 48px;
  padding: 0 32px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  transition: all 0.3s ease;
}

.cta-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(102, 126, 234, 0.4);
}
</style>
