<template>
  <div class="h-full flex flex-col">
    <!-- 任务信息区域（固定在上方） -->
    <div class="flex-shrink-0 space-y-4 pb-4 border-b border-gray-200">
      <!-- 折叠按钮 -->
      <div class="flex items-center justify-end">
        <button
          class="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors"
          @click="isFieldsCollapsed = !isFieldsCollapsed"
        >
          <span>{{ isFieldsCollapsed ? '展开详情' : '收起详情' }}</span>
          <svg
            class="w-4 h-4 transition-transform"
            :class="{ 'rotate-180': !isFieldsCollapsed }"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      <!-- 紧凑的字段网格（可折叠） -->
      <div
        v-show="!isFieldsCollapsed"
        class="space-y-4"
      >
        <div class="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <!-- 状态 -->
        <div class="flex items-center gap-2">
          <label class="text-xs text-gray-500 w-16">状态</label>
          <el-select
            v-model="localTask.status"
            size="small"
            class="flex-1"
            @change="handleUpdate({ status: localTask.status })"
          >
            <el-option label="待办" value="todo" />
            <el-option label="进行中" value="in_progress" />
            <el-option label="已完成" value="completed" />
          </el-select>
        </div>

        <!-- 优先级 -->
        <div class="flex items-center gap-2">
          <label class="text-xs text-gray-500 w-16">优先级</label>
          <el-select
            v-model="localTask.priority"
            size="small"
            class="flex-1"
            @change="handleUpdate({ priority: localTask.priority })"
          >
            <el-option label="低" value="low" />
            <el-option label="中" value="medium" />
            <el-option label="高" value="high" />
          </el-select>
        </div>

        <!-- 指派人 -->
        <div class="flex items-center gap-2">
          <label class="text-xs text-gray-500 w-16">指派人</label>
          <el-select
            v-model="localTask.assigneeId"
            size="small"
            clearable
            class="flex-1"
            placeholder="未指派"
            @change="handleUpdate({ assigneeId: localTask.assigneeId })"
          >
            <el-option label="张三" value="张三" />
            <el-option label="李四" value="李四" />
            <el-option label="王五" value="王五" />
          </el-select>
        </div>

        <!-- 截止日期 -->
        <div class="flex items-center gap-2">
          <label class="text-xs text-gray-500 w-16">截止</label>
          <el-date-picker
            :model-value="localTask.dueDate"
            type="date"
            size="small"
            class="flex-1"
            placeholder="选择日期"
            format="MM/DD"
            @update:model-value="handleDueDateChange"
          />
        </div>

        <!-- 模块（多选，占满一行） -->
        <div class="col-span-2 flex items-center gap-2">
          <label class="text-xs text-gray-500 w-16">模块</label>
          <el-select
            v-model="localModules"
            multiple
            size="small"
            class="flex-1"
            placeholder="选择模块"
            @change="handleModulesChange"
          >
            <el-option label="前端" value="前端" />
            <el-option label="后端" value="后端" />
            <el-option label="设计" value="设计" />
            <el-option label="测试" value="测试" />
            <el-option label="运维" value="运维" />
          </el-select>
        </div>
        </div>

        <!-- 标签 -->
        <div>
        <label class="block text-xs text-gray-500 mb-2">标签</label>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="tagId in localTask.tagIds"
            :key="tagId"
            class="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full"
          >
            {{ tagId }}
            <button
              class="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
              @click="removeTag(tagId)"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
          <button
            class="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-gray-500 border border-dashed border-gray-300 rounded-full hover:border-blue-500 hover:text-blue-600 transition-colors"
            @click="showTagInput = true"
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            添加标签
          </button>
          <input
            v-if="showTagInput"
            ref="tagInputRef"
            v-model="newTag"
            type="text"
            class="inline-block w-24 px-2 py-1 text-xs border border-blue-500 rounded-full"
            placeholder="标签名..."
            @keydown.enter="addTag"
            @blur="showTagInput = false"
          />
        </div>
        </div>

        <!-- 元数据 -->
        <div class="grid grid-cols-2 gap-4 text-xs text-gray-500 pt-2">
        <div>
          <span class="font-medium">创建：</span>
          <span>{{ formatDate(localTask.createdAt) }}</span>
        </div>
        <div>
          <span class="font-medium">更新：</span>
          <span>{{ formatDate(localTask.updatedAt) }}</span>
        </div>
        </div>
      </div>
    </div>

    <!-- 任务描述区域（可滚动） -->
    <div class="flex-1 overflow-y-auto mt-4">
      <label class="block text-xs font-medium text-gray-500 mb-2">描述</label>
      <div class="border border-gray-200 rounded-lg overflow-hidden transition-all">
        <textarea
          v-model="localTask.content"
          rows="12"
          class="w-full px-4 py-3 text-sm text-gray-900 resize-none focus:outline-none"
          placeholder="添加任务描述...&#10;&#10;提示：未来将支持富文本编辑（Quill.js）、@提及、Markdown 等功能"
          @blur="handleUpdate({ content: localTask.content })"
        ></textarea>
      </div>
      <div class="mt-2 text-xs text-gray-400">
        支持 Markdown 语法（开发中）
      </div>

      <!-- 附件区域 -->
      <div class="mt-6">
        <div class="flex items-center justify-between mb-3">
          <label class="text-xs font-medium text-gray-500">附件</label>
          <button
            v-if="!showUploadArea"
            class="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
            @click="showUploadArea = true"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            添加附件
          </button>
        </div>

        <!-- 附件上传（可折叠） -->
        <div v-if="showUploadArea" class="mb-4">
          <AttachmentUpload
            v-if="localTask._id && localTask.projectId"
            :related-type="'task'"
            :related-id="localTask._id"
            :project-id="localTask.projectId"
            @upload="handleAttachmentUpload"
            @uploaded="handleAttachmentUploaded"
            @error="handleAttachmentError"
          />
          <button
            class="mt-2 text-xs text-gray-500 hover:text-gray-700 transition-colors"
            @click="showUploadArea = false"
          >
            收起
          </button>
        </div>

        <!-- 附件列表 -->
        <div v-if="localTask.attachments && localTask.attachments.length > 0">
          <AttachmentList
            :attachments="localTask.attachments"
            @delete="handleAttachmentDelete"
            @error="handleAttachmentError"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import AttachmentUpload from '../attachment/AttachmentUpload.vue'
import AttachmentList from '../attachment/AttachmentList.vue'
import { getAttachmentList } from '@/api/attachment'

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

interface Task {
  _id: string
  displayId: number
  projectId: string
  title: string
  status: 'todo' | 'in_progress' | 'completed'
  priority: 'low' | 'medium' | 'high'
  content?: string  // 任务描述内容（支持富文本或普通文本）
  assigneeId?: string
  creatorId: string
  moduleIds?: string[]  // 模块 ID 数组（支持多选）
  tagIds?: string[]  // 标签 ID 数组
  dueDate?: number
  progress?: number
  order: number
  attachments?: Attachment[]
  createdAt: number
  updatedAt: number
}

interface Props {
  task: Task | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update', updates: Partial<Task>): void
}>()

// 本地任务副本（用于编辑）
const localTask = ref<Task>({
  _id: '',
  displayId: 0,
  projectId: '',
  title: '',
  status: 'todo',
  priority: 'medium',
  creatorId: '',
  moduleIds: [],
  tagIds: [],
  progress: 0,
  order: 0,
  createdAt: Date.now(),
  updatedAt: Date.now()
})

// 模块多选处理（现在直接使用 localTask.moduleIds）
const localModules = computed({
  get: () => localTask.value.moduleIds || [],
  set: (value) => {
    localTask.value.moduleIds = value
  }
})

// 标签输入
const showTagInput = ref(false)
const newTag = ref('')
const tagInputRef = ref<HTMLInputElement>()

// 字段折叠状态（默认收起）
const isFieldsCollapsed = ref(false)

// 附件上传区域显示状态
const showUploadArea = ref(false)

// 监听 props 变化，更新本地副本
watch(() => props.task, async (newTask) => {
  if (newTask) {
    localTask.value = { ...newTask }

    // 加载附件列表
    if (newTask._id) {
      try {
        const attachments = await getAttachmentList('task', newTask._id)
        localTask.value.attachments = attachments
      } catch (error) {
        console.error('Failed to load attachments:', error)
        // 如果加载失败，使用空数组
        localTask.value.attachments = []
      }
    }
  }
}, { immediate: true, deep: true })

// 处理更新
const handleUpdate = (updates: Partial<Task>) => {
  emit('update', updates)
}

// 处理日期变更
const handleDueDateChange = (value: number | null) => {
  localTask.value.dueDate = value || undefined
  handleUpdate({ dueDate: value || undefined })
}

// 处理模块变更
const handleModulesChange = (value: string[]) => {
  localTask.value.moduleIds = value
  handleUpdate({ moduleIds: value })
}

// 添加标签（注意：现在应该存储标签 ID 而不是名称）
// TODO: 需要配合标签选择器使用，这里暂时保持兼容
const addTag = () => {
  if (newTag.value.trim()) {
    const tagIds = [...(localTask.value.tagIds || []), newTag.value.trim()]
    localTask.value.tagIds = tagIds
    handleUpdate({ tagIds })
    newTag.value = ''
    showTagInput.value = false
  }
}

// 移除标签
const removeTag = (tagId: string) => {
  const tagIds = (localTask.value.tagIds || []).filter(t => t !== tagId)
  localTask.value.tagIds = tagIds
  handleUpdate({ tagIds })
}

// 格式化日期
const formatDate = (timestamp: number) => {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 附件上传处理
const handleAttachmentUpload = (files: File[]) => {
  console.log('开始上传附件:', files)
}

// 附件上传完成处理
const handleAttachmentUploaded = (attachments: Attachment[]) => {
  const currentAttachments = localTask.value.attachments || []
  const newAttachments = [...currentAttachments, ...attachments]
  localTask.value.attachments = newAttachments
  // 上传完成后自动收起上传区域
  showUploadArea.value = false
}

// 附件上传错误处理
const handleAttachmentError = (message: string) => {
  console.error('附件上传失败:', message)
  ElMessage.error(message)
}

// 附件删除处理
const handleAttachmentDelete = (attachmentId: string) => {
  if (!localTask.value.attachments) return

  const newAttachments = localTask.value.attachments.filter(att => att._id !== attachmentId)
  localTask.value.attachments = newAttachments
}

// 当显示标签输入时，聚焦输入框
watch(showTagInput, async (show) => {
  if (show) {
    await nextTick()
    tagInputRef.value?.focus()
  }
})
</script>
