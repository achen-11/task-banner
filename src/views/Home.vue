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
  <div class="min-h-screen bg-gray-50">
    <div class="container mx-auto px-4 py-12">
      <div class="text-center mb-12">
        <h1 class="text-5xl font-bold text-gray-900 mb-4">Task Banner</h1>
        <p class="text-xl text-gray-600">
          任务管理看板系统 - 优化你的 AI 工作流
        </p>
      </div>

      <div class="max-w-4xl mx-auto">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div class="bg-white rounded-lg shadow-sm p-6">
            <div class="text-3xl font-bold text-blue-600 mb-2">{{ projectCount }}</div>
            <div class="text-gray-600">项目总数</div>
          </div>
          <div class="bg-white rounded-lg shadow-sm p-6">
            <div class="text-3xl font-bold text-green-600 mb-2">{{ activeProjectCount }}</div>
            <div class="text-gray-600">进行中</div>
          </div>
          <div class="bg-white rounded-lg shadow-sm p-6">
            <div class="text-3xl font-bold text-purple-600 mb-2">0</div>
            <div class="text-gray-600">已导出</div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-sm p-8 text-center">
          <h2 class="text-2xl font-semibold text-gray-900 mb-4">快速开始</h2>
          <p class="text-gray-600 mb-6">
            创建项目，管理任务，一键导出为 Markdown 格式
          </p>
          <el-button type="primary" size="large" @click="goToProjects">
            查看项目
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>
