<template>
  <div class="comment-list">
    <!-- 评论类型过滤器 -->
    <div class="mb-4 flex items-center gap-2">
      <el-select v-model="selectedType" placeholder="评论类型" size="small" style="width: 120px"
        @change="loadComments">
        <el-option label="全部" value="all" />
        <el-option label="用户评论" value="user" />
        <el-option label="AI 完成" value="ai_completion" />
        <el-option label="AI 修改" value="ai_revision" />
        <el-option label="系统消息" value="system" />
      </el-select>
      <span class="text-sm text-gray-500">{{ total }} 条评论</span>
    </div>

    <!-- 评论列表 -->
    <div class="space-y-4">
      <div v-for="comment in comments" :key="comment.id" class="comment-item">
        <!-- 评论头部 -->
        <div class="flex items-start gap-3">
          <!-- 用户头像 -->
          <div class="flex-shrink-0">
            <div
              class="w-8 h-8 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-sm font-semibold"
              :class="getUserAvatarClass(comment.type)">
              {{ getUserInitial(comment.user) }}
            </div>
          </div>

          <!-- 评论内容 -->
          <div class="flex-1 min-w-0">
            <!-- 评论元信息 -->
            <div class="flex items-center gap-2 mb-1">
              <span class="font-medium text-sm text-gray-900">{{ comment.user.displayName || comment.user.username }}</span>
              <span class="text-xs px-2 py-0.5 rounded-full" :class="getTypeBadgeClass(comment.type)">
                {{ getTypeLabel(comment.type) }}
              </span>
              <span class="text-xs text-gray-500">{{ formatTime(comment.timestamp) }}</span>
            </div>

            <!-- 评论摘要（如果内容很长） -->
            <div v-if="shouldShowSummary(comment)" class="comment-summary">
              <div class="text-sm text-gray-700 prose prose-sm max-w-none">
                <div v-html="renderMarkdown(comment.summary)"></div>
              </div>
              <button @click="toggleFullContent(comment.id)"
                class="mt-2 text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
                <svg v-if="!expandedComments.has(comment.id)" class="w-3 h-3" fill="none" stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
                <svg v-else class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                </svg>
                {{ expandedComments.has(comment.id) ? '收起' : '查看详情' }}
              </button>
            </div>

            <!-- 评论完整内容 -->
            <div v-else-if="expandedComments.has(comment.id)" class="comment-full">
              <div class="text-sm text-gray-700 prose prose-sm max-w-none max-h-96 overflow-y-auto p-3 bg-gray-50 rounded-lg">
                <div v-html="renderMarkdown(comment.content)"></div>
              </div>
              <button @click="toggleFullContent(comment.id)"
                class="mt-2 text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                </svg>
                收起
              </button>
            </div>

            <!-- 短内容直接显示 -->
            <div v-else class="text-sm text-gray-700 prose prose-sm max-w-none">
              <div v-html="renderMarkdown(comment.content)"></div>
            </div>

            <!-- 附件 -->
            <div v-if="comment.attachments && comment.attachments.length > 0" class="mt-2">
              <div class="flex flex-wrap gap-2">
                <div v-for="(attachment, index) in comment.attachments" :key="index"
                  class="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  {{ attachment.name || attachment.url || `附件 ${index + 1}` }}
                </div>
              </div>
            </div>

            <!-- 提及用户 -->
            <div v-if="comment.mentionedUsers && comment.mentionedUsers.length > 0" class="mt-2">
              <div class="flex flex-wrap gap-1">
                <span v-for="userId in comment.mentionedUsers" :key="userId"
                  class="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  @{{ userId }}
                </span>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="mt-2 flex items-center gap-2">
              <!-- 点赞 -->
              <button @click="toggleLike(comment.id)"
                class="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {{ comment.likes || 0 }}
              </button>

              <!-- 回复 -->
              <button @click="toggleReply(comment.id)"
                class="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                回复
              </button>

              <!-- 编辑/删除 (权限控制) -->
              <template v-if="canEditComment(comment)">
                <button @click="editComment(comment)"
                  class="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  编辑
                </button>
                <button @click="deleteComment(comment.id)"
                  class="flex items-center gap-1 text-xs text-gray-500 hover:text-red-600 transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  删除
                </button>
              </template>
            </div>
          </div>
        </div>

        <!-- 回复输入框 -->
        <div v-if="replyingTo === comment.id" class="mt-3 ml-11">
          <div class="bg-gray-50 rounded-lg p-3">
            <el-input v-model="replyContent" type="textarea" :rows="3" placeholder="写下回复..."
              @keydown.ctrl.enter="submitReply" />
            <div class="mt-2 flex justify-end gap-2">
              <el-button size="small" @click="cancelReply">取消</el-button>
              <el-button type="primary" size="small" @click="submitReply">回复</el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 加载更多 -->
    <div v-if="hasMore" class="mt-6 text-center">
      <button @click="loadMoreComments"
        class="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors">
        加载更多评论
      </button>
    </div>

    <!-- 空状态 -->
    <div v-if="comments.length === 0 && !isLoading" class="text-center py-8 text-gray-400">
      <svg class="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
      <p>暂无评论</p>
    </div>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="text-center py-4">
      <div class="inline-flex items-center gap-2 text-sm text-gray-500">
        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        加载评论中...
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'

interface User {
  _id: string
  displayName?: string
  username?: string
  email?: string
}

interface Comment {
  id: string
  type: 'user' | 'ai_completion' | 'ai_revision' | 'system'
  userId: string
  user: User
  content: string
  summary?: string
  mentionedUsers?: string[]
  attachments?: any[]
  metadata?: any
  timestamp: number
  updatedAt: number
  likes?: number
}

interface Props {
  taskId: string
}

const props = defineProps<Props>()

// 评论数据
const comments = ref<Comment[]>([])
const isLoading = ref(false)
const total = ref(0)
const hasMore = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const selectedType = ref('all')

// 交互状态
const expandedComments = ref<Set<string>>(new Set())
const replyingTo = ref<string | null>(null)
const replyContent = ref('')

// 判断是否应该显示摘要
const shouldShowSummary = (comment: Comment) => {
  return comment.content.length > 200 && comment.summary && !expandedComments.value.has(comment.id)
}

// 切换完整内容显示
const toggleFullContent = (commentId: string) => {
  if (expandedComments.value.has(commentId)) {
    expandedComments.value.delete(commentId)
  } else {
    expandedComments.value.add(commentId)
  }
  expandedComments.value = new Set(expandedComments.value)
}

// 切换回复状态
const toggleReply = (commentId: string) => {
  replyingTo.value = replyingTo.value === commentId ? null : commentId
  replyContent.value = ''
}

// 取消回复
const cancelReply = () => {
  replyingTo.value = null
  replyContent.value = ''
}

// 提交回复
const submitReply = () => {
  if (!replyContent.value.trim()) {
    ElMessage.warning('请输入回复内容')
    return
  }
  // TODO: 实现回复逻辑
  console.log('Reply content:', replyContent.value)
  cancelReply()
}

// 切换点赞
const toggleLike = (commentId: string) => {
  // TODO: 实现点赞逻辑
  console.log('Toggle like for comment:', commentId)
}

// 编辑评论
const editComment = (comment: Comment) => {
  // TODO: 实现编辑逻辑
  console.log('Edit comment:', comment)
}

// 删除评论
const deleteComment = (commentId: string) => {
  // TODO: 实现删除逻辑
  console.log('Delete comment:', commentId)
}

// 判断是否可以编辑评论
const canEditComment = (comment: Comment) => {
  // TODO: 实现权限检查逻辑
  // return comment.userId === currentUser._id || currentUser.role === 'admin'
  return true
}

// 加载评论
const loadComments = async (reset = true) => {
  if (reset) {
    currentPage.value = 1
    comments.value = []
  }

  isLoading.value = true
  try {
    const response = await fetch(`/api/task/comments?taskId=${props.taskId}&page=${currentPage.value}&size=${pageSize.value}&type=${selectedType.value}`)
    const data = await response.json()

    if (data.code === 200) {
      const newComments = data.data.items
      if (reset) {
        comments.value = newComments
      } else {
        comments.value = [...comments.value, ...newComments]
      }
      total.value = data.data.total
      hasMore.value = data.data.hasMore
    } else {
      throw new Error(data.message)
    }
  } catch (error) {
    console.error('Failed to load comments:', error)
    ElMessage.error('加载评论失败')
  } finally {
    isLoading.value = false
  }
}

// 加载更多评论
const loadMoreComments = () => {
  if (hasMore.value && !isLoading.value) {
    currentPage.value++
    loadComments(false)
  }
}

// 获取用户头像样式
const getUserAvatarClass = (type: string) => {
  const classMap: Record<string, string> = {
    user: 'from-blue-500 to-purple-500',
    ai_completion: 'from-green-500 to-teal-500',
    ai_revision: 'from-orange-500 to-red-500',
    system: 'from-gray-500 to-gray-600'
  }
  return classMap[type] || classMap.user
}

// 获取用户首字母
const getUserInitial = (user: User) => {
  return (user.displayName || user.username || user.email || 'U').charAt(0).toUpperCase()
}

// 获取类型标签样式
const getTypeBadgeClass = (type: string) => {
  const classMap: Record<string, string> = {
    user: 'bg-blue-100 text-blue-700',
    ai_completion: 'bg-green-100 text-green-700',
    ai_revision: 'bg-orange-100 text-orange-700',
    system: 'bg-gray-100 text-gray-700'
  }
  return classMap[type] || classMap.user
}

// 获取类型标签文本
const getTypeLabel = (type: string) => {
  const labelMap: Record<string, string> = {
    user: '用户',
    ai_completion: 'AI 完成',
    ai_revision: 'AI 修改',
    system: '系统'
  }
  return labelMap[type] || type
}

// 格式化时间
const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diff < minute) {
    return '刚刚'
  } else if (diff < hour) {
    const minutes = Math.floor(diff / minute)
    return `${minutes}分钟前`
  } else if (diff < day) {
    const hours = Math.floor(diff / hour)
    return `${hours}小时前`
  } else {
    return date.toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
}

// 渲染 Markdown (简化版)
const renderMarkdown = (content: string) => {
  // 这里应该使用 markdown 渲染库，如 marked
  // 简单处理换行
  return content.replace(/\n/g, '<br>')
}

// 组件挂载时加载评论
onMounted(() => {
  loadComments()
})
</script>

<style scoped>
.comment-list {
  @apply space-y-4;
}

.prose {
  @apply max-w-none;
}

.prose-sm {
  @apply text-sm;
}

.prose :deep(p) {
  @apply mb-2;
}

.prose :deep(p:last-child) {
  @apply mb-0;
}

.prose :deep(code) {
  @apply bg-gray-100 px-1 py-0.5 rounded text-sm font-mono;
}

.prose :deep(pre) {
  @apply bg-gray-100 p-3 rounded-lg overflow-x-auto;
}

.prose :deep(pre code) {
  @apply bg-transparent p-0;
}

.prose :deep(ul), .prose :deep(ol) {
  @apply pl-5 mb-2;
}

.prose :deep(li) {
  @apply mb-1;
}
</style>