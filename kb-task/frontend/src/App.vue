<template>
  <div class="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-4xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-12">
        <h1 class="text-4xl font-bold text-gray-900 mb-2">
          Tailwind CSS Test Page
        </h1>
        <p class="text-lg text-gray-500">
          Testing Tailwind CSS 3.x integration
        </p>
      </div>

      <!-- Color Palette Test -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 class="text-2xl font-semibold text-gray-900 mb-4">Color Palette (kb-task style)</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="space-y-2">
            <div class="bg-zinc-50 border border-gray-200 h-20 rounded-md"></div>
            <p class="text-sm text-gray-600">bg-zinc-50 (侧边栏)</p>
          </div>
          <div class="space-y-2">
            <div class="bg-gray-50 border border-gray-200 h-20 rounded-md"></div>
            <p class="text-sm text-gray-600">bg-gray-50 (主内容)</p>
          </div>
          <div class="space-y-2">
            <div class="bg-gray-200 border border-gray-200 h-20 rounded-md"></div>
            <p class="text-sm text-gray-600">hover:bg-gray-200</p>
          </div>
          <div class="space-y-2">
            <div class="bg-zinc-200 border border-gray-200 h-20 rounded-md"></div>
            <p class="text-sm text-gray-600">bg-zinc-200 (激活)</p>
          </div>
        </div>
      </div>

      <!-- Buttons Test -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 class="text-2xl font-semibold text-gray-900 mb-4">Buttons</h2>
        <div class="flex flex-wrap gap-4">
          <button class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200">
            Primary Button
          </button>
          <button class="px-4 py-2 bg-gray-200 text-gray-900 rounded-md hover:bg-gray-300 transition-colors duration-200">
            Secondary Button
          </button>
          <button class="px-4 py-2 border border-gray-200 text-gray-700 rounded-md hover:bg-gray-50 transition-colors duration-200">
            Outline Button
          </button>
        </div>
      </div>

      <!-- Card Test -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 class="text-2xl font-semibold text-gray-900 mb-4">Task Card Example</h2>
        <div class="border border-gray-200 rounded-md hover:bg-gray-50 transition-colors duration-200 p-4">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <h3 class="text-lg font-medium text-gray-900">Sample Task Title</h3>
              <p class="text-sm text-gray-500 mt-1">This is a sample task description</p>
            </div>
            <div class="ml-4 flex items-center space-x-2">
              <span class="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded">Todo</span>
              <span class="px-2 py-1 text-xs font-medium text-orange-600 bg-orange-50 rounded">High</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Grid Layout Test -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 class="text-2xl font-semibold text-gray-900 mb-4">Grid Layout (12 columns)</h2>
        <div class="bg-gray-50 border border-gray-200 rounded-md p-3">
          <div class="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 mb-2">
            <div class="col-span-5">Task Name (5 cols)</div>
            <div class="col-span-2">Assignee (2 cols)</div>
            <div class="col-span-2">Due Date (2 cols)</div>
            <div class="col-span-1">Priority (1 col)</div>
            <div class="col-span-2">Status (2 cols)</div>
          </div>
          <div class="grid grid-cols-12 gap-2 border-t border-gray-100 pt-2 hover:bg-gray-50 transition-colors duration-200">
            <div class="col-span-5 text-gray-900">Implement user authentication</div>
            <div class="col-span-2 text-gray-600">John Doe</div>
            <div class="col-span-2 text-gray-600">2025-11-01</div>
            <div class="col-span-1">
              <span class="px-2 py-1 text-xs bg-red-50 text-red-600 rounded">High</span>
            </div>
            <div class="col-span-2">
              <span class="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded">In Progress</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Typography Test -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-2xl font-semibold text-gray-900 mb-4">Typography</h2>
        <div class="space-y-3">
          <p class="text-gray-900 font-bold">Primary Text (text-gray-900)</p>
          <p class="text-gray-500">Secondary Text (text-gray-500)</p>
          <p class="text-gray-400">Disabled Text (text-gray-400)</p>
          <p class="text-xs font-medium text-gray-500">Small Text (text-xs font-medium text-gray-500)</p>
        </div>
      </div>

      <!-- Status -->
      <div class="mt-8 p-4 bg-green-50 border border-green-200 rounded-md">
        <p class="text-green-800 font-medium">
          ✅ Tailwind CSS is working correctly!
        </p>
        <p class="text-green-600 text-sm mt-1">
          API Endpoint: {{ apiUrl }}
        </p>
      </div>

      <!-- User Info & Auth Status -->
      <div class="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-blue-800 font-medium">
              👤 当前用户: {{ currentUser?.displayName || currentUser?.username }}
            </p>
            <p class="text-blue-600 text-sm mt-1">
              Email: {{ currentUser?.email }}
            </p>
            <p class="text-blue-600 text-xs mt-1" v-if="isDev">
              🔧 开发模式: Mock 用户数据
            </p>
          </div>
          <button
            @click="handleLogout"
            class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
          >
            退出登录
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { getCurrentUser, logout, isLogin } from './utils/auth'

const apiUrl = computed(() => {
  return import.meta.env.VITE_API_BASE_URL || 'API URL not configured'
})

const currentUser = ref<any>(null)
const isDev = import.meta.env.DEV

onMounted(() => {
  if (isLogin()) {
    currentUser.value = getCurrentUser()
  }
})

const handleLogout = () => {
  if (confirm('确定要退出登录吗？')) {
    logout()
  }
}
</script>
