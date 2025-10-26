<template>
  <div class="h-full flex flex-col">
    <!-- 标题和过滤器（固定在顶部） -->
    <div class="flex-shrink-0 flex items-center justify-between pb-3 border-b border-gray-200">
      <h3 class="text-lg font-semibold text-gray-900">活动历史</h3>
      <div class="flex items-center gap-2">
        <button
          v-for="filter in filters"
          :key="filter.value"
          class="px-3 py-1 text-xs font-medium rounded-lg transition-colors"
          :class="currentFilter === filter.value
            ? 'bg-blue-100 text-blue-700'
            : 'text-gray-600 hover:bg-gray-100'"
          @click="currentFilter = filter.value"
        >
          {{ filter.label }}
        </button>
      </div>
    </div>

    <!-- 活动时间线（可滚动，倒序显示） -->
    <div class="flex-1 min-h-0 overflow-y-auto py-4 space-y-4">
      <div
        v-for="activity in filteredActivities"
        :key="activity.id"
        class="relative"
      >
        <!-- 时间线连接线 -->
        <div
          v-if="activity !== filteredActivities[filteredActivities.length - 1]"
          class="absolute left-4 top-10 bottom-0 w-px bg-gray-200"
        ></div>

        <!-- 活动项 -->
        <div class="flex gap-3">
          <!-- 用户头像 -->
          <div class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 relative z-10">
            {{ activity.user.charAt(0).toUpperCase() }}
          </div>

          <!-- 活动内容 -->
          <div class="flex-1 min-w-0">
            <!-- 评论类型 -->
            <div v-if="activity.type === 'comment'" class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
              <div class="flex items-start justify-between mb-2">
                <div class="flex items-center gap-2">
                  <span class="font-medium text-sm text-gray-900">{{ activity.user }}</span>
                  <span class="text-xs text-gray-500">{{ formatRelativeTime(activity.timestamp) }}</span>
                </div>
                <button class="text-gray-400 hover:text-gray-600 transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                  </svg>
                </button>
              </div>
              <div class="text-sm text-gray-700 whitespace-pre-wrap">{{ activity.content }}</div>

              <!-- 反应表情（Mock） -->
              <div class="flex items-center gap-2 mt-3">
                <button class="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-xs transition-colors">
                  👍 <span class="text-gray-600">2</span>
                </button>
                <button class="px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
                  添加反应
                </button>
              </div>
            </div>

            <!-- 字段变更类型（智能分组） -->
            <div v-else-if="activity.type === 'field_change'" class="py-2">
              <div class="flex items-center gap-2 text-sm">
                <span class="font-medium text-gray-900">{{ activity.user }}</span>
                <span class="text-gray-600">
                  <template v-if="activity.grouped && activity.changes && activity.changes.length > 1">
                    进行了 {{ activity.changes.length }} 项修改
                  </template>
                  <template v-else>
                    {{ activity.content }}
                  </template>
                </span>
                <span class="text-xs text-gray-500">{{ formatRelativeTime(activity.timestamp) }}</span>
              </div>

              <!-- 分组的多个字段变更 -->
              <div v-if="activity.grouped && activity.changes" class="mt-2 ml-6 space-y-1">
                <div
                  v-for="(change, idx) in activity.changes"
                  :key="idx"
                  class="text-xs text-gray-600"
                >
                  {{ change }}
                </div>
              </div>
            </div>

            <!-- 系统事件类型 -->
            <div v-else-if="activity.type === 'system'" class="py-2">
              <div class="flex items-center gap-2 text-sm text-gray-600">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{{ activity.content }}</span>
                <span class="text-xs text-gray-500">{{ formatRelativeTime(activity.timestamp) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="filteredActivities.length === 0" class="py-12 text-center">
        <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <p class="text-gray-500 text-sm">暂无活动记录</p>
      </div>
    </div>

    <!-- 评论输入框（固定在底部） -->
    <div class="flex-shrink-0 border-t border-gray-200 pt-3">
      <div class="border border-gray-200 rounded-lg overflow-hidden transition-all">
        <textarea
          v-model="newComment"
          rows="3"
          class="w-full px-4 py-3 text-sm text-gray-900 resize-none focus:outline-none"
          placeholder="添加评论... 支持 @提及 (开发中)"
        ></textarea>
        <div class="px-4 py-2 bg-gray-50 flex items-center justify-between border-t border-gray-200">
          <div class="flex items-center gap-2 text-xs text-gray-500">
            <button class="hover:text-gray-700 transition-colors" title="粗体">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 12h12M6 6h12M6 18h12" />
              </svg>
            </button>
            <button class="hover:text-gray-700 transition-colors" title="斜体">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16" />
              </svg>
            </button>
            <button class="hover:text-gray-700 transition-colors" title="链接">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </button>
          </div>
          <button
            class="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            :disabled="!newComment.trim()"
            @click="addComment"
          >
            发送
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Task {
  _id: string
  title: string
  status: string
  priority: string
  createdAt: number
  updatedAt: number
}

interface Activity {
  id: string
  type: 'comment' | 'field_change' | 'system'
  user: string
  content: string
  timestamp: number
  grouped?: boolean
  changes?: string[]
}

interface Props {
  task: Task | null
}

defineProps<Props>()

// 过滤器
const filters = [
  { label: '全部', value: 'all' as const },
  { label: '评论', value: 'comments' as const },
  { label: '历史', value: 'history' as const }
]

const currentFilter = ref<'all' | 'comments' | 'history'>('all')

// 新评论
const newComment = ref('')

// Mock 活动数据
const activities = ref<Activity[]>([
  {
    id: '1',
    type: 'system',
    user: '系统',
    content: '任务已创建',
    timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000
  },
  {
    id: '2',
    type: 'field_change',
    user: '张三',
    content: '将状态从「待办」改为「进行中」',
    timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000
  },
  {
    id: '3',
    type: 'comment',
    user: '李四',
    content: '这个任务需要注意性能优化，建议使用虚拟滚动。',
    timestamp: Date.now() - 4 * 24 * 60 * 60 * 1000
  },
  {
    id: '4',
    type: 'field_change',
    user: '张三',
    content: '',
    timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000,
    grouped: true,
    changes: [
      '将优先级从「中」改为「高」',
      '将指派人设置为「王五」',
      '添加了标签「紧急」'
    ]
  },
  {
    id: '5',
    type: 'comment',
    user: '王五',
    content: '我来处理这个任务，预计明天完成。',
    timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000
  },
  {
    id: '6',
    type: 'field_change',
    user: '王五',
    content: '将进度更新为 60%',
    timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000
  },
  {
    id: '7',
    type: 'comment',
    user: '张三',
    content: '看起来进展不错，继续加油！',
    timestamp: Date.now() - 12 * 60 * 60 * 1000
  }
])

// 过滤后的活动（倒序：最新的在最上面）
const filteredActivities = computed(() => {
  let filtered = activities.value
  if (currentFilter.value === 'comments') {
    filtered = activities.value.filter(a => a.type === 'comment')
  } else if (currentFilter.value === 'history') {
    filtered = activities.value.filter(a => a.type !== 'comment')
  }
  // 倒序排列（时间戳大的在前）
  return [...filtered].sort((a, b) => b.timestamp - a.timestamp)
})

// 添加评论
const addComment = () => {
  if (!newComment.value.trim()) return

  const comment: Activity = {
    id: Date.now().toString(),
    type: 'comment',
    user: '当前用户',
    content: newComment.value.trim(),
    timestamp: Date.now()
  }

  activities.value.unshift(comment)
  newComment.value = ''
}

// 格式化相对时间
const formatRelativeTime = (timestamp: number) => {
  const now = Date.now()
  const diff = now - timestamp
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 7) {
    const date = new Date(timestamp)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } else if (days > 0) {
    return `${days} 天前`
  } else if (hours > 0) {
    return `${hours} 小时前`
  } else if (minutes > 0) {
    return `${minutes} 分钟前`
  } else {
    return '刚刚'
  }
}
</script>
