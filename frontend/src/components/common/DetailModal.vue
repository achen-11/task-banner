<template>
  <!-- 字段变更详情弹窗 -->
  <el-dialog
    v-model="fieldChangeModalVisible"
    title="变更详情"
    width="1000px"
    align-center
    :append-to-body="true"
    class="task-detail-dialog"
    @keydown.esc.stop="handleFieldChangeEsc"
  >
    <div v-if="selectedActivity" class="flex flex-col h-full">
      <!-- 用户信息和摘要 -->
      <div class="pb-4 border-b">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
            {{ getUserDisplayName(selectedActivity.user).charAt(0).toUpperCase() }}
          </div>
          <div>
            <div class="font-medium text-gray-900">{{ getUserDisplayName(selectedActivity.user) }}</div>
            <div class="text-xs text-gray-500">{{ formatRelativeTime(selectedActivity.timestamp) }}</div>
          </div>
        </div>

        <div v-if="selectedActivity.summary" class="bg-blue-50 rounded-lg p-3">
          <div class="text-xs font-medium text-blue-700 mb-1">任务摘要</div>
          <div class="text-sm text-gray-900">{{ selectedActivity.summary }}</div>
        </div>
      </div>

      <!-- 合并的多个变更：Tab 栏切换 -->
      <template v-if="selectedActivity.grouped && selectedActivity.fieldChanges && selectedActivity.fieldChanges.length > 1">
        <div class="flex gap-2 py-3 overflow-x-auto border-b">
          <button
            v-for="(change, idx) in selectedActivity.fieldChanges"
            :key="idx"
            @click="currentFieldChangeIndex = idx"
            class="px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors"
            :class="currentFieldChangeIndex === idx
              ? 'bg-blue-100 text-blue-700 border border-blue-300'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
          >
            {{ formatFieldName(change.field) }}
          </button>
        </div>

        <!-- 当前选中字段的变更对比 -->
        <div class="flex-1 py-4" style="max-height: 500px; overflow-y: auto;">
          <div v-if="currentFieldChange" class="grid grid-cols-2 gap-4 h-full">
            <!-- 旧值 -->
            <div class="flex flex-col">
              <div class="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <span class="text-red-600">−</span>
                旧值
              </div>
              <div class="flex-1 bg-red-50 rounded-lg p-4 border border-red-200 overflow-y-auto" style="max-height: 450px;">
                <!-- content 字段使用 Markdown 渲染 -->
                <MarkdownEditor
                  v-if="currentFieldChange.field === 'content'"
                  :model-value="currentFieldChange.oldValue || ''"
                  :read-only="true"
                />
                <!-- 其他字段使用纯文本显示 -->
                <div v-else class="text-sm text-gray-900 whitespace-pre-wrap break-words">
                  {{ formatFieldValue(currentFieldChange.field, currentFieldChange.oldValue) }}
                </div>
              </div>
            </div>

            <!-- 新值 -->
            <div class="flex flex-col">
              <div class="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <span class="text-green-600">+</span>
                新值
              </div>
              <div class="flex-1 bg-green-50 rounded-lg p-4 border border-green-200 overflow-y-auto" style="max-height: 450px;">
                <!-- content 字段使用 Markdown 渲染 -->
                <MarkdownEditor
                  v-if="currentFieldChange.field === 'content'"
                  :model-value="currentFieldChange.newValue || ''"
                  :read-only="true"
                />
                <!-- 其他字段使用纯文本显示 -->
                <div v-else class="text-sm text-gray-900 whitespace-pre-wrap break-words">
                  {{ formatFieldValue(currentFieldChange.field, currentFieldChange.newValue) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- 单个字段变更：左右分栏 -->
      <template v-else>
        <div class="py-3 border-b">
          <div class="text-sm font-medium text-gray-700">
            字段：{{ formatFieldName(selectedActivity.field) }}
          </div>
        </div>

        <div class="flex-1 py-4" style="max-height: 500px; overflow-y: auto;">
          <div class="grid grid-cols-2 gap-4 h-full">
            <!-- 旧值 -->
            <div class="flex flex-col">
              <div class="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <span class="text-red-600">−</span>
                旧值
              </div>
              <div class="flex-1 bg-red-50 rounded-lg p-4 border border-red-200 overflow-y-auto" style="max-height: 450px;">
                <!-- content 字段使用 Markdown 渲染 -->
                <MarkdownEditor
                  v-if="selectedActivity.field === 'content'"
                  :model-value="selectedActivity.oldValue || ''"
                  :read-only="true"
                />
                <!-- 其他字段使用纯文本显示 -->
                <div v-else class="text-sm text-gray-900 whitespace-pre-wrap break-words">
                  {{ formatFieldValue(selectedActivity.field, selectedActivity.oldValue) }}
                </div>
              </div>
            </div>

            <!-- 新值 -->
            <div class="flex flex-col">
              <div class="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <span class="text-green-600">+</span>
                新值
              </div>
              <div class="flex-1 bg-green-50 rounded-lg p-4 border border-green-200 overflow-y-auto" style="max-height: 450px;">
                <!-- content 字段使用 Markdown 渲染 -->
                <MarkdownEditor
                  v-if="selectedActivity.field === 'content'"
                  :model-value="selectedActivity.newValue || ''"
                  :read-only="true"
                />
                <!-- 其他字段使用纯文本显示 -->
                <div v-else class="text-sm text-gray-900 whitespace-pre-wrap break-words">
                  {{ formatFieldValue(selectedActivity.field, selectedActivity.newValue) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <template #footer>
      <el-button @click="fieldChangeModalVisible = false">关闭</el-button>
    </template>
  </el-dialog>

  <!-- 评论详情弹窗 -->
  <el-dialog
    v-model="commentDetailModalVisible"
    title="评论详情"
    width="600px"
    align-center
    :append-to-body="true"
    @keydown.esc.stop="handleCommentEsc"
  >
    <div v-if="selectedComment" class="space-y-4">
      <!-- 用户信息 -->
      <div class="flex items-center gap-3 pb-4 border-b border-gray-200">
        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-semibold">
          {{ getUserDisplayName(selectedComment.user).charAt(0).toUpperCase() }}
        </div>
        <div>
          <div class="font-medium text-gray-900">{{ getUserDisplayName(selectedComment.user) }}</div>
          <div class="text-xs text-gray-500">{{ formatRelativeTime(selectedComment.timestamp) }}</div>
        </div>
      </div>

      <!-- 摘要（如果有） -->
      <div v-if="selectedComment.summary" class="bg-blue-50 rounded-lg p-3">
        <div class="text-xs font-medium text-blue-700 mb-1">评论摘要</div>
        <div class="text-sm text-gray-900">{{ selectedComment.summary }}</div>
      </div>

      <!-- 评论完整内容 -->
      <div class="max-h-96 overflow-y-auto">
        <MarkdownEditor
          :model-value="selectedComment.content || ''"
          :read-only="true"
        />
      </div>
    </div>

    <template #footer>
      <el-button @click="commentDetailModalVisible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import MarkdownEditor from '../common/MarkdownEditor.vue'
import { formatRelativeTime } from '@/utils/time'

interface FieldChange {
  field: string
  oldValue: string
  newValue: string
  content: string
}

interface Activity {
  id: string
  type: 'comment' | 'field_change' | 'system'
  user?: {
    _id: string
    username?: string
    displayName?: string
    email?: string
  } | null
  userId?: string
  content?: string
  timestamp: number
  grouped?: boolean
  changes?: string[]
  fieldChanges?: FieldChange[]
  field?: string
  oldValue?: string
  newValue?: string
  summary?: string
}

// 字段变更详情弹窗状态
const fieldChangeModalVisible = ref(false)
const selectedActivity = ref<Activity | null>(null)
const currentFieldChangeIndex = ref(0)

// 评论详情弹窗状态
const commentDetailModalVisible = ref(false)
const selectedComment = ref<Activity | null>(null)

// 当前选中的字段变更
const currentFieldChange = computed(() => {
  if (!selectedActivity.value?.fieldChanges) return null
  return selectedActivity.value.fieldChanges[currentFieldChangeIndex.value]
})

// 显示字段变更详情弹窗
const showFieldChangeDetail = (activity: Activity) => {
  selectedActivity.value = activity
  currentFieldChangeIndex.value = 0 // 重置到第一个 tab
  fieldChangeModalVisible.value = true
}

// 显示评论详情弹窗
const showCommentDetail = (activity: Activity) => {
  selectedComment.value = activity
  commentDetailModalVisible.value = true
}

// 处理字段变更弹窗的ESC键事件
const handleFieldChangeEsc = () => {
  fieldChangeModalVisible.value = false
}

// 处理评论详情弹窗的ESC键事件
const handleCommentEsc = () => {
  commentDetailModalVisible.value = false
}

// 简单的 Markdown 渲染函数
const renderMarkdown = (content: string): string => {
  if (!content) return ''
  // 简单处理换行
  return content
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
}

// 字段名本地化
const formatFieldName = (field?: string): string => {
  if (!field) return '未知字段'

  const fieldNames: Record<string, string> = {
    title: '任务标题',
    content: '任务描述',
    status: '状态',
    priority: '优先级',
    assigneeId: '指派人',
    dueDate: '截止日期',
    progress: '进度',
    task: '任务'
  }

  return fieldNames[field] || field
}

// 值格式化显示
const formatFieldValue = (field?: string, value?: string): string => {
  if (!value) return '未设置'

  // 状态格式化
  if (field === 'status') {
    const statusMap: Record<string, string> = {
      todo: '待办',
      in_progress: '进行中',
      completed: '已完成'
    }
    return statusMap[value] || value
  }

  // 优先级格式化
  if (field === 'priority') {
    const priorityMap: Record<string, string> = {
      low: '低',
      medium: '中',
      high: '高'
    }
    return priorityMap[value] || value
  }

  // 日期格式化
  if (field === 'dueDate') {
    if (!value || value === '0') return '未设置'
    const timestamp = Number(value)
    if (isNaN(timestamp)) return value
    const date = new Date(timestamp)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 进度格式化
  if (field === 'progress') {
    return `${value}%`
  }

  return value
}

// 获取用户显示名称
const getUserDisplayName = (user: Activity['user']): string => {
  if (!user) return '未知用户'
  return user.displayName || user.username || user.email || user._id || '未知用户'
}

// 格式化相对时间

// 暴露方法给父组件使用
defineExpose({
  showFieldChangeDetail,
  showCommentDetail
})
</script>