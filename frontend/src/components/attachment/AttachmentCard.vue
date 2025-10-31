<template>
  <div class="attachment-card group relative bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
    <!-- 图片类型 -->
    <div v-if="isImage" class="relative">
      <img
        :src="attachment.thumbnailUrl || attachment.url"
        :alt="attachment.name"
        class="w-full h-32 object-cover cursor-pointer"
        @click="$emit('preview', attachment)"
      />
      <!-- 悬停遮罩 -->
      <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        <button
          class="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
          title="预览"
          @click="$emit('preview', attachment)"
        >
          <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </button>
        <button
          class="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
          title="下载"
          @click="downloadAttachment"
        >
          <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </button>
      </div>
    </div>

    <!-- 其他文件类型 -->
    <div v-else class="p-4 flex items-center justify-center h-32 bg-gray-50">
      <div class="text-center">
        <div class="text-4xl mb-2">{{ getFileIcon(attachment.mimeType) }}</div>
        <div class="text-xs text-gray-500">{{ getFileExtension(attachment.name) }}</div>
      </div>
    </div>

    <!-- 文件信息 -->
    <div class="p-3 border-t border-gray-100">
      <div class="text-sm font-medium text-gray-900 truncate mb-1" :title="attachment.name">
        {{ attachment.name }}
      </div>
      <div class="flex items-center justify-between text-xs text-gray-500">
        <span>{{ formatFileSize(attachment.size) }}</span>
        <span>{{ formatDate(attachment.createdAt) }}</span>
      </div>
    </div>

    <!-- 删除按钮 -->
    <button
      class="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
      title="删除"
      @click="$emit('delete', attachment._id)"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Attachment {
  _id: string
  relatedType: 'task' | 'comment'
  relatedId: string
  name: string
  originalName: string
  size: number
  mimeType: string
  url: string
  thumbnailUrl?: string
  uploaderId: string
  projectId: string
  createdAt: number
  updatedAt: number
}

interface Props {
  attachment: Attachment
}

const props = defineProps<Props>()

defineEmits<{
  (e: 'preview', attachment: Attachment): void
  (e: 'delete', id: string): void
}>()

// 是否为图片
const isImage = computed(() => {
  return props.attachment.mimeType.startsWith('image/')
})

// 获取文件图标
const getFileIcon = (mimeType: string): string => {
  if (mimeType.startsWith('video/')) return '🎥'
  if (mimeType.includes('pdf')) return '📄'
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝'
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return '📊'
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '📽️'
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('compressed')) return '📦'
  if (mimeType.startsWith('audio/')) return '🎵'
  if (mimeType.startsWith('text/')) return '📃'
  return '📎'
}

// 获取文件扩展名
const getFileExtension = (filename: string): string => {
  const ext = filename.split('.').pop()?.toUpperCase()
  return ext || 'FILE'
}

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

// 格式化日期
const formatDate = (timestamp: number): string => {
  const now = Date.now()
  const diff = now - timestamp
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(hours / 24)

  if (hours < 1) return '刚刚'
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`

  const date = new Date(timestamp)
  return date.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit'
  })
}

// 下载附件
const downloadAttachment = () => {
  const link = document.createElement('a')
  link.href = props.attachment.url
  link.download = props.attachment.name
  link.click()
}
</script>
