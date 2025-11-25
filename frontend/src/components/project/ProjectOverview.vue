<template>
  <div class="space-y-8">
    <!-- 统计卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow duration-200">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">总任务数</h3>
          <div class="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <svg class="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
        </div>
        <p class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">{{ project?.taskCount || 0 }}</p>
        <div class="text-xs text-gray-500 dark:text-gray-400">项目总任务量</div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-blue-100 dark:border-blue-900/50 hover:shadow-md transition-shadow duration-200">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">进行中</h3>
          <div class="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
            <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <p class="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">{{ pendingTaskCount }}</p>
        <div class="text-xs text-gray-500 dark:text-gray-400">待完成任务</div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-green-100 dark:border-green-900/50 hover:shadow-md transition-shadow duration-200">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">已完成</h3>
          <div class="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
            <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <p class="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">{{ project?.completedTaskCount || 0 }}</p>
        <div class="text-xs text-gray-500 dark:text-gray-400">已完成任务</div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-purple-100 dark:border-purple-900/50 hover:shadow-md transition-shadow duration-200">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">完成率</h3>
          <div class="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
            <svg class="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
        </div>
        <p class="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">{{ completionRate }}%</p>
        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div class="bg-purple-600 dark:bg-purple-500 h-2 rounded-full transition-all duration-300" :style="{ width: `${completionRate}%` }"></div>
        </div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- 任务状态分布图 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
          <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
          </svg>
          任务状态分布
        </h3>
        <div id="statusChart" class="h-80"></div>
      </div>

      <!-- 项目进度图 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
          <svg class="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          项目进度统计
        </h3>
        <div id="progressChart" class="h-80"></div>
      </div>
    </div>

    <!-- 项目信息 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- 项目描述 -->
      <div v-if="project?.description" class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <svg class="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          项目描述
        </h3>
        <p class="text-gray-600 dark:text-gray-300 leading-relaxed">{{ project.description }}</p>
      </div>

      <!-- 项目状态 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <svg class="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          项目状态
        </h3>
        <div class="space-y-4">
          <div class="flex justify-between items-center">
            <span class="text-gray-600 dark:text-gray-400">项目状态</span>
            <span class="px-3 py-1 rounded-full text-sm font-medium" :class="statusClasses">
              {{ statusText }}
            </span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-600 dark:text-gray-400">团队成员</span>
            <span class="text-gray-900 dark:text-gray-100 font-medium">{{ project?.memberCount || 0 }} 人</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-600 dark:text-gray-400">创建时间</span>
            <span class="text-gray-900 dark:text-gray-100 font-medium">{{ formatDate(project?.createdAt) }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-600 dark:text-gray-400">最后更新</span>
            <span class="text-gray-900 dark:text-gray-100 font-medium">{{ formatDate(project?.updatedAt) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 快捷操作 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
        <svg class="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        快捷操作
      </h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button class="p-4 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg text-center transition-colors duration-200">
          <svg class="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          <div class="text-sm font-medium text-blue-900 dark:text-blue-100">创建任务</div>
        </button>
        <button class="p-4 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-lg text-center transition-colors duration-200">
          <svg class="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v1a2 2 0 002 2h2a2 2 0 002-2v-1m6-10V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2v-1m6-10h4l4 4" />
          </svg>
          <div class="text-sm font-medium text-green-900 dark:text-green-100">导出任务</div>
        </button>
        <button class="p-4 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded-lg text-center transition-colors duration-200">
          <svg class="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <div class="text-sm font-medium text-purple-900 dark:text-purple-100">成员管理</div>
        </button>
        <button class="p-4 bg-orange-50 dark:bg-orange-900/30 hover:bg-orange-100 dark:hover:bg-orange-900/50 rounded-lg text-center transition-colors duration-200">
          <svg class="w-8 h-8 text-orange-600 dark:text-orange-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <div class="text-sm font-medium text-orange-900 dark:text-orange-100">项目设置</div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, nextTick, watch, ref } from 'vue'
import * as echarts from 'echarts'
import type { Project } from '@/types/project'

interface Props {
  project: Project | null
}

const props = defineProps<Props>()

const pendingTaskCount = computed(() => {
  const total = props.project?.taskCount || 0
  const completed = props.project?.completedTaskCount || 0
  return total - completed
})

const completionRate = computed(() => {
  const total = props.project?.taskCount || 0
  const completed = props.project?.completedTaskCount || 0
  if (total === 0) return 0
  return Math.round((completed / total) * 100)
})

const statusText = computed(() => {
  const status = props.project?.status
  switch (status) {
    case 'active':
      return '进行中'
    case 'completed':
      return '已完成'
    case 'paused':
      return '已暂停'
    default:
      return '未知'
  }
})

const statusClasses = computed(() => {
  const status = props.project?.status
  switch (status) {
    case 'active':
      return 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
    case 'completed':
      return 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
    case 'paused':
      return 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300'
    default:
      return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
  }
})

const formatDate = (timestamp: number | undefined) => {
  if (!timestamp) return '-'
  const date = new Date(timestamp)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

const statusChart = ref<echarts.ECharts | null>(null)
const progressChart = ref<echarts.ECharts | null>(null)

const initStatusChart = () => {
  const chartEl = document.getElementById('statusChart')
  if (!chartEl) return

  if (statusChart.value) {
    statusChart.value.dispose()
  }

  statusChart.value = echarts.init(chartEl)

  const total = props.project?.taskCount || 0
  const completed = props.project?.completedTaskCount || 0
  const pending = total - completed

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      bottom: '5%',
      left: 'center'
    },
    series: [
      {
        name: '任务状态',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 20,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          {
            value: completed,
            name: '已完成',
            itemStyle: { color: '#10b981' }
          },
          {
            value: pending,
            name: '进行中',
            itemStyle: { color: '#3b82f6' }
          }
        ]
      }
    ]
  }

  statusChart.value.setOption(option)
}

const initProgressChart = () => {
  const chartEl = document.getElementById('progressChart')
  if (!chartEl) return

  if (progressChart.value) {
    progressChart.value.dispose()
  }

  progressChart.value = echarts.init(chartEl)

  const total = props.project?.taskCount || 0
  const completed = props.project?.completedTaskCount || 0
  const pending = total - completed
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: [
      {
        type: 'category',
        data: ['总任务', '已完成', '进行中', '完成率'],
        axisTick: {
          alignWithLabel: true
        }
      }
    ],
    yAxis: [
      {
        type: 'value',
        name: '数量',
        min: 0,
        max: Math.max(total, 10),
        position: 'left',
        axisLine: {
          show: true,
          lineStyle: {
            color: '#5470C6'
          }
        },
        axisLabel: {
          formatter: '{value}'
        }
      },
      {
        type: 'value',
        name: '百分比(%)',
        min: 0,
        max: 100,
        position: 'right',
        axisLine: {
          show: true,
          lineStyle: {
            color: '#91CC75'
          }
        },
        axisLabel: {
          formatter: '{value}%'
        }
      }
    ],
    series: [
      {
        name: '任务数量',
        type: 'bar',
        barWidth: '30%',
        data: [total, completed, pending, 0]
      },
      {
        name: '完成率',
        type: 'line',
        yAxisIndex: 1,
        data: [0, 0, 0, rate],
        itemStyle: { color: '#f59e0b' },
        lineStyle: { width: 3 },
        symbol: 'circle',
        symbolSize: 8
      }
    ]
  }

  progressChart.value.setOption(option)
}

const resizeCharts = () => {
  statusChart.value?.resize()
  progressChart.value?.resize()
}

onMounted(() => {
  nextTick(() => {
    initStatusChart()
    initProgressChart()
    window.addEventListener('resize', resizeCharts)
  })
})

watch(
  () => props.project,
  () => {
    nextTick(() => {
      initStatusChart()
      initProgressChart()
    })
  },
  { deep: true }
)
</script>