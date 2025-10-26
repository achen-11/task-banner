<template>
  <div class="attachment-upload">
    <!-- 隐藏的文件输入框 -->
    <input
      ref="fileInputRef"
      type="file"
      multiple
      accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar"
      class="hidden"
      @change="handleFileInput"
    />

    <!-- 上传区域 -->
    <div
      class="border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer"
      :class="{
        'border-blue-500 bg-blue-50': isDragging,
        'border-gray-300 hover:border-gray-400': !isDragging
      }"
      @click="triggerFileInput"
      @drop.prevent="handleDrop"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
    >
      <div class="flex flex-col items-center gap-2">
        <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <div class="text-sm text-gray-600">
          <span class="text-blue-600 font-medium">点击上传</span>
          或拖拽文件到这里
        </div>
        <div class="text-xs text-gray-400">
          支持图片、视频、PDF、Office 文档等，单个文件最大 50MB
        </div>
        <div class="text-xs text-gray-400">
          💡 提示：按 Ctrl+V 可直接粘贴截图
        </div>
      </div>
    </div>

    <!-- 上传进度 -->
    <div v-if="uploadingFiles.length > 0" class="mt-4 space-y-2">
      <div
        v-for="file in uploadingFiles"
        :key="file.name"
        class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
      >
        <div class="flex-1 min-w-0">
          <div class="text-sm font-medium text-gray-900 truncate">{{ file.name }}</div>
          <div class="text-xs text-gray-500">{{ formatFileSize(file.size) }}</div>
        </div>
        <div class="flex-shrink-0">
          <div class="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              class="h-full bg-blue-600 transition-all duration-300"
              :style="{ width: file.progress + '%' }"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface UploadingFile {
  name: string
  size: number
  progress: number
}

interface Attachment {
  _id: string
  name: string
  size: number
  type: string
  url: string
  thumbnailUrl?: string
  uploadedAt: number
}

const emit = defineEmits<{
  (e: 'upload', files: File[]): void
  (e: 'uploaded', attachments: Attachment[]): void
}>()

const fileInputRef = ref<HTMLInputElement>()
const isDragging = ref(false)
const uploadingFiles = ref<UploadingFile[]>([])

// 文件大小限制（50MB）
const MAX_FILE_SIZE = 50 * 1024 * 1024

// 触发文件选择
const triggerFileInput = () => {
  fileInputRef.value?.click()
}

// 处理文件输入
const handleFileInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    const files = Array.from(target.files)
    processFiles(files)
    // 清空 input，允许重复选择同一文件
    target.value = ''
  }
}

// 处理拖拽上传
const handleDrop = (event: DragEvent) => {
  isDragging.value = false
  const files = event.dataTransfer?.files
  if (files && files.length > 0) {
    processFiles(Array.from(files))
  }
}

// 处理粘贴上传
const handlePaste = (event: ClipboardEvent) => {
  const items = event.clipboardData?.items
  if (!items) return

  const files: File[] = []

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    if (item.kind === 'file') {
      const file = item.getAsFile()
      if (file) {
        // 为粘贴的文件生成一个名称
        const timestamp = Date.now()
        const ext = file.type.split('/')[1] || 'png'
        const renamedFile = new File([file], `screenshot-${timestamp}.${ext}`, {
          type: file.type
        })
        files.push(renamedFile)
      }
    }
  }

  if (files.length > 0) {
    event.preventDefault()
    processFiles(files)
  }
}

// 处理文件
const processFiles = async (files: File[]) => {
  // 过滤和验证文件
  const validFiles = files.filter(file => {
    if (file.size > MAX_FILE_SIZE) {
      alert(`文件 "${file.name}" 超过 50MB 限制`)
      return false
    }
    return true
  })

  if (validFiles.length === 0) return

  // 触发上传事件
  emit('upload', validFiles)

  // 模拟上传过程（实际项目中替换为真实上传）
  await mockUpload(validFiles)
}

// 模拟上传（实际项目中替换为真实上传逻辑）
const mockUpload = async (files: File[]) => {
  const uploadTasks = files.map(file => ({
    name: file.name,
    size: file.size,
    progress: 0
  }))

  uploadingFiles.value.push(...uploadTasks)

  // 模拟上传进度
  for (const task of uploadTasks) {
    const interval = setInterval(() => {
      task.progress += 10
      if (task.progress >= 100) {
        clearInterval(interval)
      }
    }, 100)
  }

  // 等待所有上传完成
  await new Promise(resolve => setTimeout(resolve, 1200))

  // 生成模拟的附件数据
  const attachments: Attachment[] = await Promise.all(
    files.map(async file => {
      const url = URL.createObjectURL(file)
      const thumbnailUrl = file.type.startsWith('image/')
        ? await generateThumbnail(file)
        : undefined

      return {
        _id: `attach-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        size: file.size,
        type: file.type,
        url,
        thumbnailUrl,
        uploadedAt: Date.now()
      }
    })
  )

  // 清空上传列表
  uploadingFiles.value = []

  // 触发上传完成事件
  emit('uploaded', attachments)
}

// 生成图片缩略图
const generateThumbnail = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')!

        // 设置缩略图尺寸
        const maxSize = 200
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > maxSize) {
            height *= maxSize / width
            width = maxSize
          }
        } else {
          if (height > maxSize) {
            width *= maxSize / height
            height = maxSize
          }
        }

        canvas.width = width
        canvas.height = height
        ctx.drawImage(img, 0, 0, width, height)

        resolve(canvas.toDataURL('image/jpeg', 0.8))
      }

      img.src = e.target?.result as string
    }

    reader.readAsDataURL(file)
  })
}

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

// 监听全局粘贴事件
onMounted(() => {
  window.addEventListener('paste', handlePaste)
})

onUnmounted(() => {
  window.removeEventListener('paste', handlePaste)
})
</script>
