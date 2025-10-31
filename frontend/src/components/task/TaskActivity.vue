<template>
  <div class="h-full flex flex-col">
    <!-- 标题和过滤器（固定在顶部） -->
    <div class="flex-shrink-0 flex items-center justify-between pb-3 border-b border-gray-200">
      <h3 class="text-lg font-semibold text-gray-900">
        {{ props.commentSelectionMode ? `选择评论 (${props.selectedCommentIds?.length || 0})` : '活动历史' }}
      </h3>
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
            {{ getUserDisplayName(activity.user).charAt(0).toUpperCase() }}
          </div>

          <!-- 活动内容 -->
          <div class="flex-1 min-w-0">
            <!-- 评论类型 -->
            <div v-if="activity.type === 'comment'"
                 class="bg-white border rounded-lg p-4 hover:shadow-sm transition-shadow relative"
                 :class="props.commentSelectionMode
                   ? 'border-blue-300 cursor-pointer hover:border-blue-400'
                   : 'border-gray-200'"
                 @click="props.commentSelectionMode ? toggleCommentSelection(activity.id) : null">
              <!-- 选择模式复选框 -->
              <div v-if="props.commentSelectionMode"
                   class="absolute top-3 left-3 z-10">
                <input type="checkbox"
                       :checked="props.selectedCommentIds?.includes(activity.id)"
                       @change="toggleCommentSelection(activity.id)"
                       @click.stop
                       class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500">
              </div>

              <div class="flex items-start justify-between mb-2"
                   :class="{ 'ml-8': props.commentSelectionMode }">
                <div class="flex items-center justify-between w-full">
                  <div class="flex items-center gap-2">
                    <span class="font-medium text-sm text-gray-900">{{ getUserDisplayName(activity.user) }}</span>
                    <!-- AI 标签 -->
                    <span v-if="activity.commentType === 'ai_completion'"
                          class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                      AI
                    </span>
                    <span class="text-xs text-gray-500">{{ formatRelativeTime(activity.timestamp) }}</span>
                  </div>
                  <!-- 编辑删除按钮组 -->
                  <div v-if="!props.commentSelectionMode && canEditComment(activity)" class="flex items-center gap-1">
                    <button @click="startEditComment(activity)"
                            class="text-gray-400 hover:text-blue-600 transition-colors p-1"
                            title="编辑评论">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button @click="deleteComment(activity.id)"
                            class="text-gray-400 hover:text-red-600 transition-colors p-1"
                            title="删除评论">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              <!-- 评论内容 - 支持摘要和截断 -->
              <div class="text-sm text-gray-700">
                <template v-if="activity.summary">
                  <!-- 显示摘要 -->
                  <div class="mb-2">
                    <div v-html="renderMarkdown(activity.summary)"></div>
                  </div>
                  <!-- 有summary时显示查看详情按钮 -->
                  <button
                    v-if="!props.commentSelectionMode"
                    class="text-xs text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1"
                    @click.stop="showCommentDetailModal(activity)"
                  >
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    查看详情
                  </button>
                </template>
                <template v-else>
                  <!-- 没有摘要时，检查内容是否需要截断 -->
                  <div v-if="shouldTruncateContent(activity.content)">
                    <div class="mb-2">
                      <div v-html="renderMarkdown(truncateContent(activity.content))"></div>
                    </div>
                    <button
                      v-if="!props.commentSelectionMode"
                      class="text-xs text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1"
                      @click.stop="showCommentDetailModal(activity)"
                    >
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      查看详情
                    </button>
                  </div>
                  <!-- 正常显示模式（不需要截断时） -->
                  <MarkdownEditor
                    v-else
                    :model-value="activity.content"
                    :read-only="true"
                  />
                </template>
              </div>

              <!-- 反应表情 -->
              <div v-if="!props.commentSelectionMode" class="flex items-center gap-2 mt-3">
                <!-- 显示现有反应 -->
                <div class="flex items-center gap-1">
                  <template v-for="(reaction, emoji) in reactions[activity.id]" :key="emoji">
                    <button @click="handleToggleReaction(activity.id, emoji)"
                            class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-colors"
                            :class="isUserReaction(activity.id, emoji)
                              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'">
                      {{ emoji }} <span>{{ reaction.count }}</span>
                    </button>
                  </template>
                </div>

                <!-- 表情选择器 -->
                <div class="relative">
                  <button @click="toggleReactionPicker(activity.id)"
                          class="px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
                    添加反应
                  </button>

                  <!-- 表情选择面板 -->
                  <div v-if="showReactionPicker === activity.id"
                       class="absolute bottom-full left-0 mb-2 p-3 bg-white border border-gray-200 rounded-lg shadow-lg z-10 w-64 min-w-64">
                    <div class="grid grid-cols-5 gap-2">
                      <button v-for="emoji in commonEmojis"
                              :key="emoji"
                              @click="addReaction(activity.id, emoji)"
                              class="p-3 hover:bg-gray-100 rounded transition-colors text-lg flex items-center justify-center min-h-[2rem] min-w-[2rem]">
                        {{ emoji }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 字段变更类型（智能分组） -->
            <div v-else-if="activity.type === 'field_change'" class="py-2">
              <!-- 用户名和时间（上面） -->
              <div class="flex items-center gap-2 mb-1">
                <span class="font-medium text-sm text-gray-900">{{ getUserDisplayName(activity.user) }}</span>
                <span class="text-xs text-gray-500">{{ formatRelativeTime(activity.timestamp) }}</span>
              </div>

              <!-- 内容（下面） -->
              <div class="text-sm text-gray-600">
                <template v-if="activity.summary">
                  <!-- 显示摘要 -->
                  <div>
                    <div class="mb-1">{{ activity.summary }}</div>
                    <button
                      class="text-xs text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1"
                      @click="showDetailModal(activity)"
                    >
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      查看详情
                    </button>
                  </div>
                </template>
                <template v-else>
                  <!-- 没有摘要时显示完整内容 -->
                  <template v-if="activity.grouped && activity.changes && activity.changes.length > 1">
                    <div class="mb-1">{{ activity.content }}</div>
                    <!-- 分组的多个字段变更 -->
                    <div class="mt-2 space-y-1 pl-3 border-l-2 border-gray-200">
                      <div
                        v-for="(change, idx) in activity.changes"
                        :key="idx"
                        class="text-xs text-gray-600"
                      >
                        <!-- 对每个变更也应用截断逻辑 -->
                        {{ shouldTruncateContent(change) ? truncateContent(change) : change }}
                      </div>
                    </div>
                    <!-- 如果有超长内容，提供查看详情按钮 -->
                    <button
                      v-if="activity.changes.some(c => shouldTruncateContent(c))"
                      class="mt-2 text-xs text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1"
                      @click="showDetailModal(activity)"
                    >
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      查看详情
                    </button>
                  </template>
                  <template v-else>
                    <!-- 单条变更，检查是否需要截断 -->
                    <div v-if="shouldTruncateContent(activity.content)">
                      <div class="mb-1">{{ truncateContent(activity.content) }}</div>
                      <button
                        class="text-xs text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1"
                        @click="showDetailModal(activity)"
                      >
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        查看详情
                      </button>
                    </div>
                    <span v-else>{{ activity.content }}</span>
                  </template>
                </template>
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
    <div v-if="!props.commentSelectionMode" class="flex-shrink-0 border-t border-gray-200 pt-3">
      <!-- 编辑模式指示器 -->
      <div v-if="editingCommentId" class="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
        <div class="flex items-center justify-between">
          <span class="text-sm text-blue-700">正在编辑评论</span>
          <button @click="cancelEdit"
                  class="text-xs text-blue-600 hover:text-blue-700 hover:underline">
            取消编辑
          </button>
        </div>
      </div>

      <MarkdownEditor
        v-model="newComment"
        :placeholder="editingCommentId ? '编辑评论... 支持 Markdown 语法' : '添加评论... 支持 Markdown 语法'"
        min-height="100px"
        @submit="addComment"
      />
      <div class="flex justify-end mt-2">
        <button
          class="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors flex items-center gap-2"
          :class="editingCommentId
            ? 'bg-green-600 hover:bg-green-700'
            : 'bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed'"
          :disabled="!newComment || newComment.trim() === ''"
          @click="addComment"
        >
          {{ editingCommentId ? '保存编辑' : '发送评论' }}
          <svg v-if="newComment && newComment.trim()" class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </button>
      </div>
    </div>

    <!-- 详情弹窗组件 -->
    <DetailModal ref="detailModalRef" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import MarkdownEditor from '../common/MarkdownEditor.vue'
import DetailModal from '../common/DetailModal.vue'
import { getTaskActivities, addTaskComment, updateTaskComment, deleteTaskComment, toggleCommentReaction, getCommentReactions, type TaskActivity as APITaskActivity } from '@/api/task'
import { formatRelativeTime } from '@/utils/time'
import { getCurrentUser } from '@/utils/auth'

interface Task {
  _id: string
  title: string
  status: string
  priority: string
  createdAt: number
  updatedAt: number
}

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
  commentType?: string // 'user' | 'ai_completion' | 'ai_revision' | 'system'
}

interface Props {
  task: Task | null
  commentSelectionMode?: boolean
  selectedCommentIds?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  commentSelectionMode: false,
  selectedCommentIds: () => []
})

const emit = defineEmits<{
  (e: 'commentSelectionChange', selectedIds: string[]): void
}>()

// 过滤器
const filters = [
  { label: '全部', value: 'all' as const },
  { label: '评论', value: 'comments' as const },
  { label: '历史', value: 'history' as const }
]

const currentFilter = ref<'all' | 'comments' | 'history'>('all')

// 新评论
const newComment = ref('')

// 活动数据
const activities = ref<Activity[]>([])
const isLoadingActivities = ref(false)

// 详情弹窗组件引用
const detailModalRef = ref<InstanceType<typeof DetailModal>>()

// 编辑状态
const editingCommentId = ref<string | null>(null)
const editingContent = ref('')
const editingMode = ref<'edit' | 'delete'>('edit')

// 反应相关状态
const reactions = ref<Record<string, Record<string, { count: number; users: any[] }>>>({})
const showReactionPicker = ref<string | null>(null)

// 常用表情符号
const commonEmojis = ['👍', '👎', '❤️', '😄', '😮', '😢', '😂', '🎉', '🔥', '💯']

// 当前用户信息
const currentUser = computed(() => getCurrentUser())

// 检查用户是否可以编辑/删除评论
const canEditComment = (activity: Activity): boolean => {
  const user = currentUser.value
  if (!user || !activity.user) return false

  // 如果是评论作者，可以编辑
  if (activity.user._id === user._id.toString() || activity.userId === user._id.toString()) {
    return true
  }

  // 如果是管理员，可以编辑
  if (user.isAdmin) {
    return true
  }

  return false
}

// 加载活动历史
const loadActivities = async () => {
  if (!props.task || !props.task._id) return

  isLoadingActivities.value = true
  try {
    const data = await getTaskActivities(props.task._id)

    // 转换 API 数据格式为组件格式
    activities.value = data.map(activity => {
      if (activity.type === 'comment') {
        return {
          id: activity.id,
          type: 'comment' as const,
          user: activity.user || null,
          userId: activity.userId,
          content: activity.content || '',
          timestamp: activity.timestamp,
          summary: activity.summary || '',
          commentType: activity.commentType || 'user'
        }
      } else if (activity.type === 'field_change') {
        // 生成字段变更描述
        const content = generateFieldChangeContent(
          activity.field,
          activity.oldValue,
          activity.newValue,
          activity.action
        )
        return {
          id: activity.id,
          type: 'field_change' as const,
          user: activity.user || null,
          userId: activity.userId,
          content,
          timestamp: activity.timestamp,
          field: activity.field,
          oldValue: activity.oldValue,
          newValue: activity.newValue,
          summary: activity.summary || ''
        }
      } else {
        return {
          id: activity.id,
          type: 'system' as const,
          user: null,
          content: activity.content || '',
          timestamp: activity.timestamp
        }
      }
    })

    // 合并同一时段的变更
    activities.value = mergeActivities(activities.value)

    // 加载反应数据
    const commentIds = activities.value
      .filter(a => a.type === 'comment')
      .map(a => a.id)

    if (commentIds.length > 0) {
      await loadReactions(commentIds)
    }
  } catch (error) {
    console.error('Failed to load activities:', error)
    ElMessage.error('加载活动历史失败')
  } finally {
    isLoadingActivities.value = false
  }
}

// 合并同一时段的活动历史
const mergeActivities = (activities: Activity[]): Activity[] => {
  const merged: Activity[] = []
  const MERGE_WINDOW = 1 * 60 * 1000 // 5分钟

  for (let i = 0; i < activities.length; i++) {
    const current = activities[i]
    if (!current) continue // 防止 undefined

    // 评论和系统事件不合并
    if (current.type !== 'field_change') {
      merged.push(current)
      continue
    }

    // 查找可以合并的活动
    const toMerge: Activity[] = [current]
    let j = i + 1

    while (j < activities.length) {
      const next = activities[j]
      if (!next) break // 防止 undefined

      // 只合并 field_change 类型
      if (next.type !== 'field_change') break

      // 必须是同一个用户
      if (next.userId !== current.userId) break

      // 时间差在合并窗口内
      if (Math.abs(next.timestamp - current.timestamp) > MERGE_WINDOW) break

      toMerge.push(next)
      j++
    }

    // 如果找到多条可以合并的记录
    if (toMerge.length > 1) {
      // 按字段分组，合并同一字段的多次变更
      // toMerge 是倒序的（新→老），需要反转成正序（老→新）
      const sortedMerge = [...toMerge].reverse()
      const fieldMap = new Map<string, {
        field: string
        oldValue: string
        newValue: string
      }>()

      // 从老到新遍历，对于同一字段：保留最早的 oldValue，更新为最晚的 newValue
      for (const activity of sortedMerge) {
        const field = activity.field || ''
        if (!field) continue

        if (!fieldMap.has(field)) {
          // 第一次遇到这个字段（最早的变更），记录 oldValue 和 newValue
          fieldMap.set(field, {
            field,
            oldValue: activity.oldValue || '',
            newValue: activity.newValue || ''
          })
        } else {
          // 后续的变更，只更新 newValue（保留最早的 oldValue）
          const existing = fieldMap.get(field)!
          existing.newValue = activity.newValue || ''
        }
      }

      // 生成最终的 fieldChanges
      const fieldChanges: FieldChange[] = Array.from(fieldMap.values()).map(item => ({
        field: item.field,
        oldValue: item.oldValue,
        newValue: item.newValue,
        content: generateFieldChangeContent(item.field, item.oldValue, item.newValue)
      }))

      const changes = fieldChanges.map(fc => fc.content)
      const summary = current.summary || ''

      merged.push({
        ...current,
        grouped: true,
        changes,
        fieldChanges,
        content: summary || `进行了 ${fieldChanges.length} 项修改`,
        summary
      })

      i = j - 1 // 跳过已合并的项
    } else {
      merged.push(current)
    }
  }

  return merged
}

// 生成字段变更描述
const generateFieldChangeContent = (
  field?: string,
  oldValue?: string,
  newValue?: string,
  action?: string
): string => {
  if (!field) return '进行了修改'

  const fieldNames: Record<string, string> = {
    title: '标题',
    status: '状态',
    priority: '优先级',
    assigneeId: '指派人',
    content: '描述',
    dueDate: '截止日期',
    progress: '进度'
  }

  const fieldName = fieldNames[field] || field

  if (action === 'create') {
    return `创建了任务`
  } else if (action === 'delete') {
    return `删除了${fieldName}`
  } else {
    const oldVal = oldValue || '空'
    const newVal = newValue || '空'
    return `将${fieldName}从「${oldVal}」改为「${newVal}」`
  }
}

// 监听 task 变化，重新加载活动
watch(() => props.task?._id, (newId) => {
  if (newId) {
    loadActivities()
  }
}, { immediate: true })

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

// 添加或编辑评论
const addComment = async () => {
  if (!newComment.value.trim() || !props.task || !props.task._id) return

  const commentContent = newComment.value.trim()
  const isEditing = !!editingCommentId.value

  // 清空输入框
  newComment.value = ''

  try {
    if (isEditing) {
      // 编辑模式
      await updateTaskComment(editingCommentId.value!, commentContent)

      // 更新本地活动列表中的评论
      const activityIndex = activities.value.findIndex(a => a.id === editingCommentId.value)
      if (activityIndex !== -1) {
        const activity = activities.value[activityIndex]
        if (activity) {
          activity.content = commentContent
        }
      }

      ElMessage.success('评论更新成功')
      editingCommentId.value = null
      editingContent.value = ''
    } else {
      // 添加新评论
      const result = await addTaskComment(props.task._id, commentContent)

      // 将新评论添加到列表，确保有用户信息
      const newActivity: Activity = {
        id: result.id,
        type: 'comment',
        user: result.user || {
          _id: result.userId || 'unknown',
          displayName: '当前用户',
          username: 'current_user'
        },
        userId: result.userId,
        content: result.content || '',
        timestamp: result.timestamp
      }

      activities.value.unshift(newActivity)
      ElMessage.success('评论已添加')
    }
  } catch (error) {
    console.error(`Failed to ${isEditing ? 'update' : 'add'} comment:`, error)
    ElMessage.error(isEditing ? '更新评论失败' : '添加评论失败')
    // 恢复输入内容
    newComment.value = commentContent
  }
}

// 显示字段变更详情弹窗
const showDetailModal = (activity: Activity) => {
  detailModalRef.value?.showFieldChangeDetail(activity)
}

// 显示评论详情弹窗
const showCommentDetailModal = (activity: Activity) => {
  detailModalRef.value?.showCommentDetail(activity)
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

// 检查内容是否需要截断（超过50字）
const shouldTruncateContent = (content?: string): boolean => {
  return !!(content && content.length > 50)
}

// 截断内容显示（保留前50字）
const truncateContent = (content?: string): string => {
  if (!content) return ''
  if (content.length <= 50) return content
  return content.substring(0, 50) + '...'
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


// 切换评论选择状态
const toggleCommentSelection = (commentId: string) => {
  if (!props.commentSelectionMode) return

  const currentSelection = [...(props.selectedCommentIds || [])]
  const index = currentSelection.indexOf(commentId)

  if (index > -1) {
    currentSelection.splice(index, 1)
  } else {
    currentSelection.push(commentId)
  }

  emit('commentSelectionChange', currentSelection)
}

// 获取选中的评论数据
const getSelectedComments = () => {
  if (!props.selectedCommentIds || props.selectedCommentIds.length === 0) {
    return []
  }

  return activities.value
    .filter(activity =>
      activity.type === 'comment' && props.selectedCommentIds?.includes(activity.id)
    )
    .map(activity => ({
      id: activity.id,
      content: activity.content,
      summary: activity.summary,
      user: activity.user,
      timestamp: activity.timestamp
    }))
}

// 开始编辑评论
const startEditComment = (activity: Activity) => {
  editingCommentId.value = activity.id
  editingContent.value = activity.content || ''
  newComment.value = activity.content || ''

  // 滚动到底部输入框
  const container = document.querySelector('.overflow-y-auto')
  if (container) {
    setTimeout(() => {
      container.scrollTop = container.scrollHeight
    }, 100)
  }

  // 聚焦输入框
  const markdownEditor = document.querySelector('.markdown-editor textarea')
  if (markdownEditor) {
    setTimeout(() => {
      ;(markdownEditor as HTMLTextAreaElement).focus()
    }, 150)
  }
}

// 取消编辑
const cancelEdit = () => {
  editingCommentId.value = null
  editingContent.value = ''
  newComment.value = ''
}


// 删除评论
const deleteComment = async (commentId: string) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这条评论吗？删除后无法恢复。',
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await deleteTaskComment(commentId)

    // 从本地数据中移除
    activities.value = activities.value.filter(a => a.id !== commentId)

    ElMessage.success('评论删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Failed to delete comment:', error)
      ElMessage.error('删除评论失败')
    }
  }
}

// 加载反应数据
const loadReactions = async (commentIds: string[]) => {
  try {
    const reactionPromises = commentIds.map(async (commentId) => {
      try {
        const data = await getCommentReactions(commentId)
        return { commentId, reactions: data.reactions }
      } catch (error) {
        console.error(`Failed to load reactions for comment ${commentId}:`, error)
        return { commentId, reactions: {} }
      }
    })

    const reactionData = await Promise.all(reactionPromises)
    const newReactions: Record<string, Record<string, { count: number; users: any[] }>> = {}

    reactionData.forEach(({ commentId, reactions }) => {
      newReactions[commentId] = reactions
    })

    reactions.value = newReactions
  } catch (error) {
    console.error('Failed to load reactions:', error)
  }
}

// 切换反应选择器
const toggleReactionPicker = (commentId: string) => {
  showReactionPicker.value = showReactionPicker.value === commentId ? null : commentId
}

// 添加反应
const addReaction = async (commentId: string, emoji: string) => {
  try {
    await toggleCommentReaction(commentId, emoji)
    showReactionPicker.value = null
    await loadReactions([commentId])
  } catch (error) {
    console.error('Failed to add reaction:', error)
    ElMessage.error('添加反应失败')
  }
}

// 切换反应
const handleToggleReaction = async (commentId: string, emoji: string) => {
  try {
    await toggleCommentReaction(commentId, emoji)
    await loadReactions([commentId])
  } catch (error) {
    console.error('Failed to toggle reaction:', error)
    ElMessage.error('反应操作失败')
  }
}

// 检查是否是用户的反应
const isUserReaction = (commentId: string, emoji: string): boolean => {
  const commentReactions = reactions.value[commentId]
  if (!commentReactions || !commentReactions[emoji]) {
    return false
  }

  // 这里需要获取当前用户ID进行判断
  // 暂时返回false，后续可以从API返回的userReactions中获取
  return false
}

// 点击外部关闭表情选择器
const handleClickOutside = (event: Event) => {
  if (showReactionPicker.value) {
    showReactionPicker.value = null
  }
}

// ESC键退出编辑模式
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && editingCommentId.value) {
    // 阻止事件冒泡
    event.stopPropagation()
    event.preventDefault()

    // 取消编辑
    cancelEdit()
  }
}

// 生命周期钩子
onMounted(() => {
  document.addEventListener('keydown', handleKeydown, true)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown, true)
})

// 暴露方法供父组件调用
defineExpose({
  loadActivities,
  getSelectedComments
})
</script>
