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

interface Attachment {
  _id: string
  name: string
  size: number
  type: string
  url: string
  thumbnailUrl?: string
  uploadedAt: number
}

interface Props {
  attachments: Attachment[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'delete', id: string): void
}>()

// 预览图片索引
const previewImageIndex = ref<number | null>(null)

// 筛选出图片类型的附件
const imageAttachments = computed(() => {
  return props.attachments
    .filter(att => att.type.startsWith('image/'))
    .map(att => ({
      url: att.url,
      name: att.name
    }))
})

// 处理预览
const handlePreview = (attachment: Attachment) => {
  if (attachment.type.startsWith('image/')) {
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
const handleDelete = (id: string) => {
  emit('delete', id)
}
</script>
