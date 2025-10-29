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
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div class="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 p-6 border border-gray-100">
            <div class="flex items-center justify-between mb-4">
              <div class="p-3 bg-blue-100 rounded-xl">
                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <span class="text-sm font-medium text-gray-500">总任务</span>
            </div>
            <div class="text-3xl font-bold text-gray-900 mb-1">{{ stats.todo + stats.inProgress + stats.completed }}</div>
            <div class="flex items-center text-sm">
              <svg class="w-4 h-4 text-green-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span class="text-green-600">+12% 本周</span>
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
            <div class="text-3xl font-bold text-gray-900 mb-1">{{ stats.inProgress }}</div>
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
            <div class="text-3xl font-bold text-gray-900 mb-1">{{ stats.completed }}</div>
            <div class="text-sm text-gray-500">本周完成 {{ weeklyCompleted }} 个</div>
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
              <button class="group p-4 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-xl transition-all duration-300">
                <svg class="w-8 h-8 text-blue-600 mb-3 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                <div class="text-sm font-medium text-blue-900">创建任务</div>
              </button>

              <button class="group p-4 bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 rounded-xl transition-all duration-300">
                <svg class="w-8 h-8 text-green-600 mb-3 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <div class="text-sm font-medium text-green-900">创建项目</div>
              </button>

              <button class="group p-4 bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 rounded-xl transition-all duration-300">
                <svg class="w-8 h-8 text-purple-600 mb-3 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <div class="text-sm font-medium text-purple-900">搜索任务</div>
              </button>

              <button class="group p-4 bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 rounded-xl transition-all duration-300">
                <svg class="w-8 h-8 text-orange-600 mb-3 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                <div class="text-sm font-medium text-orange-900">筛选任务</div>
              </button>
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
            <div class="space-y-3">
              <router-link
                v-for="project in recentProjects"
                :key="project.id"
                :to="`/projects/${project.id}`"
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
                    <div class="text-sm font-medium text-gray-900">{{ project.completionRate }}%</div>
                    <div class="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div class="h-full bg-green-500 rounded-full transition-all duration-300" :style="{ width: `${project.completionRate}%` }"></div>
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
              <span class="text-sm text-gray-500">{{ todayTasks.length }} 项任务</span>
            </div>
            <div class="space-y-3">
              <div
                v-for="task in todayTasks"
                :key="task.id"
                class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
              >
                <div class="w-2 h-2 rounded-full" :class="getPriorityClass(task.priority)"></div>
                <div class="flex-1">
                  <h4 class="font-medium text-gray-900 text-sm">{{ task.title }}</h4>
                  <div class="flex items-center gap-2 mt-1">
                    <span class="text-xs text-gray-500">{{ task.project }}</span>
                    <span class="text-xs text-gray-400">•</span>
                    <span class="text-xs text-gray-500">{{ task.time }}</span>
                  </div>
                </div>
                <div class="px-2 py-1 text-xs rounded-full" :class="getStatusClass(task.status)">
                  {{ task.status }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'

// 响应式数据
const stats = ref({
  todo: 12,
  inProgress: 5,
  completed: 28
})

const weeklyCompleted = ref(15)
const chartPeriod = ref<'week' | 'month'>('week')

const recentProjects = ref([
  { id: 1, name: 'TaskFlow 开发', color: '#6366f1', taskCount: 15, completionRate: 73 },
  { id: 2, name: '个人学习计划', color: '#10b981', taskCount: 8, completionRate: 45 },
  { id: 3, name: '产品设计文档', color: '#f59e0b', taskCount: 12, completionRate: 89 },
  { id: 4, name: '市场营销策略', color: '#ef4444', taskCount: 6, completionRate: 32 }
])

const todayTasks = ref([
  { id: 1, title: '完成项目概览页面设计', project: 'TaskFlow 开发', time: '09:00', priority: 'high', status: '进行中' },
  { id: 2, title: '团队周会', project: '团队管理', time: '14:00', priority: 'medium', status: '待办' },
  { id: 3, title: '代码审查', project: 'TaskFlow 开发', time: '16:00', priority: 'low', status: '待办' },
  { id: 4, title: '更新项目文档', project: '产品设计文档', time: '17:30', priority: 'medium', status: '待办' }
])

const currentDate = computed(() => {
  return new Date().toLocaleDateString('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })
})

const currentTime = computed(() => {
  return new Date().toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
})

const completionRate = computed(() => {
  const total = stats.value.todo + stats.value.inProgress + stats.value.completed
  if (total === 0) return 0
  return Math.round((stats.value.completed / total) * 100)
})

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
    case '进行中': return 'bg-blue-100 text-blue-700'
    case '待办': return 'bg-gray-100 text-gray-700'
    case '已完成': return 'bg-green-100 text-green-700'
    default: return 'bg-gray-100 text-gray-700'
  }
}

let trendChart: echarts.ECharts | null = null

const initTrendChart = () => {
  const chartEl = document.getElementById('trendChart')
  if (!chartEl) return

  if (trendChart) {
    trendChart.dispose()
  }

  trendChart = echarts.init(chartEl)

  const isWeek = chartPeriod.value === 'week'
  const dates = isWeek
    ? ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    : ['第1周', '第2周', '第3周', '第4周']

  const todoData = isWeek ? [8, 12, 10, 15, 9, 11, 13] : [45, 52, 48, 58]
  const completedData = isWeek ? [5, 8, 7, 12, 6, 9, 10] : [32, 38, 35, 42]

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
        data: todoData,
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
}

const updateChartPeriod = (period: 'week' | 'month') => {
  chartPeriod.value = period
  nextTick(() => {
    initTrendChart()
  })
}

const resizeChart = () => {
  trendChart?.resize()
}

onMounted(() => {
  nextTick(() => {
    initTrendChart()
    window.addEventListener('resize', resizeChart)
  })
})
</script>