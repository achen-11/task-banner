<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    :title="document?.title || '文档查看'"
    width="1000px"
    :before-close="handleClose"
    destroy-on-close
    class="document-viewer-dialog"
  >
    <div v-if="loading" class="flex items-center justify-center py-12">
      <el-icon class="animate-spin text-4xl text-blue-500">
        <Loading />
      </el-icon>
      <span class="ml-2 text-gray-600">加载中...</span>
    </div>

    <div v-else-if="document" class="h-full flex flex-col">
      <!-- 文档信息头部 -->
      <div class="flex-shrink-0 bg-gray-50 p-4 border-b">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <div class="flex items-center space-x-2">
              <el-icon class="text-blue-500">
                <Document />
              </el-icon>
              <h2 class="text-lg font-semibold text-gray-900">{{ document.title }}</h2>
            </div>

            <div class="flex items-center space-x-2">
              <el-tag :type="getStatusType(document.status)" size="small">
                {{ getStatusText(document.status) }}
              </el-tag>
              <el-tag v-for="tag in document.tags" :key="tag" size="small" type="info">
                {{ tag }}
              </el-tag>
            </div>
          </div>

          <div class="flex items-center space-x-2">
            <el-button size="small" @click="handleEdit">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-dropdown @command="handleAction">
              <el-button size="small">
                <el-icon><More /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="export">
                    <el-icon><Download /></el-icon>
                    导出
                  </el-dropdown-item>
                  <el-dropdown-item command="versions">
                    <el-icon><Clock /></el-icon>
                    版本历史
                  </el-dropdown-item>
                  <el-dropdown-item command="share" divided>
                    <el-icon><Share /></el-icon>
                    分享
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>

        <div class="mt-3 flex items-center space-x-4 text-sm text-gray-500">
          <span>类型: {{ getTypeText(document.type) }}</span>
          <span>创建者: {{ document.createdBy }}</span>
          <span>创建时间: {{ formatDate(document.createdAt) }}</span>
          <span>更新时间: {{ formatDate(document.updatedAt) }}</span>
        </div>
      </div>

      <!-- 文档内容区 -->
      <div class="flex-1 flex overflow-hidden">
        <!-- 主内容区 -->
        <div class="flex-1 overflow-y-auto bg-white">
          <div v-if="document.type === 'markdown'" class="p-6">
            <div class="prose prose-lg max-w-none markdown-body" v-html="markdownContent" />
          </div>
          <div v-else class="p-6">
            <pre class="whitespace-pre-wrap text-gray-800 leading-relaxed">{{ document.content }}</pre>
          </div>
        </div>

        <!-- 侧边栏目录 -->
        <div v-if="document.type === 'markdown' && tocItems.length > 0" class="w-64 border-l bg-gray-50 p-4">
          <h3 class="text-sm font-medium text-gray-900 mb-3">目录</h3>
          <nav class="space-y-1">
            <a
              v-for="item in tocItems"
              :key="item.id"
              :href="`#${item.id}`"
              :class="[
                'block text-sm py-1 px-2 rounded transition-colors',
                'hover:bg-blue-50 hover:text-blue-600',
                'text-gray-600'
              ]"
              @click="scrollToHeading(item.id)"
            >
              <span :style="{ paddingLeft: `${item.level * 12}px` }">{{ item.text }}</span>
            </a>
          </nav>
        </div>
      </div>

      <!-- 底部工具栏 -->
      <div class="flex-shrink-0 bg-gray-50 border-t px-4 py-2 flex items-center justify-between">
        <div class="flex items-center space-x-4 text-sm text-gray-600">
          <span>字数: {{ wordCount }}</span>
          <span>阅读时长: {{ readTime }}分钟</span>
          <span v-if="document.version">版本: v{{ document.version }}</span>
        </div>

        <div class="flex items-center space-x-2">
          <el-button size="small" @click="handlePrint">
            <el-icon><Printer /></el-icon>
            打印
          </el-button>
          <el-button size="small" @click="toggleFullscreen">
            <el-icon><FullScreen /></el-icon>
            全屏
          </el-button>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-12">
      <el-icon class="text-4xl text-gray-400 mb-2">
        <DocumentRemove />
      </el-icon>
      <p class="text-gray-500">文档不存在或已被删除</p>
    </div>

    <!-- 版本历史对话框 -->
    <DocumentVersionsDialog
      v-model:visible="showVersionsDialog"
      :document-id="document?._id"
      @restore="handleVersionRestore"
    />
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Document, Edit, More, Download, Clock, Share,
  Loading, DocumentRemove, Printer, FullScreen
} from '@element-plus/icons-vue'
import { marked } from 'marked'
import DocumentVersionsDialog from './DocumentVersionsDialog.vue'

interface Document {
  _id: string
  title: string
  content: string
  projectId: string
  type: string
  status: 'draft' | 'published' | 'archived'
  tags: string[]
  version?: number
  createdBy: string
  updatedBy: string
  createdAt: number
  updatedAt: number
}

interface Props {
  visible: boolean
  documentId?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  edit: [document: Document]
}>()

// 响应式数据
const loading = ref(false)
const document = ref<Document>()
const showVersionsDialog = ref(false)

// Markdown 渲染内容
const markdownContent = computed(() => {
  if (!document.value || document.value.type !== 'markdown') return ''
  try {
    return marked(document.value.content)
  } catch (error) {
    console.error('Markdown 解析错误:', error)
    return '<p class="text-red-500">Markdown 解析错误</p>'
  }
})

// 目录项
const tocItems = ref<Array<{
  id: string
  text: string
  level: number
}>>([])

// 字数统计
const wordCount = computed(() => {
  if (!document.value?.content) return 0
  const chineseChars = (document.value.content.match(/[\u4e00-\u9fa5]/g) || []).length
  const englishWords = (document.value.content.match(/[a-zA-Z]+/g) || []).length
  return chineseChars + englishWords
})

// 阅读时长（按每分钟200字计算）
const readTime = computed(() => {
  return Math.max(1, Math.ceil(wordCount.value / 200))
})

// 监听文档ID变化
watch(() => props.documentId, (id) => {
  if (id && props.visible) {
    fetchDocument()
  }
}, { immediate: true })

// 监听可见性变化
watch(() => props.visible, (visible) => {
  if (visible && props.documentId) {
    fetchDocument()
  }
})

// 获取文档详情
const fetchDocument = async () => {
  if (!props.documentId) return

  loading.value = true
  try {
    const response = await fetch(`/api/document/detail?id=${props.documentId}`)
    const result = await response.json()

    if (result.code === 200) {
      document.value = result.data
      if (document.value?.type === 'markdown') {
        generateTOC()
      }
    } else {
      ElMessage.error(result.message || '获取文档失败')
    }
  } catch (error) {
    console.error('获取文档失败:', error)
    ElMessage.error('获取文档失败')
  } finally {
    loading.value = false
  }
}

// 生成目录
const generateTOC = () => {
  if (!document.value?.content) return

  const headingRegex = /^(#{1,6})\s+(.+)$/gm
  const headings = []
  let match

  while ((match = headingRegex.exec(document.value!.content)) !== null) {
    const level = match[1]!.length
    const text = match[2]!.trim()
    const id = text.toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-')

    headings.push({
      id,
      text,
      level
    })
  }

  tocItems.value = headings
}

// 滚动到标题
const scrollToHeading = (id: string) => {
  const element = window.document.getElementById(id)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' })
  }
}

// 获取状态类型
const getStatusType = (status: string) => {
  switch (status) {
    case 'draft': return 'warning'
    case 'published': return 'success'
    case 'archived': return 'info'
    default: return ''
  }
}

// 获取状态文本
const getStatusText = (status: string) => {
  switch (status) {
    case 'draft': return '草稿'
    case 'published': return '已发布'
    case 'archived': return '已归档'
    default: return '未知'
  }
}

// 获取类型文本
const getTypeText = (type: string) => {
  switch (type) {
    case 'markdown': return 'Markdown'
    case 'text': return '纯文本'
    case 'richtext': return '富文本'
    default: return '未知'
  }
}

// 格式化日期
const formatDate = (timestamp: number) => {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN')
}

// 处理编辑
const handleEdit = () => {
  if (document.value) {
    emit('edit', document.value)
  }
}

// 处理操作
const handleAction = async (command: string) => {
  switch (command) {
    case 'export':
      await handleExport()
      break
    case 'versions':
      showVersionsDialog.value = true
      break
    case 'share':
      await handleShare()
      break
  }
}

// 导出文档
const handleExport = async () => {
  if (!document.value) return

  try {
    const response = await fetch(`/api/document/export?id=${document.value!._id}`)
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = window.document.createElement('a')
    a.href = url
    a.download = `${document.value!.title}.md`
    window.document.body.appendChild(a)
    a.click()
    window.document.body.removeChild(a)
    window.URL.revokeObjectURL(url)

    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

// 分享文档
const handleShare = async () => {
  if (!document.value) return

  try {
    const url = `${window.location.origin}/document/${document.value!._id}`
    await navigator.clipboard.writeText(url)
    ElMessage.success('分享链接已复制到剪贴板')
  } catch (error) {
    console.error('复制失败:', error)
    ElMessage.error('复制分享链接失败')
  }
}

// 打印文档
const handlePrint = () => {
  window.print()
}

// 切换全屏
const toggleFullscreen = () => {
  // 实现全屏逻辑
  ElMessage.info('全屏功能开发中...')
}

// 处理版本恢复
const handleVersionRestore = (version: any) => {
  fetchDocument() // 重新获取文档数据
  ElMessage.success('已恢复到指定版本')
}

// 关闭对话框
const handleClose = () => {
  emit('update:visible', false)
}
</script>

<style scoped>
.document-viewer-dialog {
  height: 90vh;
}

.document-viewer-dialog :deep(.el-dialog) {
  height: 90vh;
  display: flex;
  flex-direction: column;
}

.document-viewer-dialog :deep(.el-dialog__body) {
  flex: 1;
  padding: 0;
  overflow: hidden;
}

.markdown-body {
  color: #2c3e50;
  line-height: 1.6;
}

.markdown-body h1,
.markdown-body h2,
.markdown-body h3,
.markdown-body h4,
.markdown-body h5,
.markdown-body h6 {
  margin-top: 24px;
  margin-bottom: 16px;
  font-weight: 600;
  line-height: 1.25;
}

.markdown-body h1 {
  font-size: 2em;
  border-bottom: 1px solid #eaecef;
  padding-bottom: 0.3em;
}

.markdown-body h2 {
  font-size: 1.5em;
  border-bottom: 1px solid #eaecef;
  padding-bottom: 0.3em;
}

.markdown-body h3 {
  font-size: 1.25em;
}

.markdown-body h4 {
  font-size: 1em;
}

.markdown-body h5 {
  font-size: 0.875em;
}

.markdown-body h6 {
  font-size: 0.85em;
  color: #6a737d;
}

.markdown-body p {
  margin-bottom: 16px;
}

.markdown-body code {
  background-color: #f6f8fa;
  border-radius: 3px;
  font-size: 85%;
  margin: 0;
  padding: 0.2em 0.4em;
}

.markdown-body pre {
  background-color: #f6f8fa;
  border-radius: 6px;
  padding: 16px;
  overflow: auto;
  margin-bottom: 16px;
}

.markdown-body blockquote {
  border-left: 0.25em solid #dfe2e5;
  color: #6a737d;
  padding: 0 1em;
  margin: 0 0 16px 0;
}

.markdown-body ul,
.markdown-body ol {
  padding-left: 2em;
  margin-bottom: 16px;
}

.markdown-body li {
  margin-bottom: 0.25em;
}

.markdown-body table {
  border-collapse: collapse;
  margin-bottom: 16px;
  width: 100%;
}

.markdown-body table th,
.markdown-body table td {
  border: 1px solid #dfe2e5;
  padding: 6px 13px;
}

.markdown-body table th {
  background-color: #f6f8fa;
  font-weight: 600;
}

@media print {
  .document-viewer-dialog :deep(.el-dialog__header),
  .document-viewer-dialog :deep(.el-dialog__footer) {
    display: none;
  }

  .document-viewer-dialog {
    height: 100vh;
  }
}
</style>