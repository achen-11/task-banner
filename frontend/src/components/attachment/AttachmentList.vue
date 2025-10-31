<template>
  <div class="attachment-list">
    <!-- 附件网格 -->
    <div
      v-if="attachments.length > 0"
      class="grid grid-cols-2 gap-3"
    >
      <AttachmentCard
        v-for="attachment in attachments"
        :key="attachment._id"
        :attachment="attachment"
        @preview="handlePreview"
        @delete="handleDelete"
      />
    </div>

    <!-- 空状态 -->
    <div v-else class="py-8 text-center text-gray-400 text-sm">
      暂无附件
    </div>

    <!-- 图片预览 Lightbox -->
    <ImageLightbox
      v-if="previewImageIndex !== null"
      :images="imageAttachments"
      :initial-index="previewImageIndex"
      @close="previewImageIndex = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import AttachmentCard from './AttachmentCard.vue'
import ImageLightbox from './ImageLightbox.vue'
import { deleteAttachment as deleteAttachmentAPI } from '@/api/attachment'

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
  attachments: Attachment[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'delete', id: string): void
  (e: 'error', message: string): void
}>()

// 预览图片索引
const previewImageIndex = ref<number | null>(null)
const isDeleting = ref(false)

// 筛选出图片类型的附件
const imageAttachments = computed(() => {
  return props.attachments
    .filter(att => att.mimeType.startsWith('image/'))
    .map(att => ({
      url: att.url,
      name: att.name
    }))
})

// 处理预览
const handlePreview = (attachment: Attachment) => {
  if (attachment.mimeType.startsWith('image/')) {
    // 找到该图片在图片列表中的索引
    const index = imageAttachments.value.findIndex(img => img.url === attachment.url)
    if (index !== -1) {
      previewImageIndex.value = index
    }
  } else {
    // 非图片类型，直接打开 URL
    window.open(attachment.url, '_blank')
  }
}

// 处理删除
const handleDelete = async (id: string) => {
  if (isDeleting.value) return

  const confirmed = confirm('确定要删除这个附件吗？')
  if (!confirmed) return

  isDeleting.value = true

  try {
    await deleteAttachmentAPI(id)
    emit('delete', id)
  } catch (error: any) {
    const message = error?.message || '删除失败，请重试'
    emit('error', message)
    console.error('Delete attachment error:', error)
  } finally {
    isDeleting.value = false
  }
}
</script>
