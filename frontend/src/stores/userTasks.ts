import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { getUserTasks, getUserTasksStats, type UserTaskFilters, type UserTasksStats, type TaskListResponse } from '@/api/user'
import type { Task } from '@/types/task'
import type { UserPreferences } from '@/types/auth'
import { DEFAULT_MY_TASKS_STATUSES, getMyTasksDefaultStatuses } from '@/constants/userPreferences'

export const useUserTasksStore = defineStore('userTasks', () => {
  // 状态
  const tasks = ref<Task[]>([])
  const loading = ref(false)
  const stats = ref<UserTasksStats>()
  const currentView = ref<'list' | 'board'>('board')
  const filters = ref<UserTaskFilters>({ status: [...DEFAULT_MY_TASKS_STATUSES] })
  const selectedTaskIds = ref<string[]>([])
  const pagination = ref({
    page: 1,
    pageSize: 20,
    total: 0,
    hasMore: true
  })

  // 计算属性
  const selectedTasks = computed(() => {
    return tasks.value.filter(task => selectedTaskIds.value.includes(task._id))
  })

  const selectedTasksCount = computed(() => selectedTaskIds.value.length)

  const hasSelectedTasks = computed(() => selectedTasksCount.value > 0)

  // 获取任务列表
  const fetchTasks = async (resetPage = false) => {
    if (loading.value) return

    loading.value = true
    try {
      if (resetPage) {
        pagination.value.page = 1
        tasks.value = []
      }

      // 构建API参数，正确处理数组字段
      const apiParams: any = {
        priority: filters.value.priority,
        search: filters.value.search,
        page: pagination.value.page,
        pageSize: pagination.value.pageSize,
        sortField: 'updatedAt',
        sortDirection: 'desc'
      }

      // 处理状态筛选
      if (filters.value.status && filters.value.status.length > 0) {
        apiParams.status = filters.value.status
      }

      // 处理项目筛选（优先使用projectIds，如果没有则使用projectId）
      if (filters.value.projectIds && filters.value.projectIds.length > 0) {
        apiParams.projectIds = filters.value.projectIds.join(',')
      } else if (filters.value.projectId) {
        apiParams.projectId = filters.value.projectId
      }

      // 将数组状态转换为逗号分隔的字符串以兼容后端
      const finalParams = { ...apiParams }
      if (Array.isArray(finalParams.status)) {
        finalParams.status = finalParams.status.join(',')
      }

      // 使用新的跨项目任务API
      const response = await getUserTasks(finalParams)

      if (resetPage) {
        tasks.value = response.items
      } else {
        tasks.value.push(...response.items)
      }

      pagination.value = {
        ...pagination.value,
        total: response.total,
        hasMore: response.hasMore
      }
    } catch (error) {
      console.error('Failed to fetch user tasks:', error)
    } finally {
      loading.value = false
    }
  }

  // 转换时间范围为截止日期
  const convertTimeRangeToDate = (timeRange: string): number | undefined => {
    const now = Date.now()
    const dayInMs = 24 * 60 * 60 * 1000

    switch (timeRange) {
      case 'today':
        return Math.floor((now + dayInMs) / 1000) // 明天此时
      case 'week':
        return Math.floor((now + 7 * dayInMs) / 1000) // 7天后
      case 'month':
        return Math.floor((now + 30 * dayInMs) / 1000) // 30天后
      default:
        return undefined
    }
  }

  // 获取任务统计
  const fetchStats = async () => {
    try {
      stats.value = await getUserTasksStats()
    } catch (error) {
      console.error('Failed to fetch user tasks stats:', error)
    }
  }

  // 应用用户偏好中的默认状态筛选
  const applyDefaultStatusFilter = (preferences?: UserPreferences | null) => {
    filters.value = {
      ...filters.value,
      status: getMyTasksDefaultStatuses(preferences)
    }
  }

  const getDefaultStatusFilter = (preferences?: UserPreferences | null) =>
    getMyTasksDefaultStatuses(preferences)

  // 更新筛选条件
  const updateFilters = (newFilters: Partial<UserTaskFilters>) => {
    filters.value = { ...filters.value, ...newFilters }
    fetchTasks(true)
  }

  // 切换视图
  const switchView = (view: 'list' | 'board') => {
    currentView.value = view
  }

  // 选择任务
  const selectTask = (taskId: string, selected?: boolean) => {
    const index = selectedTaskIds.value.indexOf(taskId)
    if (selected === undefined) {
      // 切换选择状态
      if (index > -1) {
        selectedTaskIds.value.splice(index, 1)
      } else {
        selectedTaskIds.value.push(taskId)
      }
    } else if (selected && index === -1) {
      selectedTaskIds.value.push(taskId)
    } else if (!selected && index > -1) {
      selectedTaskIds.value.splice(index, 1)
    }
  }

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedTasksCount.value === tasks.value.length) {
      // 取消全选
      selectedTaskIds.value = []
    } else {
      // 全选
      selectedTaskIds.value = tasks.value.map(task => task._id)
    }
  }

  // 清除选择
  const clearSelection = () => {
    selectedTaskIds.value = []
  }

  // 加载更多
  const loadMore = () => {
    if (pagination.value.hasMore && !loading.value) {
      pagination.value.page++
      fetchTasks()
    }
  }

  // 刷新
  const refresh = () => {
    fetchTasks(true)
    fetchStats()
  }

  return {
    // 状态
    tasks,
    loading,
    stats,
    currentView,
    filters,
    selectedTaskIds,
    pagination,

    // 计算属性
    selectedTasks,
    selectedTasksCount,
    hasSelectedTasks,

    // 方法
    fetchTasks,
    fetchStats,
    applyDefaultStatusFilter,
    getDefaultStatusFilter,
    updateFilters,
    switchView,
    selectTask,
    toggleSelectAll,
    clearSelection,
    loadMore,
    refresh
  }
})