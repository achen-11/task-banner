<template>
  <div class="h-full flex flex-col">
    <!-- 任务信息区域（固定在上方） -->
    <div class="flex-shrink-0 space-y-4 pb-4 border-b border-gray-200 dark:border-gray-700">
      <!-- 折叠按钮和保存状态 -->
      <div class="flex items-center justify-between">
        <!-- 保存状态和保存按钮（仅查看模式） -->
        <div v-if="mode === 'view'" class="flex items-center gap-2">
          <div class="text-xs">
            <span v-if="isSaving" class="text-orange-500 dark:text-orange-400 flex items-center gap-1">
              <svg class="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              保存中...
            </span>
            <span v-else-if="hasUnsavedChanges" class="text-gray-400 dark:text-gray-500 flex items-center gap-1">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              未保存
            </span>
            <span v-else-if="lastSavedAt" class="text-green-500 dark:text-green-400 flex items-center gap-1">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              已保存
            </span>
          </div>
          <!-- 保存按钮 -->
          <button
            v-if="hasUnsavedChanges && !isSaving"
            @click="handleSave"
            class="px-2 py-1 text-xs font-medium text-white bg-blue-600 dark:bg-blue-500 rounded hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors flex items-center gap-1"
            title="保存更改 (Cmd+S)"
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            保存
          </button>
        </div>
        <div v-else class="flex-1"></div>

        <!-- 折叠按钮 -->
        <button
          class="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1 transition-colors"
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
            <el-option label="待验收" value="review" />
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
            <el-option
              v-for="member in projectMembers"
              :key="member.userId"
              :label="getUserDisplayName(member)"
              :value="member.userId"
            />
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
            <el-option
              v-for="module in projectModules"
              :key="module._id"
              :label="module.name"
              :value="module._id"
            >
              <div class="flex items-center gap-2">
                <div
                  class="w-3 h-3 rounded"
                  :style="{ backgroundColor: module.color }"
                ></div>
                <span>{{ module.name }}</span>
              </div>
            </el-option>
          </el-select>
        </div>
        </div>

        <!-- 标签 -->
        <div>
        <label class="block text-xs text-gray-500 mb-2">标签</label>
        <div class="flex flex-wrap gap-2">
          <!-- 快速访问标签 -->
          <button
            v-for="tag in quickAccessTags"
            :key="tag._id"
            @click="toggleQuickTag(tag._id)"
            class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full transition-all"
            :class="isTagSelected(tag._id)
              ? 'text-white border-none'
              : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'"
            :style="isTagSelected(tag._id) ? { backgroundColor: tag.color || '#3B82F6' } : {}"
          >
            <span
              v-if="!isTagSelected(tag._id)"
              class="w-2 h-2 rounded-full flex-shrink-0"
              :style="{ backgroundColor: tag.color || '#3B82F6' }"
            ></span>
            {{ tag.name }}
          </button>

          <!-- 已选中的其他标签 -->
          <span
            v-for="tag in selectedOtherTags"
            :key="tag._id"
            class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full text-white group transition-all"
            :style="{ backgroundColor: tag.color || '#3B82F6' }"
          >
            {{ tag.name }}
            <button
              class="opacity-0 group-hover:opacity-100 hover:bg-black/20 rounded-full p-0.5 transition-all"
              @click="removeTag(tag._id)"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>

          <!-- 添加其他标签按钮 -->
          <button
            @click="showTagSelector = true"
            class="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-gray-500 border border-dashed border-gray-300 rounded-full hover:border-blue-500 hover:text-blue-600 transition-colors"
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            其他标签
          </button>
        </div>
        </div>

        <!-- 标签选择弹窗 -->
        <TagSelector
          v-model="showTagSelector"
          :tags="projectTags"
          :selected-ids="otherTagIds"
          @confirm="handleTagsConfirm"
        />

        <!-- 元数据（仅查看模式显示） -->
        <div v-if="mode === 'view'" class="grid grid-cols-2 gap-4 text-xs text-gray-500 pt-2">
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
      <!-- 描述标签和编辑/预览切换 -->
      <div class="flex items-center justify-between mb-2">
        <label class="text-xs font-medium text-gray-500 dark:text-gray-400">描述</label>
        <div class="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
          <button
            @click="setEditorMode(false)"
            :class="{ 'active': !isPreviewMode }"
            class="mode-toggle-btn"
            title="编辑模式"
          >
            <Edit3 :size="14" />
            <span class="text-xs">编辑</span>
          </button>
          <button
            @click="setEditorMode(true)"
            :class="{ 'active': isPreviewMode }"
            class="mode-toggle-btn"
            title="预览模式"
          >
            <Eye :size="14" />
            <span class="text-xs">预览</span>
          </button>
        </div>
      </div>

      <MarkdownEditor
        ref="markdownEditorRef"
        v-model="localTask.content"
        :read-only="false"
        placeholder="添加任务描述... 支持 Markdown 语法 (Cmd+S 保存)"
        min-height="300px"
        @update:model-value="handleContentChange"
        @save="handleSave"
        @paste-file="handlePasteFile"
      />
      <div class="mt-2 text-xs text-gray-400 dark:text-gray-500">
        支持 Markdown 语法：**加粗** *斜体* - [ ] 任务列表等
      </div>

      <!-- 附件区域 -->
      <div class="mt-6">
        <div class="flex items-center justify-between mb-3">
          <label class="text-xs font-medium text-gray-500 dark:text-gray-400">附件</label>
          <button
            v-if="!showUploadArea"
            class="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 transition-colors"
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
            ref="attachmentUploadRef"
            v-if="props.projectId || localTask.projectId"
            :related-type="'task'"
            :related-id="localTask._id || 'temp'"
            :project-id="props.projectId || localTask.projectId"
            :disabled="isSaving"
            @upload="handleAttachmentUpload"
            @uploaded="handleAttachmentUploaded"
            @error="handleAttachmentError"
          />
          <div v-if="!localTask._id" class="mt-2 text-xs text-gray-500 dark:text-gray-400">
            💡 提示：附件将在任务创建后自动关联
          </div>
          <button
            class="mt-2 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
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
import MarkdownEditor from '../common/MarkdownEditor.vue'
import AttachmentUpload from '../attachment/AttachmentUpload.vue'
import AttachmentList from '../attachment/AttachmentList.vue'
import TagSelector from '../tag/TagSelector.vue'
import { getAttachmentList, updateAttachmentRelatedId } from '@/api/attachment'
import { getProjectMembers } from '@/api/project'
import { getProjectTags } from '@/api/tag'
import { getModuleList } from '@/api/module'
import { getCurrentUser } from '@/utils/auth'
import type { ProjectMember } from '@/types/project'
import type { Tag } from '@/types/tag'
import type { Module } from '@/types/module'
import { Edit3, Eye } from 'lucide-vue-next'

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
  status: 'todo' | 'in_progress' | 'completed' | 'review'
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
  mode?: 'view' | 'create'
  projectId?: string
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'view'
})

const emit = defineEmits<{
  (e: 'update', updates: Partial<Task>): void
}>()

// 项目成员列表
const projectMembers = ref<ProjectMember[]>([])

// 项目模块列表
const projectModules = ref<Module[]>([])

// 保存状态（查看模式）
const isSaving = ref(false)
const lastSavedAt = ref<number | null>(null)
const hasUnsavedChanges = ref(false)

// 获取当前用户
const currentUser = getCurrentUser()

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

// 加载项目模块列表
const loadProjectModules = async () => {
  if (!props.projectId) return
  try {
    const response = await getModuleList(props.projectId)
    projectModules.value = response.items
  } catch (error) {
    console.error('Failed to load project modules:', error)
    projectModules.value = []
  }
}

// 项目标签列表
const projectTags = ref<Tag[]>([])

// 标签选择器状态
const showTagSelector = ref(false)

// 快速访问标签（showInQuickBar: true）
const quickAccessTags = computed(() => {
  return projectTags.value.filter(tag => tag.showInQuickBar).sort((a, b) => a.order - b.order)
})

// 其他标签的 ID 列表（showInQuickBar: false 且已选中）
const otherTagIds = computed(() => {
  const quickTagIds = quickAccessTags.value.map(t => t._id)
  return (localTask.value.tagIds || []).filter(id => !quickTagIds.includes(id))
})

// 已选中的其他标签对象
const selectedOtherTags = computed(() => {
  return otherTagIds.value
    .map(id => projectTags.value.find(t => t._id === id))
    .filter((tag): tag is Tag => tag !== undefined)
})

// 字段折叠状态（默认收起）
const isFieldsCollapsed = ref(false)

// 附件上传区域显示状态
const showUploadArea = ref(false)

// Markdown 编辑器引用和状态
const markdownEditorRef = ref<InstanceType<typeof MarkdownEditor>>()
const isPreviewMode = ref(false)

// 附件上传组件引用
const attachmentUploadRef = ref<InstanceType<typeof AttachmentUpload>>()

// 设置编辑器模式
const setEditorMode = (preview: boolean) => {
  isPreviewMode.value = preview
  if (markdownEditorRef.value) {
    markdownEditorRef.value.setPreviewMode(preview)
  }
}

// 加载项目成员列表
const loadProjectMembers = async () => {
  if (!props.projectId) return

  try {
    const response = await getProjectMembers(props.projectId)
    projectMembers.value = response.items

    // 创建模式：成员列表加载完成后，设置默认指派人为当前用户
    if (props.mode === 'create' && currentUser && !localTask.value.assigneeId) {
      const currentUserId = String(currentUser._id)
      // 确认当前用户在成员列表中
      const isCurrentUserInMembers = projectMembers.value.some(m => m.userId === currentUserId)
      if (isCurrentUserInMembers) {
        localTask.value.assigneeId = currentUserId
        // 通知父组件更新
        emit('update', { assigneeId: currentUserId })
      }
    }
  } catch (error) {
    console.error('Failed to load project members:', error)
    projectMembers.value = []
  }
}

// 获取用户显示名称（优先级：displayName > username > email > userId）
const getUserDisplayName = (member: ProjectMember): string => {
  return member.displayName || member.username || member.email || member.userId
}

// 加载项目标签列表
const loadProjectTags = async () => {
  if (!props.projectId) return

  try {
    const response = await getProjectTags(props.projectId)
    projectTags.value = response.items
  } catch (error) {
    console.error('Failed to load project tags:', error)
    projectTags.value = []
  }
}

// 判断标签是否已选中
const isTagSelected = (tagId: string): boolean => {
  return (localTask.value.tagIds || []).includes(tagId)
}

// 切换快速访问标签
const toggleQuickTag = (tagId: string) => {
  const tagIds = localTask.value.tagIds || []
  const index = tagIds.indexOf(tagId)

  if (index > -1) {
    // 已选中，取消选中
    tagIds.splice(index, 1)
  } else {
    // 未选中，添加
    tagIds.push(tagId)
  }

  localTask.value.tagIds = [...tagIds]

  // 创建模式：立即通知父组件更新
  if (props.mode === 'create') {
    emit('update', { tagIds: localTask.value.tagIds })
  }

  // 查看模式：标记为未保存，等待手动保存
  if (props.mode === 'view') {
    hasUnsavedChanges.value = true
  }
}

// 处理其他标签选择确认
const handleTagsConfirm = (selectedIds: string[]) => {
  // 获取快速访问标签的 ID
  const quickTagIds = quickAccessTags.value.map(t => t._id).filter(id => isTagSelected(id))

  // 合并快速访问标签和其他标签
  const allTagIds = [...quickTagIds, ...selectedIds]

  localTask.value.tagIds = allTagIds

  // 创建模式：立即通知父组件更新
  if (props.mode === 'create') {
    emit('update', { tagIds: allTagIds })
  }

  // 查看模式：标记为未保存，等待手动保存
  if (props.mode === 'view') {
    hasUnsavedChanges.value = true
  }
}

// 移除标签
const removeTag = (tagId: string) => {
  const tagIds = (localTask.value.tagIds || []).filter(id => id !== tagId)
  localTask.value.tagIds = tagIds

  // 创建模式：立即通知父组件更新
  if (props.mode === 'create') {
    emit('update', { tagIds })
  }

  // 查看模式：标记为未保存，等待手动保存
  if (props.mode === 'view') {
    hasUnsavedChanges.value = true
  }
}

// 监听 props 变化，更新本地副本
watch(() => props.task, async (newTask) => {
  if (newTask) {
    localTask.value = { ...newTask }

    // 重置保存状态
    hasUnsavedChanges.value = false

    // 创建模式：只设置 creatorId，等待成员列表加载后再设置 assigneeId
    if (props.mode === 'create' && currentUser && !localTask.value.creatorId) {
      localTask.value.creatorId = String(currentUser._id)
    }

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

// 监听 projectId 变化，加载项目成员和标签
watch(() => props.projectId, async (newProjectId) => {
  if (newProjectId) {
    // 更新 localTask 的 projectId（用于附件上传等）
    if (!localTask.value.projectId) {
      localTask.value.projectId = newProjectId
    }
    
    await Promise.all([
      loadProjectMembers(),
      loadProjectModules(),
      loadProjectTags()
    ])
  }
}, { immediate: true })

// 处理任务描述变更
const handleContentChange = (newContent: string) => {
  localTask.value.content = newContent

  // 创建模式：立即通知父组件更新
  if (props.mode === 'create') {
    emit('update', { content: newContent })
  }

  // 查看模式：标记为未保存，等待手动保存
  if (props.mode === 'view') {
    hasUnsavedChanges.value = true
  }
}

// 处理 Cmd+S 保存（同时保存 content 和 tagIds）
const handleSave = () => {
  if (props.mode === 'view' && hasUnsavedChanges.value) {
    handleUpdate({
      content: localTask.value.content,
      tagIds: localTask.value.tagIds
    })
  }
}

// 处理更新
const handleUpdate = async (updates: Partial<Task>) => {
  // 查看模式下显示保存状态
  if (props.mode === 'view') {
    isSaving.value = true
    hasUnsavedChanges.value = false
  }

  emit('update', updates)

  // 模拟保存完成（实际应该在父组件更新成功后通知）
  if (props.mode === 'view') {
    setTimeout(() => {
      isSaving.value = false
      lastSavedAt.value = Date.now()
    }, 500)
  }
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
const handleAttachmentUploaded = async (attachments: Attachment[]) => {
  if (localTask.value._id && localTask.value._id !== 'temp') {
    // 任务已存在，直接添加到附件列表
    const currentAttachments = localTask.value.attachments || []
    const newAttachments = [...currentAttachments, ...attachments]
    localTask.value.attachments = newAttachments

    // 查看模式：标记为未保存，等待手动保存
    if (props.mode === 'view') {
      hasUnsavedChanges.value = true
    }
  } else {
    // 新建任务模式：使用临时 ID 'temp' 上传的附件，暂存显示
    if (!localTask.value.attachments) {
      localTask.value.attachments = []
    }
    localTask.value.attachments.push(...attachments)
    
    ElMessage.success(`已添加 ${attachments.length} 个附件，将在任务创建后自动关联`)
  }
  
  // 上传完成后自动收起上传区域
  showUploadArea.value = false
}

// 暴露方法供父组件调用：任务创建后关联附件
const associatePendingAttachments = async (taskId: string) => {
  // 更新所有使用临时 ID 'temp' 的附件
  try {
    const result = await updateAttachmentRelatedId('temp', taskId, 'task')
    if (result.count > 0) {
      // 重新加载附件列表
      const attachments = await getAttachmentList('task', taskId)
      localTask.value.attachments = attachments
      ElMessage.success(`已关联 ${result.count} 个附件`)
    }
  } catch (error) {
    console.error('关联附件失败:', error)
    ElMessage.error('关联附件失败，请手动重新上传')
  }
}

// 暴露方法
defineExpose({
  associatePendingAttachments
})

// 处理粘贴文件
const handlePasteFile = async (files: File[]) => {
  // 使用 props.projectId 或 localTask.projectId
  const projectId = props.projectId || localTask.value.projectId
  if (!projectId) {
    ElMessage.warning('请先选择项目')
    return
  }

  if (files.length === 0) return

  // 确保 localTask 有 projectId（用于附件上传组件）
  if (!localTask.value.projectId && projectId) {
    localTask.value.projectId = projectId
  }

  // 显示上传区域
  if (!showUploadArea.value) {
    showUploadArea.value = true
  }

  // 等待 DOM 更新后触发上传
  await nextTick()
  
  // 通过 ref 调用附件上传组件的上传方法
  if (attachmentUploadRef.value && 'uploadFiles' in attachmentUploadRef.value) {
    attachmentUploadRef.value.uploadFiles(files)
  } else {
    ElMessage.warning('附件上传功能暂不可用，请稍后重试')
  }
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
</script>

<style scoped>
.mode-toggle-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 6px;
  border: none;
  background-color: transparent;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 12px;
  font-weight: 500;
}

.mode-toggle-btn:hover {
  background-color: #e5e7eb;
  color: #374151;
}

.mode-toggle-btn.active {
  background-color: #ffffff;
  color: #3b82f6;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.dark .mode-toggle-btn {
  color: #9ca3af;
}

.dark .mode-toggle-btn:hover {
  background-color: #4b5563;
  color: #d1d5db;
}

.dark .mode-toggle-btn.active {
  background-color: #374151;
  color: #60a5fa;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}
</style>
