<template>
  <div class="p-8">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-3xl font-bold text-gray-900">消息</h1>
      <el-button 
        v-if="unreadCount > 0" 
        type="default" 
        size="small"
        @click="handleMarkAllAsRead"
        :loading="markingAllAsRead"
      >
        全部标记为已读
      </el-button>
    </div>

    <!-- 消息筛选 -->
    <div class="mb-6 flex gap-2">
      <button
        v-for="filter in filters"
        :key="filter.value"
        @click="currentFilter = filter.value"
        class="px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200"
        :class="currentFilter === filter.value ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'"
      >
        {{ filter.label }}
        <span v-if="filter.count > 0" class="ml-2 px-2 py-0.5 rounded-full text-xs"
          :class="currentFilter === filter.value ? 'bg-white/20' : 'bg-gray-200'">
          {{ filter.count }}
        </span>
      </button>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="bg-white rounded-md shadow-md p-8 text-center text-gray-500">
      加载中...
    </div>

    <!-- 消息列表 -->
    <div v-else class="bg-white rounded-md shadow-md divide-y divide-gray-100">
      <div
        v-for="message in filteredMessages"
        :key="message._id"
        class="p-4 hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
        :class="{ 'bg-blue-50': !message.isRead }"
        @click="handleNotificationClick(message)"
      >
        <div class="flex items-start">
          <!-- 图标 -->
          <div class="flex-shrink-0 mr-4">
            <div
              class="w-10 h-10 rounded-full flex items-center justify-center"
              :class="{
                'bg-blue-100': message.type === 'task_assigned',
                'bg-green-100': message.type === 'task_status_changed',
                'bg-yellow-100': message.type === 'task_updated',
                'bg-purple-100': message.type === 'commented',
                'bg-pink-100': message.type === 'mentioned'
              }"
            >
              <svg
                v-if="message.type === 'task_assigned'"
                class="w-5 h-5 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <svg
                v-else-if="message.type === 'task_status_changed'"
                class="w-5 h-5 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <svg
                v-else-if="message.type === 'commented' || message.type === 'mentioned'"
                class="w-5 h-5 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              <svg
                v-else
                class="w-5 h-5 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
          </div>

          <!-- 内容 -->
          <div class="flex-1 min-w-0">
            <p class="text-sm text-gray-900 mb-1">
              {{ message.content }}
            </p>
            <p class="text-xs text-gray-500">{{ message.timeAgo || formatTime(message.createdAt) }}</p>
          </div>

          <!-- 未读标记 -->
          <div v-if="!message.isRead" class="flex-shrink-0 ml-4">
            <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="filteredMessages.length === 0 && !loading" class="p-8 text-center text-gray-500">
        暂无消息
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 
  getNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  getUnreadCount 
} from '@/api/notification'
import { getTaskDetail } from '@/api/task'
import type { Notification } from '@/types/notification'
import { formatRelativeTime } from '@/utils/time'

const router = useRouter()

// 加载状态
const loading = ref(false)
const markingAllAsRead = ref(false)

// 筛选选项
const filters = ref([
  { value: 'all', label: '全部', count: 0 },
  { value: 'unread', label: '未读', count: 0 },
  { value: 'task', label: '任务', count: 0 },
  { value: 'comment', label: '评论', count: 0 },
  { value: 'mention', label: '@提醒', count: 0 }
])

// 当前筛选
const currentFilter = ref('all')

// 消息列表
const messages = ref<Notification[]>([])
const unreadCount = ref(0)

// 筛选后的消息
const filteredMessages = computed(() => {
  let result = messages.value

  if (currentFilter.value === 'unread') {
    result = result.filter(m => !m.isRead)
  } else if (currentFilter.value === 'task') {
    result = result.filter(m => m.type.includes('task_'))
  } else if (currentFilter.value === 'comment') {
    result = result.filter(m => m.type === 'commented')
  } else if (currentFilter.value === 'mention') {
    result = result.filter(m => m.type === 'mentioned')
  }

  return result
})

// 格式化时间
const formatTime = (timestamp: number) => {
  return formatRelativeTime(timestamp)
}

// 更新筛选器计数
const updateFilterCounts = () => {
  const unread = messages.value.filter(m => !m.isRead).length
  const task = messages.value.filter(m => m.type.includes('task_')).length
  const comment = messages.value.filter(m => m.type === 'commented').length
  const mention = messages.value.filter(m => m.type === 'mentioned').length

  filters.value = [
    { value: 'all', label: '全部', count: messages.value.length },
    { value: 'unread', label: '未读', count: unread },
    { value: 'task', label: '任务', count: task },
    { value: 'comment', label: '评论', count: comment },
    { value: 'mention', label: '@提醒', count: mention }
  ]
  unreadCount.value = unread
}

// 处理通知点击
const handleNotificationClick = async (message: Notification) => {
  // 如果未读，先标记为已读
  if (!message.isRead) {
    try {
      await markNotificationAsRead(message._id)
      message.isRead = true
      updateFilterCounts()
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  // 跳转到相关任务
  if (message.relatedTaskId) {
    try {
      // 获取任务详情以获取项目ID
      const task = await getTaskDetail(message.relatedTaskId)
      if (task && task.projectId) {
        router.push({
          path: `/projects/${task.projectId}`,
          query: {
            tab: 'board',
            taskId: message.relatedTaskId
          }
        })
      }
    } catch (error) {
      console.error('Failed to get task detail:', error)
      // 如果获取失败，尝试直接跳转到项目列表
      router.push('/projects')
    }
  }
}

// 全部标记为已读
const handleMarkAllAsRead = async () => {
  markingAllAsRead.value = true
  try {
    const result = await markAllNotificationsAsRead()
    // 更新本地状态
    messages.value.forEach(m => {
      m.isRead = true
    })
    updateFilterCounts()
    ElMessage.success(`已标记 ${result.count} 条消息为已读`)
  } catch (error) {
    console.error('Failed to mark all as read:', error)
    ElMessage.error('标记失败')
  } finally {
    markingAllAsRead.value = false
  }
}

// 加载消息
const loadMessages = async () => {
  loading.value = true
  try {
    const result = await getNotifications({
      page: 1,
      size: 100 // 暂时加载所有，后续可以优化为分页
    })
    
    // 格式化消息，添加时间显示
    messages.value = result.items.map(msg => ({
      ...msg,
      timeAgo: formatRelativeTime(msg.createdAt)
    }))
    
    updateFilterCounts()
  } catch (error) {
    console.error('Failed to load messages:', error)
    ElMessage.error('加载消息失败')
  } finally {
    loading.value = false
  }
}

// 加载未读数量
const loadUnreadCount = async () => {
  try {
    const result = await getUnreadCount()
    unreadCount.value = result.count
  } catch (error) {
    console.error('Failed to load unread count:', error)
  }
}

// 监听筛选变化，重新加载
watch(currentFilter, () => {
  // 筛选是前端计算，不需要重新加载
})

// 页面可见性变化处理
const handleVisibilityChange = () => {
  if (!document.hidden) {
    loadUnreadCount()
  }
}

onMounted(() => {
  loadMessages()
  loadUnreadCount()
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>
