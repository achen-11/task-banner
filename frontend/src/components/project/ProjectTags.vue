<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-100">
    <!-- Header -->
    <div class="p-4 border-b border-gray-100 flex items-center justify-between">
      <h2 class="text-lg font-semibold text-gray-900">项目标签</h2>
      <el-tooltip content="新建标签 (N)" placement="bottom">
        <el-button
          @click="handleCreate"
          type="primary"
          :style="{ backgroundColor: '#3762E3', borderColor: '#3762E3' }"
        >
          <el-icon class="mr-1">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </el-icon>
          新建标签
        </el-button>
      </el-tooltip>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="p-8 text-center text-gray-400">
      <svg class="w-8 h-8 animate-spin mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
      <p>加载中...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="tags.length === 0" class="p-8 text-center text-gray-400">
      <svg class="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
      <p>暂无标签</p>
      <p class="text-sm mt-1">标签可以帮助你快速筛选和分类任务，并为 AI 提供上下文提示</p>
    </div>

    <!-- Tag List -->
    <div v-else class="p-4">
      <div class="space-y-2">
        <div
          v-for="tag in tags"
          :key="tag._id"
          class="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
        >
          <!-- 颜色标识 -->
          <div
            class="w-4 h-4 rounded flex-shrink-0"
            :style="{ backgroundColor: tag.color || '#3B82F6' }"
          ></div>

          <!-- 标签信息 -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="font-medium text-gray-900">{{ tag.name }}</span>
              <span
                v-if="tag.showInQuickBar"
                class="px-2 py-0.5 text-xs font-medium text-blue-700 bg-blue-50 rounded"
              >
                快速访问
              </span>
            </div>
            <p v-if="tag.prompt" class="text-sm text-gray-500 mt-1 truncate">
              {{ tag.prompt }}
            </p>
          </div>

          <!-- 操作按钮 -->
          <div class="flex items-center gap-2 flex-shrink-0">
            <button
              @click="handleEdit(tag)"
              class="px-3 py-1.5 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            >
              编辑
            </button>
            <button
              @click="handleDelete(tag)"
              class="px-3 py-1.5 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            >
              删除
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Tag Dialog -->
    <TagDialog
      v-model="showDialog"
      :project-id="projectId"
      :tag="currentTag"
      @success="handleSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessageBox, ElMessage, ElIcon } from 'element-plus'
import { getProjectTags, deleteTag } from '@/api/tag'
import TagDialog from '@/components/tag/TagDialog.vue'
import type { Tag } from '@/types/tag'

interface Props {
  projectId: string
}

const props = defineProps<Props>()

const loading = ref(false)
const tags = ref<Tag[]>([])
const showDialog = ref(false)
const currentTag = ref<Tag | null>(null)

// 加载标签列表
const loadTags = async () => {
  try {
    loading.value = true
    const response = await getProjectTags(props.projectId)
    tags.value = response.items.sort((a, b) => a.order - b.order)
  } catch (error) {
    console.error('Failed to load tags:', error)
    ElMessage.error('加载标签失败')
  } finally {
    loading.value = false
  }
}

// 创建标签
const handleCreate = () => {
  currentTag.value = null
  showDialog.value = true
}

// 编辑标签
const handleEdit = (tag: Tag) => {
  currentTag.value = tag
  showDialog.value = true
}

// 删除标签
const handleDelete = async (tag: Tag) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除标签「${tag.name}」吗？删除后，使用此标签的任务将不再关联此标签。`,
      '删除标签',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )

    await deleteTag(tag._id)
    ElMessage.success('标签已删除')
    await loadTags()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('Failed to delete tag:', error)
      ElMessage.error('删除标签失败')
    }
  }
}

// 保存成功回调
const handleSuccess = async () => {
  await loadTags()
}

onMounted(() => {
  loadTags()
  // 添加快捷键监听
  document.addEventListener('keydown', handleKeyDown)
})

// 组件卸载时移除监听器
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})

// 处理快捷键
const handleKeyDown = (event: KeyboardEvent) => {
  // 检查是否在其他输入框中
  const target = event.target as HTMLElement
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

  // N键 - 新建标签
  if (event.key === 'n' || event.key === 'N') {
    event.preventDefault()
    handleCreate()
  }
}
</script>
