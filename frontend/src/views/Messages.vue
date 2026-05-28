<template>
  <div class="min-h-full bg-gray-50 dark:bg-gray-900 p-8">
    <!-- 页头 -->
    <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">任务消息</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {{ pageSubtitle }}
        </p>
      </div>
      <div class="flex items-center gap-3 shrink-0">
        <el-button
          v-if="unreadCount > 0"
          type="default"
          size="small"
          :loading="markingAllAsRead"
          @click="handleMarkAllAsRead"
        >
          全部标记为已读
        </el-button>
        <div
          class="inline-flex p-0.5 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
          role="tablist"
        >
          <button
            v-for="option in viewModeOptions"
            :key="option.value"
            type="button"
            role="tab"
            class="px-3 py-1.5 text-sm font-medium rounded-md transition-all"
            :class="viewMode === option.value
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'"
            @click="viewMode = option.value"
          >
            {{ option.label }}
          </button>
        </div>
      </div>
    </div>

    <MessageFilterBar
      :groups="filterGroups"
      :model-value="{ read: readFilter, type: typeFilter, source: sourceFilter }"
      @update="onFilterUpdate"
    />

    <div v-if="loading" class="mt-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-12 text-center text-gray-500 dark:text-gray-400">
      加载中...
    </div>

    <div v-else class="mt-4 space-y-3">
      <!-- 按任务聚合 -->
      <template v-if="viewMode === 'aggregate'">
        <div
          v-for="group in groupedMessages"
          :key="group.key"
          class="bg-white dark:bg-gray-800 rounded-xl border overflow-hidden transition-shadow"
          :class="expandedGroups.has(group.key)
            ? 'border-blue-200 dark:border-blue-800 shadow-sm ring-1 ring-blue-100 dark:ring-blue-900/40'
            : 'border-gray-100 dark:border-gray-700'"
        >
          <button
            type="button"
            class="w-full px-4 py-3.5 flex items-center gap-3 text-left hover:bg-gray-50/80 dark:hover:bg-gray-700/30 transition-colors"
            @click="toggleGroupExpand(group.key)"
          >
            <ChevronDown
              v-if="expandedGroups.has(group.key)"
              class="w-5 h-5 text-[#3762E3] shrink-0"
            />
            <ChevronRight
              v-else
              class="w-5 h-5 text-gray-400 shrink-0"
            />
            <div class="flex-1 min-w-0">
              <p class="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
                {{ group.title }}
              </p>
              <p v-if="groupMetaLine(group)" class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {{ groupMetaLine(group) }}
              </p>
            </div>
            <div class="flex items-center gap-2 shrink-0 text-xs">
              <span
                v-if="group.unreadCount > 0"
                class="inline-flex items-center px-2 py-0.5 rounded-md font-medium bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400 border border-red-100 dark:border-red-900/50"
              >
                {{ group.unreadCount }} 条未读
              </span>
              <span class="text-gray-400 dark:text-gray-500">
                <template v-if="group.unreadCount === 0">已读 · </template>
                共 {{ group.items.length }} 条
              </span>
            </div>
          </button>

          <div v-if="expandedGroups.has(group.key)" class="border-t border-gray-100 dark:border-gray-700">
            <button
              v-for="(message, idx) in group.items"
              :key="message._id"
              type="button"
              class="w-full px-4 py-3 flex items-start gap-3 text-left transition-colors"
              :class="[
                idx > 0 ? 'border-t border-gray-50 dark:border-gray-700/80' : '',
                message.isRead
                  ? 'opacity-70 hover:opacity-100 hover:bg-gray-50/50 dark:hover:bg-gray-700/20'
                  : 'hover:bg-blue-50/40 dark:hover:bg-blue-900/10'
              ]"
              @click="handleNotificationClick(message)"
            >
              <div
                class="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-semibold shrink-0"
                :class="isAiNotification(message)
                  ? 'bg-[#3762E3] text-white'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200'"
              >
                {{ isAiNotification(message) ? 'AI' : actorInitial(message) }}
              </div>
              <div class="flex-1 min-w-0">
                <p
                  class="text-sm font-medium truncate"
                  :class="message.isRead ? 'text-gray-500 dark:text-gray-400' : 'text-gray-800 dark:text-gray-200'"
                >
                  {{ formatNotificationHeadline(message, formatNotificationTimeLabel(message.createdAt)) }}
                </p>
                <p
                  class="text-sm mt-0.5 line-clamp-2"
                  :class="message.isRead ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-300'"
                >
                  {{ getNotificationBody(message) }}
                </p>
              </div>
              <div v-if="!message.isRead" class="w-2 h-2 rounded-full bg-[#3762E3] shrink-0 mt-2" />
            </button>
          </div>
        </div>
      </template>

      <!-- 平铺 -->
      <template v-else>
        <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden divide-y divide-gray-100 dark:divide-gray-700">
          <button
            v-for="message in filteredMessages"
            :key="message._id"
            type="button"
            class="w-full px-4 py-3 flex items-start gap-3 text-left transition-colors"
            :class="message.isRead
              ? 'opacity-75 hover:opacity-100 hover:bg-gray-50 dark:hover:bg-gray-700/30'
              : 'hover:bg-blue-50/40 dark:hover:bg-blue-900/10'"
            @click="handleNotificationClick(message)"
          >
            <div
              class="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-semibold shrink-0"
              :class="isAiNotification(message)
                ? 'bg-[#3762E3] text-white'
                : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200'"
            >
              {{ isAiNotification(message) ? 'AI' : actorInitial(message) }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                {{ formatNotificationHeadline(message, formatNotificationTimeLabel(message.createdAt)) }}
              </p>
              <p class="text-sm text-gray-600 dark:text-gray-300 mt-0.5 line-clamp-2">{{ getNotificationBody(message) }}</p>
            </div>
            <div v-if="!message.isRead" class="w-2 h-2 rounded-full bg-[#3762E3] shrink-0 mt-2" />
          </button>
        </div>
      </template>

      <div
        v-if="(viewMode === 'aggregate' ? groupedMessages.length : filteredMessages.length) === 0"
        class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-12 text-center text-gray-500 dark:text-gray-400"
      >
        暂无消息
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ChevronDown, ChevronRight } from 'lucide-vue-next'
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadCount
} from '@/api/notification'
import { getTaskDetail } from '@/api/task'
import type { Notification } from '@/types/notification'
import {
  isAiNotification,
  formatNotificationHeadline,
  formatNotificationTimeLabel,
  formatPriorityShort,
  formatTaskDueMeta,
  getNotificationBody
} from '@/utils/notification'
import { groupNotificationsByTask, type NotificationGroup } from '@/utils/notificationGroups'
import { usePageTitle } from '@/composables/usePageTitle'
import MessageFilterBar, { type FilterGroupConfig } from '@/components/messages/MessageFilterBar.vue'

type ReadFilter = 'all' | 'unread'
type TypeFilter = 'all' | 'task' | 'comment' | 'mention'
type SourceFilter = 'all' | 'ai' | 'human'
type ViewMode = 'aggregate' | 'flat'

const router = useRouter()
const { setUnreadCount, decrementUnread } = usePageTitle()

const loading = ref(false)
const markingAllAsRead = ref(false)
const readFilter = ref<ReadFilter>('all')
const typeFilter = ref<TypeFilter>('all')
const sourceFilter = ref<SourceFilter>('all')
const viewMode = ref<ViewMode>('aggregate')
const expandedGroups = ref(new Set<string>())
const messages = ref<Notification[]>([])
const unreadCount = ref(0)
const taskMetaById = ref<Record<string, { priority: string; dueDate?: number }>>({})

const viewModeOptions: { value: ViewMode; label: string }[] = [
  { value: 'aggregate', label: '按任务聚合' },
  { value: 'flat', label: '平铺' }
]

const filterGroups = computed<FilterGroupConfig[]>(() => [
  {
    key: 'read',
    label: '状态',
    modelKey: 'read',
    options: [
      { value: 'all', label: '全部' },
      { value: 'unread', label: '未读' }
    ]
  },
  {
    key: 'type',
    label: '类型',
    modelKey: 'type',
    options: [
      { value: 'all', label: '全部' },
      { value: 'task', label: '任务' },
      { value: 'comment', label: '评论' },
      { value: 'mention', label: '@提醒' }
    ]
  },
  {
    key: 'source',
    label: '来源',
    modelKey: 'source',
    options: [
      { value: 'all', label: '全部' },
      { value: 'ai', label: 'AI' },
      { value: 'human', label: '人工' }
    ]
  }
])

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

const groupedMessages = computed(() => groupNotificationsByTask(filteredMessages.value))

const pageSubtitle = computed(() => {
  const total = filteredMessages.value.length
  const tasksWithUnread = groupedMessages.value.filter(g => g.unreadCount > 0).length
  if (viewMode.value === 'flat') {
    return total === 0 ? '暂无消息' : `共 ${total} 条`
  }
  if (tasksWithUnread === 0) {
    return total === 0 ? '暂无消息' : `共 ${total} 条消息`
  }
  return `${tasksWithUnread} 个任务含未读，共 ${total} 条`
})

const onFilterUpdate = (key: 'read' | 'type' | 'source', value: string) => {
  if (key === 'read') readFilter.value = value as ReadFilter
  else if (key === 'type') typeFilter.value = value as TypeFilter
  else sourceFilter.value = value as SourceFilter
}

const actorInitial = (message: Notification) => {
  const name = message.sender?.displayName || message.sender?.username || '人'
  return name.charAt(0).toUpperCase()
}

const groupMetaLine = (group: NotificationGroup) => {
  if (!group.relatedTaskId) return null
  const meta = taskMetaById.value[group.relatedTaskId]
  if (!meta) return null
  const parts: string[] = []
  if (meta.priority) parts.push(formatPriorityShort(meta.priority))
  const due = formatTaskDueMeta(meta.dueDate)
  if (due) parts.push(due)
  return parts.length ? parts.join(' · ') : null
}

const syncTaskMeta = async (groups: NotificationGroup[]) => {
  const ids = [
    ...new Set(groups.map(g => g.relatedTaskId).filter((id): id is string => Boolean(id)))
  ]
  const pending = ids.filter(id => !taskMetaById.value[id])
  if (pending.length === 0) return

  await Promise.all(
    pending.map(async id => {
      try {
        const task = await getTaskDetail(id)
        taskMetaById.value[id] = { priority: task.priority, dueDate: task.dueDate }
      } catch {
        /* 元信息可选 */
      }
    })
  )
}

const defaultExpandGroups = () => {
  const groups = groupedMessages.value
  if (groups.length === 0) {
    expandedGroups.value = new Set()
    return
  }
  const first = groups.find(g => g.unreadCount > 0) ?? groups[0]
  expandedGroups.value = new Set([first!.key])
}

watch(groupedMessages, groups => {
  syncTaskMeta(groups)
})

watch([readFilter, typeFilter, sourceFilter, viewMode], () => {
  if (viewMode.value === 'aggregate') {
    defaultExpandGroups()
  }
})

const toggleGroupExpand = (key: string) => {
  const next = new Set(expandedGroups.value)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  expandedGroups.value = next
}

const updateUnreadState = () => {
  const unread = messages.value.filter(m => !m.isRead).length
  unreadCount.value = unread
  setUnreadCount(unread)
}

const navigateToTask = async (taskId: string) => {
  try {
    const task = await getTaskDetail(taskId)
    if (task?.projectId) {
      router.push({
        path: `/projects/${task.projectId}`,
        query: { tab: 'board', taskId }
      })
    }
  } catch {
    router.push('/projects')
  }
}

const handleNotificationClick = async (message: Notification) => {
  if (!message.isRead) {
    try {
      await markNotificationAsRead(message._id)
      message.isRead = true
      updateUnreadState()
      decrementUnread()
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }
  if (message.relatedTaskId) {
    await navigateToTask(message.relatedTaskId)
  }
}

const handleMarkAllAsRead = async () => {
  markingAllAsRead.value = true
  try {
    const result = await markAllNotificationsAsRead()
    messages.value.forEach(m => {
      m.isRead = true
    })
    updateUnreadState()
    ElMessage.success(`已标记 ${result.count} 条消息为已读`)
  } catch {
    ElMessage.error('标记失败')
  } finally {
    markingAllAsRead.value = false
  }
}

const loadMessages = async () => {
  loading.value = true
  try {
    const result = await getNotifications({ page: 1, size: 100 })
    messages.value = result.items
    updateUnreadState()
    defaultExpandGroups()
  } catch {
    ElMessage.error('加载消息失败')
  } finally {
    loading.value = false
  }
}

const loadUnreadCount = async () => {
  try {
    const result = await getUnreadCount()
    unreadCount.value = result.count
  } catch {
    /* ignore */
  }
}

const handleVisibilityChange = () => {
  if (!document.hidden) loadUnreadCount()
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
