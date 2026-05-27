<template>
  <div class="p-8">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">消息</h1>
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

    <!-- 多维筛选：状态 / 类型 / 来源 分别独立 -->
    <div class="mb-6 bg-white dark:bg-gray-800 rounded-md border border-gray-100 dark:border-gray-700 p-4 space-y-3">
      <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span class="text-xs font-medium text-gray-500 dark:text-gray-400 w-10 shrink-0">状态</span>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="option in readFilterOptions"
            :key="option.value"
            type="button"
            class="px-3 py-1.5 text-sm rounded-md transition-colors"
            :class="filterChipClass(readFilter === option.value)"
            @click="readFilter = option.value"
          >
            {{ option.label }}
            <span v-if="option.count > 0" class="ml-1.5 text-xs opacity-80">{{ option.count }}</span>
          </button>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span class="text-xs font-medium text-gray-500 dark:text-gray-400 w-10 shrink-0">类型</span>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="option in typeFilterOptions"
            :key="option.value"
            type="button"
            class="px-3 py-1.5 text-sm rounded-md transition-colors"
            :class="filterChipClass(typeFilter === option.value)"
            @click="typeFilter = option.value"
          >
            {{ option.label }}
            <span v-if="option.count > 0" class="ml-1.5 text-xs opacity-80">{{ option.count }}</span>
          </button>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span class="text-xs font-medium text-gray-500 dark:text-gray-400 w-10 shrink-0">来源</span>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="option in sourceFilterOptions"
            :key="option.value"
            type="button"
            class="px-3 py-1.5 text-sm rounded-md transition-colors"
            :class="filterChipClass(sourceFilter === option.value)"
            @click="sourceFilter = option.value"
          >
            {{ option.label }}
            <span v-if="option.count > 0" class="ml-1.5 text-xs opacity-80">{{ option.count }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="bg-white dark:bg-gray-800 rounded-md shadow-md p-8 text-center text-gray-500 dark:text-gray-400">
      加载中...
    </div>

    <!-- 消息列表 -->
    <div v-else class="bg-white dark:bg-gray-800 rounded-md shadow-md divide-y divide-gray-100 dark:divide-gray-700">
      <div
        v-for="message in filteredMessages"
        :key="message._id"
        class="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200 cursor-pointer"
        :class="{ 'bg-blue-50 dark:bg-blue-900/30': !message.isRead }"
        @click="handleNotificationClick(message)"
      >
        <div class="flex items-start">
          <!-- 图标 -->
          <div class="flex-shrink-0 mr-4">
            <div
              class="w-10 h-10 rounded-full flex items-center justify-center"
              :class="{
                'bg-blue-100 dark:bg-blue-900/50': message.type === 'task_assigned',
                'bg-green-100 dark:bg-green-900/50': message.type === 'task_status_changed',
                'bg-yellow-100 dark:bg-yellow-900/50': message.type === 'task_updated',
                'bg-purple-100 dark:bg-purple-900/50': message.type === 'commented',
                'bg-pink-100 dark:bg-pink-900/50': message.type === 'mentioned'
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
            <div class="flex items-center gap-2 mb-1">
              <span
                class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0"
                :class="isAiNotification(message)
                  ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'"
              >
                {{ getNotificationSourceLabel(message) }}
              </span>
              <p class="text-sm text-gray-900 dark:text-gray-100 truncate">
                {{ message.content }}
              </p>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400">{{ message.timeAgo || formatTime(message.createdAt) }}</p>
          </div>

          <!-- 未读标记 -->
          <div v-if="!message.isRead" class="flex-shrink-0 ml-4">
            <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="filteredMessages.length === 0 && !loading" class="p-8 text-center text-gray-500 dark:text-gray-400">
        暂无消息
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
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
import { isAiNotification, getNotificationSourceLabel } from '@/utils/notification'
import { usePageTitle } from '@/composables/usePageTitle'

type ReadFilter = 'all' | 'unread'
type TypeFilter = 'all' | 'task' | 'comment' | 'mention'
type SourceFilter = 'all' | 'ai' | 'human'

interface FilterOption<T extends string> {
  value: T
  label: string
  count: number
}

const router = useRouter()
const { setUnreadCount, decrementUnread } = usePageTitle()

const loading = ref(false)
const markingAllAsRead = ref(false)

const readFilter = ref<ReadFilter>('all')
const typeFilter = ref<TypeFilter>('all')
const sourceFilter = ref<SourceFilter>('all')

const readFilterOptions = ref<FilterOption<ReadFilter>[]>([
  { value: 'all', label: '全部', count: 0 },
  { value: 'unread', label: '未读', count: 0 }
])

const typeFilterOptions = ref<FilterOption<TypeFilter>[]>([
  { value: 'all', label: '全部', count: 0 },
  { value: 'task', label: '任务', count: 0 },
  { value: 'comment', label: '评论', count: 0 },
  { value: 'mention', label: '@提醒', count: 0 }
])

const sourceFilterOptions = ref<FilterOption<SourceFilter>[]>([
  { value: 'all', label: '全部', count: 0 },
  { value: 'ai', label: 'AI', count: 0 },
  { value: 'human', label: '人工', count: 0 }
])

const messages = ref<Notification[]>([])
const unreadCount = ref(0)

const filterChipClass = (active: boolean) =>
  active
    ? 'bg-blue-500 dark:bg-blue-600 text-white'
    : 'bg-gray-50 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'

const filteredMessages = computed(() => {
  return messages.value.filter(message => {
    if (readFilter.value === 'unread' && message.isRead) return false
    if (typeFilter.value === 'task' && !message.type.includes('task_')) return false
    if (typeFilter.value === 'comment' && message.type !== 'commented') return false
    if (typeFilter.value === 'mention' && message.type !== 'mentioned') return false
    if (sourceFilter.value === 'ai' && !isAiNotification(message)) return false
    if (sourceFilter.value === 'human' && isAiNotification(message)) return false
    return true
  })
})

const formatTime = (timestamp: number) => formatRelativeTime(timestamp)

const updateFilterCounts = () => {
  const unread = messages.value.filter(m => !m.isRead).length
  const task = messages.value.filter(m => m.type.includes('task_')).length
  const comment = messages.value.filter(m => m.type === 'commented').length
  const mention = messages.value.filter(m => m.type === 'mentioned').length
  const ai = messages.value.filter(m => isAiNotification(m)).length
  const human = messages.value.length - ai

  readFilterOptions.value = [
    { value: 'all', label: '全部', count: messages.value.length },
    { value: 'unread', label: '未读', count: unread }
  ]
  typeFilterOptions.value = [
    { value: 'all', label: '全部', count: messages.value.length },
    { value: 'task', label: '任务', count: task },
    { value: 'comment', label: '评论', count: comment },
    { value: 'mention', label: '@提醒', count: mention }
  ]
  sourceFilterOptions.value = [
    { value: 'all', label: '全部', count: messages.value.length },
    { value: 'ai', label: 'AI', count: ai },
    { value: 'human', label: '人工', count: human }
  ]

  unreadCount.value = unread
  setUnreadCount(unread)
}

const handleNotificationClick = async (message: Notification) => {
  if (!message.isRead) {
    try {
      await markNotificationAsRead(message._id)
      message.isRead = true
      updateFilterCounts()
      decrementUnread()
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  if (message.relatedTaskId) {
    try {
      const task = await getTaskDetail(message.relatedTaskId)
      if (task?.projectId) {
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
      router.push('/projects')
    }
  }
}

const handleMarkAllAsRead = async () => {
  markingAllAsRead.value = true
  try {
    const result = await markAllNotificationsAsRead()
    messages.value.forEach(m => {
      m.isRead = true
    })
    updateFilterCounts()
    setUnreadCount(0)
    ElMessage.success(`已标记 ${result.count} 条消息为已读`)
  } catch (error) {
    console.error('Failed to mark all as read:', error)
    ElMessage.error('标记失败')
  } finally {
    markingAllAsRead.value = false
  }
}

const loadMessages = async () => {
  loading.value = true
  try {
    const result = await getNotifications({
      page: 1,
      size: 100
    })

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

const loadUnreadCount = async () => {
  try {
    const result = await getUnreadCount()
    unreadCount.value = result.count
  } catch (error) {
    console.error('Failed to load unread count:', error)
  }
}

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
