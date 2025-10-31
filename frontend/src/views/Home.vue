<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
    <!-- 头部欢迎区域 -->
    <div class="px-8 py-12">
      <div class="max-w-7xl mx-auto">
        <div class="flex items-center justify-between mb-8">
          <div>
            <h1 class="text-4xl font-bold text-gray-900 mb-2">
              欢迎回来！ 👋
            </h1>
            <p class="text-lg text-gray-600">
              {{ getGreeting() }}，让我们继续今天的工作吧
            </p>
          </div>
          <div class="text-right">
            <div class="text-2xl font-semibold text-gray-900">{{ currentDate }}</div>
            <div class="text-sm text-gray-500">{{ currentTime }}</div>
          </div>
        </div>

        <!-- 核心统计卡片 -->
        <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div v-for="i in 4" :key="i" class="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 animate-pulse">
            <div class="h-4 bg-gray-200 rounded w-20 mb-4"></div>
            <div class="h-8 bg-gray-200 rounded w-16 mb-2"></div>
            <div class="h-4 bg-gray-200 rounded w-24"></div>
          </div>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div class="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 p-6 border border-gray-100">
            <div class="flex items-center justify-between mb-4">
              <div class="p-3 bg-blue-100 rounded-xl">
                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <span class="text-sm font-medium text-gray-500">总任务</span>
            </div>
            <div class="text-3xl font-bold text-gray-900 mb-1">{{ stats.totalTasks }}</div>
            <div class="flex items-center text-sm">
              <svg class="w-4 h-4 text-green-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span class="text-green-600">+{{ stats.weeklyCompleted }} 本周</span>
            </div>
          </div>

          <div class="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 p-6 border border-gray-100">
            <div class="flex items-center justify-between mb-4">
              <div class="p-3 bg-yellow-100 rounded-xl">
                <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span class="text-sm font-medium text-gray-500">进行中</span>
            </div>
            <div class="text-3xl font-bold text-gray-900 mb-1">{{ stats.inProgressTasks }}</div>
            <div class="text-sm text-gray-500">需要您的关注</div>
          </div>

          <div class="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 p-6 border border-gray-100">
            <div class="flex items-center justify-between mb-4">
              <div class="p-3 bg-green-100 rounded-xl">
                <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span class="text-sm font-medium text-gray-500">已完成</span>
            </div>
            <div class="text-3xl font-bold text-gray-900 mb-1">{{ stats.completedTasks }}</div>
            <div class="text-sm text-gray-500">本周完成 {{ stats.weeklyCompleted }} 个</div>
          </div>

          <div class="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 p-6 border border-gray-100">
            <div class="flex items-center justify-between mb-4">
              <div class="p-3 bg-purple-100 rounded-xl">
                <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <span class="text-sm font-medium text-gray-500">完成率</span>
            </div>
            <div class="text-3xl font-bold text-gray-900 mb-1">{{ completionRate }}%</div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div class="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all duration-300" :style="{ width: `${completionRate}%` }"></div>
            </div>
          </div>
        </div>

        <!-- 图表和项目区域 -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <!-- 任务趋势图表 -->
          <div class="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                任务趋势
              </h2>
              <div class="flex gap-2">
                <button @click="updateChartPeriod('week')" :class="['px-3 py-1 text-sm rounded-lg transition-colors', chartPeriod === 'week' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700']">
                  本周
                </button>
                <button @click="updateChartPeriod('month')" :class="['px-3 py-1 text-sm rounded-lg transition-colors', chartPeriod === 'month' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700']">
                  本月
                </button>
              </div>
            </div>
            <div id="trendChart" class="h-80"></div>
          </div>

          <!-- 快捷操作面板 -->
          <div class="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h2 class="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              快捷操作
            </h2>
            <div class="grid grid-cols-2 gap-4">
              <router-link to="/projects" class="group p-4 bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 rounded-xl transition-all duration-300 block">
                <svg class="w-8 h-8 text-green-600 mb-3 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <div class="text-sm font-medium text-green-900">创建项目</div>
              </router-link>

              <button @click="$router.push('/projects?showCreateTask=true')" class="group p-4 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-xl transition-all duration-300">
                <svg class="w-8 h-8 text-blue-600 mb-3 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                <div class="text-sm font-medium text-blue-900">快速任务</div>
              </button>

              <router-link to="/tasks" class="group p-4 bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 rounded-xl transition-all duration-300 block">
                <svg class="w-8 h-8 text-purple-600 mb-3 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <div class="text-sm font-medium text-purple-900">搜索任务</div>
              </router-link>

              <router-link to="/reports" class="group p-4 bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 rounded-xl transition-all duration-300 block">
                <svg class="w-8 h-8 text-orange-600 mb-3 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <div class="text-sm font-medium text-orange-900">数据报表</div>
              </router-link>
            </div>
          </div>
        </div>

        <!-- 项目展示区域 -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- 最近访问的项目 -->
          <div class="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                最近项目
              </h2>
              <router-link to="/projects" class="text-sm text-blue-600 hover:text-blue-700">
                查看全部 →
              </router-link>
            </div>
            <div v-if="loading" class="space-y-3">
              <div v-for="i in 4" :key="i" class="flex items-center justify-between p-4 bg-gray-50 rounded-xl animate-pulse">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-gray-200 rounded-xl"></div>
                  <div>
                    <div class="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                    <div class="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
                <div class="w-20 h-4 bg-gray-200 rounded"></div>
              </div>
            </div>
            <div v-else class="space-y-3">
              <router-link
                v-for="project in dashboardData?.recentProjects"
                :key="project._id"
                :to="`/projects/${project._id}`"
                class="group flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all duration-200"
              >
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl flex items-center justify-center text-white font-semibold shadow-sm" :style="{ backgroundColor: project.color }">
                    {{ project.name.charAt(0) }}
                  </div>
                  <div>
                    <h3 class="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">{{ project.name }}</h3>
                    <p class="text-sm text-gray-500">{{ project.taskCount }} 个任务</p>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <div class="text-right">
                    <div class="text-sm font-medium text-gray-900">
                      {{ project.taskCount > 0 ? Math.round((project.completedTaskCount / project.taskCount) * 100) : 0 }}%
                    </div>
                    <div class="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div class="h-full bg-green-500 rounded-full transition-all duration-300"
                           :style="{ width: `${project.taskCount > 0 ? (project.completedTaskCount / project.taskCount) * 100 : 0}%` }"></div>
                    </div>
                  </div>
                  <svg class="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </router-link>
            </div>
          </div>

          <!-- 今日待办 -->
          <div class="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                今日待办
              </h2>
              <span class="text-sm text-gray-500">{{ dashboardData?.todayTasks?.length || 0 }} 项任务</span>
            </div>
            <div v-if="loading" class="space-y-3">
              <div v-for="i in 4" :key="i" class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg animate-pulse">
                <div class="w-2 h-2 bg-gray-200 rounded-full"></div>
                <div class="flex-1">
                  <div class="h-4 bg-gray-200 rounded w-48 mb-2"></div>
                  <div class="h-3 bg-gray-200 rounded w-24"></div>
                </div>
                <div class="px-2 py-1 h-4 bg-gray-200 rounded"></div>
              </div>
            </div>
            <div v-else class="space-y-3">
              <div
                v-for="task in dashboardData?.todayTasks"
                :key="task._id"
                class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                @click="$router.push(`/projects/${task.projectId}`)"
              >
                <div class="w-2 h-2 rounded-full" :class="getPriorityClass(task.priority)"></div>
                <div class="flex-1">
                  <h4 class="font-medium text-gray-900 text-sm">{{ task.title }}</h4>
                  <div class="flex items-center gap-2 mt-1">
                    <span class="text-xs text-gray-500">{{ task.projectName }}</span>
                    <span class="text-xs text-gray-400">•</span>
                    <span class="text-xs text-gray-500">
                      {{ task.dueDate ? formatTime(task.dueDate) : '无截止时间' }}
                    </span>
                  </div>
                </div>
                <div class="px-2 py-1 text-xs rounded-full" :class="getStatusClass(task.status)">
                  {{ getStatusText(task.status) }}
                </div>
              </div>
              <div v-if="!dashboardData?.todayTasks?.length" class="text-center py-8 text-gray-500">
                <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p>今天没有待办任务</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { getDashboardData, type DashboardData } from '@/api/dashboard'

// 响应式数据
const dashboardData = ref<DashboardData | null>(null)
const loading = ref(true)
const chartPeriod = ref<'week' | 'month'>('week')
const currentTime = ref('')
const currentDate = ref('')
let timeTimer: number | null = null

// 计算属性
const stats = computed(() => {
  if (!dashboardData.value) {
    return {
      totalTasks: 0,
      todoTasks: 0,
      inProgressTasks: 0,
      completedTasks: 0,
      weeklyCompleted: 0
    }
  }
  return dashboardData.value.stats
})

const completionRate = computed(() => {
  if (!dashboardData.value) return 0
  const total = stats.value.totalTasks
  if (total === 0) return 0
  return Math.round((stats.value.completedTasks / total) * 100)
})

// 更新时间的函数
const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
  currentDate.value = now.toLocaleDateString('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })
}

// 方法
const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return '早上好'
  if (hour < 18) return '下午好'
  return '晚上好'
}

const getPriorityClass = (priority: string) => {
  switch (priority) {
    case 'high': return 'bg-red-500'
    case 'medium': return 'bg-yellow-500'
    case 'low': return 'bg-green-500'
    default: return 'bg-gray-500'
  }
}

const getStatusClass = (status: string) => {
  switch (status) {
    case 'in_progress': return 'bg-blue-100 text-blue-700'
    case 'todo': return 'bg-gray-100 text-gray-700'
    case 'completed': return 'bg-green-100 text-green-700'
    default: return 'bg-gray-100 text-gray-700'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'in_progress': return '进行中'
    case 'todo': return '待办'
    case 'completed': return '已完成'
    default: return status
  }
}

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 加载仪表板数据
const loadDashboardData = async () => {
  try {
    loading.value = true
    const data = await getDashboardData(chartPeriod.value)
    dashboardData.value = data

    // 更新图表数据
    nextTick(() => {
      initTrendChart()
    })
  } catch (error) {
    console.error('Failed to load dashboard data:', error)
    // 使用模拟数据作为降级方案
    dashboardData.value = {
      stats: {
        totalTasks: 45,
        todoTasks: 12,
        inProgressTasks: 5,
        completedTasks: 28,
        weeklyCompleted: 15,
        totalProjects: 6,
        activeProjects: 4
      },
      taskTrends: chartPeriod.value === 'week'
        ? [
            { date: '周一', created: 8, completed: 5 },
            { date: '周二', created: 12, completed: 8 },
            { date: '周三', created: 10, completed: 7 },
            { date: '周四', created: 15, completed: 12 },
            { date: '周五', created: 9, completed: 6 },
            { date: '周六', created: 11, completed: 9 },
            { date: '周日', created: 13, completed: 10 }
          ]
        : [
            { date: '第1周', created: 45, completed: 32 },
            { date: '第2周', created: 52, completed: 38 },
            { date: '第3周', created: 48, completed: 35 },
            { date: '第4周', created: 58, completed: 42 }
          ],
      recentProjects: [
        { _id: '1', name: 'TaskFlow 开发', color: '#6366f1', taskCount: 15, completedTaskCount: 11, status: 'active', updatedAt: Date.now() },
        { _id: '2', name: '个人学习计划', color: '#10b981', taskCount: 8, completedTaskCount: 4, status: 'active', updatedAt: Date.now() },
        { _id: '3', name: '产品设计文档', color: '#f59e0b', taskCount: 12, completedTaskCount: 11, status: 'active', updatedAt: Date.now() },
        { _id: '4', name: '市场营销策略', color: '#ef4444', taskCount: 6, completedTaskCount: 2, status: 'active', updatedAt: Date.now() }
      ],
      todayTasks: [
        { _id: '1', title: '完成项目概览页面设计', projectName: 'TaskFlow 开发', projectId: '1', priority: 'high', status: 'in_progress', dueDate: Date.now() + 3600000, createdAt: Date.now() },
        { _id: '2', title: '团队周会', projectName: '团队管理', projectId: '2', priority: 'medium', status: 'todo', dueDate: Date.now() + 18000000, createdAt: Date.now() },
        { _id: '3', title: '代码审查', projectName: 'TaskFlow 开发', projectId: '1', priority: 'low', status: 'todo', dueDate: Date.now() + 28800000, createdAt: Date.now() },
        { _id: '4', title: '更新项目文档', projectName: '产品设计文档', projectId: '3', priority: 'medium', status: 'todo', dueDate: Date.now() + 32400000, createdAt: Date.now() }
      ]
    }
  } finally {
    loading.value = false
  }
}

let trendChart: echarts.ECharts | null = null
let resizeObserver: ResizeObserver | null = null

const initTrendChart = () => {
  const chartEl = document.getElementById('trendChart')
  if (!chartEl || !dashboardData.value?.taskTrends) return

  if (trendChart) {
    trendChart.dispose()
  }

  trendChart = echarts.init(chartEl)

  const trends = dashboardData.value.taskTrends
  const dates = trends.map(item => item.date)
  const createdData = trends.map(item => item.created)
  const completedData = trends.map(item => item.completed)

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    legend: {
      data: ['新建任务', '完成任务'],
      bottom: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates,
      axisLine: {
        lineStyle: {
          color: '#e5e7eb'
        }
      },
      axisLabel: {
        color: '#6b7280'
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        lineStyle: {
          color: '#e5e7eb'
        }
      },
      axisLabel: {
        color: '#6b7280'
      },
      splitLine: {
        lineStyle: {
          color: '#f3f4f6'
        }
      }
    },
    series: [
      {
        name: '新建任务',
        type: 'line',
        smooth: true,
        data: createdData,
        itemStyle: {
          color: '#3b82f6'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0.05)' }
            ]
          }
        }
      },
      {
        name: '完成任务',
        type: 'line',
        smooth: true,
        data: completedData,
        itemStyle: {
          color: '#10b981'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(16, 185, 129, 0.3)' },
              { offset: 1, color: 'rgba(16, 185, 129, 0.05)' }
            ]
          }
        }
      }
    ]
  }

  trendChart.setOption(option)

  // 设置 ResizeObserver 监听容器尺寸变化
  if (resizeObserver) {
    resizeObserver.disconnect()
  }

  resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      if (entry.target === chartEl && trendChart) {
        // 使用 requestAnimationFrame 确保在下一个渲染帧重绘
        requestAnimationFrame(() => {
          trendChart?.resize()
        })
      }
    }
  })

  resizeObserver.observe(chartEl)
}

const updateChartPeriod = async (period: 'week' | 'month') => {
  chartPeriod.value = period
  await loadDashboardData()
}

const resizeChart = () => {
  trendChart?.resize()
}

onMounted(async () => {
  // 初始化时间
  updateTime()
  timeTimer = setInterval(updateTime, 1000)

  // 加载数据
  await loadDashboardData()

  // 窗口大小变化监听
  window.addEventListener('resize', resizeChart)
})

onUnmounted(() => {
  if (timeTimer) {
    clearInterval(timeTimer)
    timeTimer = null
  }
  window.removeEventListener('resize', resizeChart)
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
  if (trendChart) {
    trendChart.dispose()
    trendChart = null
  }
})
</script>