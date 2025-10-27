<template>
  <div class="h-full flex flex-col">
    <!-- 标题和过滤器（固定在顶部） -->
    <div class="flex-shrink-0 flex items-center justify-between pb-3 border-b border-gray-200">
      <h3 class="text-lg font-semibold text-gray-900">活动历史</h3>
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
            <div v-if="activity.type === 'comment'" class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
              <div class="flex items-start justify-between mb-2">
                <div class="flex items-center gap-2">
                  <span class="font-medium text-sm text-gray-900">{{ getUserDisplayName(activity.user) }}</span>
                  <span class="text-xs text-gray-500">{{ formatRelativeTime(activity.timestamp) }}</span>
                </div>
                <button class="text-gray-400 hover:text-gray-600 transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                  </svg>
                </button>
              </div>
              <MarkdownEditor
                :model-value="activity.content"
                :read-only="true"
              />

              <!-- 反应表情（Mock） -->
              <div class="flex items-center gap-2 mt-3">
                <button class="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-xs transition-colors">
                  👍 <span class="text-gray-600">2</span>
                </button>
                <button class="px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
                  添加反应
                </button>
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
    <div class="flex-shrink-0 border-t border-gray-200 pt-3">
      <MarkdownEditor
        v-model="newComment"
        placeholder="添加评论... 支持 Markdown 语法"
        min-height="100px"
      />
      <div class="flex justify-end mt-2">
        <button
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          :disabled="!newComment || newComment.trim() === ''"
          @click="addComment"
        >
          发送评论
        </button>
      </div>
    </div>

    <!-- 详情弹窗 -->
    <el-dialog
      v-model="detailModalVisible"
      title="变更详情"
      width="1000px"
      align-center
      :append-to-body="true"
      class="task-detail-dialog"
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
        <el-button @click="detailModalVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import MarkdownEditor from '../common/MarkdownEditor.vue'
import { getTaskActivities, addTaskComment, type TaskActivity as APITaskActivity } from '@/api/task'

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
}

interface Props {
  task: Task | null
}

const props = defineProps<Props>()

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

// 详情弹窗
const detailModalVisible = ref(false)
const selectedActivity = ref<Activity | null>(null)
const currentFieldChangeIndex = ref(0)

// 当前选中的字段变更
const currentFieldChange = computed(() => {
  if (!selectedActivity.value?.fieldChanges) return null
  return selectedActivity.value.fieldChanges[currentFieldChangeIndex.value]
})

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
          timestamp: activity.timestamp
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

// 添加评论
const addComment = async () => {
  if (!newComment.value.trim() || !props.task || !props.task._id) return

  const commentContent = newComment.value.trim()
  newComment.value = ''

  try {
    const result = await addTaskComment(props.task._id, commentContent)

    // 将新评论添加到列表
    const newActivity: Activity = {
      id: result.id,
      type: 'comment',
      user: result.user || null,
      userId: result.userId,
      content: result.content || '',
      timestamp: result.timestamp
    }

    activities.value.unshift(newActivity)
    ElMessage.success('评论已添加')
  } catch (error) {
    console.error('Failed to add comment:', error)
    ElMessage.error('添加评论失败')
    // 恢复输入内容
    newComment.value = commentContent
  }
}

// 显示详情弹窗
const showDetailModal = (activity: Activity) => {
  selectedActivity.value = activity
  currentFieldChangeIndex.value = 0 // 重置到第一个 tab
  detailModalVisible.value = true
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

// 格式化相对时间
const formatRelativeTime = (timestamp: number) => {
  const now = Date.now()
  const diff = now - timestamp
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 7) {
    const date = new Date(timestamp)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } else if (days > 0) {
    return `${days} 天前`
  } else if (hours > 0) {
    return `${hours} 小时前`
  } else if (minutes > 0) {
    return `${minutes} 分钟前`
  } else {
    return '刚刚'
  }
}
</script>
