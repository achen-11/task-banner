<template>
  <div class="p-8">
    <h1 class="text-3xl font-bold text-gray-900 mb-6">消息</h1>

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
        <span v-if="filter.count > 0" class="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
          {{ filter.count }}
        </span>
      </button>
    </div>

    <!-- 消息列表 -->
    <div class="bg-white rounded-md shadow-md divide-y divide-gray-100">
      <div
        v-for="message in filteredMessages"
        :key="message.id"
        class="p-4 hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
        :class="{ 'bg-blue-50': !message.read }"
        @click="markAsRead(message.id)"
      >
        <div class="flex items-start">
          <!-- 图标 -->
          <div class="flex-shrink-0 mr-4">
            <div
              class="w-10 h-10 rounded-full flex items-center justify-center"
              :class="{
                'bg-blue-100': message.type === 'task_assigned',
                'bg-green-100': message.type === 'task_completed',
                'bg-yellow-100': message.type === 'task_updated',
                'bg-purple-100': message.type === 'comment',
                'bg-pink-100': message.type === 'mention'
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
                v-else-if="message.type === 'task_completed'"
                class="w-5 h-5 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <svg
                v-else-if="message.type === 'comment' || message.type === 'mention'"
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
              <span class="font-medium">{{ message.sender }}</span>
              {{ message.content }}
            </p>
            <p class="text-xs text-gray-500">{{ message.time }}</p>
          </div>

          <!-- 未读标记 -->
          <div v-if="!message.read" class="flex-shrink-0 ml-4">
            <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="filteredMessages.length === 0" class="p-8 text-center text-gray-500">
        暂无消息
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

// 筛选选项
const filters = ref([
  { value: 'all', label: '全部', count: 0 },
  { value: 'unread', label: '未读', count: 3 },
  { value: 'task', label: '任务', count: 0 },
  { value: 'comment', label: '评论', count: 0 },
  { value: 'mention', label: '@提醒', count: 0 }
])

// 当前筛选
const currentFilter = ref('all')

// 消息列表
const messages = ref<any[]>([])

// 筛选后的消息
const filteredMessages = computed(() => {
  if (currentFilter.value === 'all') {
    return messages.value
  }
  if (currentFilter.value === 'unread') {
    return messages.value.filter(m => !m.read)
  }
  if (currentFilter.value === 'task') {
    return messages.value.filter(m => m.type.includes('task_'))
  }
  if (currentFilter.value === 'comment') {
    return messages.value.filter(m => m.type === 'comment')
  }
  if (currentFilter.value === 'mention') {
    return messages.value.filter(m => m.type === 'mention')
  }
  return messages.value
})

// 标记为已读
const markAsRead = (messageId: number) => {
  const message = messages.value.find(m => m.id === messageId)
  if (message) {
    message.read = true
  }
}

// 加载消息
const loadMessages = async () => {
  // TODO: 从 API 加载消息
  messages.value = [
    {
      id: 1,
      type: 'task_assigned',
      sender: '张三',
      content: '将任务「实现用户认证功能」分配给了你',
      time: '5分钟前',
      read: false
    },
    {
      id: 2,
      type: 'comment',
      sender: '李四',
      content: '在任务「完成项目布局」中评论了你',
      time: '1小时前',
      read: false
    },
    {
      id: 3,
      type: 'mention',
      sender: '王五',
      content: '在评论中 @了你',
      time: '2小时前',
      read: false
    },
    {
      id: 4,
      type: 'task_completed',
      sender: '赵六',
      content: '完成了任务「编写API文档」',
      time: '昨天',
      read: true
    }
  ]
}

onMounted(() => {
  loadMessages()
})
</script>
