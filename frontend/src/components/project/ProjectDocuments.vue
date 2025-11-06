<template>
  <div class="h-full bg-white rounded-lg shadow-sm">
    <!-- 顶部工具栏 -->
    <div class="flex items-center justify-between p-4 border-b border-gray-200">
      <div class="flex items-center space-x-3">
        <h2 class="text-lg font-semibold text-gray-900">项目文档</h2>
        <span class="text-sm text-gray-500">({{ documents.length }} 个文档)</span>
      </div>

      <el-button
        type="primary"
        @click="showCreateDialog = true"
      >
        <el-icon class="mr-1"><Plus /></el-icon>
        新建文档
      </el-button>
    </div>

    <!-- 左右布局 -->
    <div class="flex h-[calc(100%-73px)]">
      <!-- 左侧文档目录 -->
      <div class="w-80 border-r border-gray-200 overflow-y-auto">
        <div class="p-4">
          <!-- 搜索框 -->
          <el-input
            v-model="searchKeyword"
            placeholder="搜索文档..."
            class="mb-4"
            @input="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>

          <!-- 状态过滤器 -->
          <el-select
            v-model="statusFilter"
            placeholder="选择状态"
            class="w-full mb-4"
            @change="handleStatusFilter"
          >
            <el-option label="所有状态" value="" />
            <el-option label="草稿" value="draft" />
            <el-option label="已发布" value="published" />
            <el-option label="已归档" value="archived" />
          </el-select>

          <!-- 文档列表 -->
          <div v-if="loading" class="flex items-center justify-center py-8">
            <el-loading text="加载中..." />
          </div>

          <div v-else-if="filteredDocuments.length === 0" class="text-center py-8">
            <el-icon class="mx-auto h-12 w-12 text-gray-400">
              <FolderOpened />
            </el-icon>
            <p class="mt-2 text-sm text-gray-500">暂无文档</p>
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="document in filteredDocuments"
              :key="document._id"
              @click="selectDocument(document)"
              :class="[
                'p-3 rounded-lg border cursor-pointer transition-colors',
                selectedDocument?._id === document._id
                  ? 'bg-blue-50 border-blue-200'
                  : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
              ]"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1 min-w-0">
                  <h4 class="text-sm font-medium text-gray-900 truncate">{{ document.title }}</h4>
                  <div class="flex items-center mt-1">
                    <span
                      :class="{
                        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium': true,
                        'bg-gray-100 text-gray-700': document.status === 'draft',
                        'bg-green-100 text-green-700': document.status === 'published',
                        'bg-gray-400 text-gray-700': document.status === 'archived'
                      }"
                    >
                      {{ getStatusText(document.status) }}
                    </span>
                  </div>
                  <p class="text-xs text-gray-500 mt-1">
                    {{ formatDate(document.updatedAt) }}
                  </p>
                </div>
                <div class="flex items-center space-x-1 ml-2">
                  <el-button
                    type="text"
                    size="small"
                    @click.stop="editDocument(document)"
                    title="编辑"
                  >
                    <el-icon><Edit /></el-icon>
                  </el-button>
                  <el-button
                    type="text"
                    size="small"
                    @click.stop="deleteDocument(document)"
                    title="删除"
                    class="!text-red-500 hover:!text-red-600"
                  >
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧文档内容 -->
      <div class="flex-1 overflow-y-auto">
        <div v-if="!selectedDocument" class="flex items-center justify-center h-full text-gray-400">
          <div class="text-center">
            <el-icon class="mx-auto h-12 w-12 text-gray-400 mb-2">
              <Document />
            </el-icon>
            <p class="text-sm">选择一个文档查看内容</p>
          </div>
        </div>

        <div v-else class="h-full flex flex-col">
          <!-- 文档头部 -->
          <div class="flex-shrink-0 p-6 border-b border-gray-200">
            <div class="flex items-start justify-between">
              <div>
                <h2 class="text-xl font-semibold text-gray-900">{{ selectedDocument.title }}</h2>
                <div class="flex items-center mt-2 space-x-4 text-sm text-gray-500">
                  <span>类型: {{ selectedDocument.type }}</span>
                  <span>更新时间: {{ formatDate(selectedDocument.updatedAt) }}</span>
                </div>
                <div class="flex items-center mt-2 space-x-2">
                  <span
                    :class="{
                      'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium': true,
                      'bg-gray-100 text-gray-700': selectedDocument.status === 'draft',
                      'bg-green-100 text-green-700': selectedDocument.status === 'published',
                      'bg-gray-400 text-gray-700': selectedDocument.status === 'archived'
                    }"
                  >
                    {{ getStatusText(selectedDocument.status) }}
                  </span>
                  <span
                    v-for="tag in selectedDocument.tags"
                    :key="tag"
                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700"
                  >
                    {{ tag }}
                  </span>
                </div>
              </div>
              <div class="flex items-center space-x-2">
                <el-button
                  @click="viewDocument(selectedDocument)"
                >
                  <el-icon class="mr-1"><View /></el-icon>
                  查看详情
                </el-button>
                <el-button
                  type="primary"
                  @click="editDocument(selectedDocument)"
                >
                  <el-icon class="mr-1"><Edit /></el-icon>
                  编辑
                </el-button>
              </div>
            </div>
          </div>

          <!-- 文档内容 -->
          <div class="flex-1 p-6 overflow-y-auto">
            <div v-if="selectedDocument.type === 'markdown'" class="prose prose-sm max-w-none markdown-body">
              <div v-html="markdownContent"></div>
            </div>
            <pre v-else class="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">{{ selectedDocument.content }}</pre>
          </div>
        </div>
      </div>
    </div>

    <!-- 新建文档对话框 -->
    <CreateDocumentDialog
      v-model:visible="showCreateDialog"
      :project-id="projectId"
      @created="handleDocumentCreated"
    />

    <!-- 文档查看器 -->
    <DocumentViewer
      v-model:visible="showViewerDialog"
      :document-id="viewingDocumentId || undefined"
      @edit="handleDocumentEdit"
    />

    <!-- 文档编辑器 -->
    <DocumentEditor
      v-model:visible="showEditorDialog"
      :project-id="projectId"
      :document="selectedDocument || undefined"
      @saved="handleDocumentSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, Edit, Delete, View, Document, FolderOpened } from '@element-plus/icons-vue'
import { marked } from 'marked'
import CreateDocumentDialog from '../document/CreateDocumentDialog.vue'
import DocumentViewer from '../document/DocumentViewer.vue'
import DocumentEditor from '../document/DocumentEditor.vue'

// 类型定义
interface Document {
  _id: string
  title: string
  content: string
  projectId: string
  type: string
  status: 'draft' | 'published' | 'archived'
  tags: string[]
  createdBy: string
  updatedBy: string
  createdAt: number
  updatedAt: number
}

// Props
interface Props {
  projectId: string
}

const props = defineProps<Props>()

// 响应式数据
const loading = ref(false)
const documents = ref<Document[]>([])
const searchKeyword = ref('')
const statusFilter = ref('')
const showCreateDialog = ref(false)
const showViewerDialog = ref(false)
const showEditorDialog = ref(false)
const selectedDocument = ref<Document | null>(null)
const viewingDocumentId = ref<string | null>(null)

// 计算属性
const filteredDocuments = computed(() => {
  let filtered = documents.value

  // 按状态过滤
  if (statusFilter.value) {
    filtered = filtered.filter(doc => doc.status === statusFilter.value)
  }

  // 按关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(doc =>
      doc.title.toLowerCase().includes(keyword) ||
      doc.content.toLowerCase().includes(keyword) ||
      doc.tags.some(tag => tag.toLowerCase().includes(keyword))
    )
  }

  return filtered
})

// Markdown 渲染内容
const markdownContent = computed(() => {
  if (!selectedDocument.value || selectedDocument.value.type !== 'markdown') return ''
  try {
    return marked(selectedDocument.value.content)
  } catch (error) {
    console.error('Markdown 解析错误:', error)
    return '<p class="text-red-500">Markdown 解析错误</p>'
  }
})

// 方法
const fetchDocuments = async () => {
  loading.value = true
  try {
    // 这里调用实际的 API
    const response = await fetch(`/api/document/list?projectId=${props.projectId}&page=1&size=100`)
    const result = await response.json()

    if (result.code === 200) {
      documents.value = result.data.items
      // 如果有文档但没有选中的，默认选中第一个
      if (documents.value.length > 0 && !selectedDocument.value) {
        selectedDocument.value = documents.value[0] || null
      }
    } else {
      ElMessage.error(result.message || '获取文档列表失败')
    }
  } catch (error) {
    console.error('获取文档列表失败:', error)
    ElMessage.error('获取文档列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  // 搜索逻辑已在 computed 中处理
}

const handleStatusFilter = () => {
  // 过滤逻辑已在 computed 中处理
}

const selectDocument = (document: Document) => {
  selectedDocument.value = document
}

const viewDocument = (document: Document) => {
  selectedDocument.value = document
  viewingDocumentId.value = document._id
  showViewerDialog.value = true
}

const editDocument = (document: Document) => {
  selectedDocument.value = document
  showEditorDialog.value = true
}

const deleteDocument = async (document: Document) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除文档 "${document.title}" 吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    // 调用删除 API
    const response = await fetch('/api/document/delete', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id: document._id })
    })

    const result = await response.json()

    if (result.code === 200) {
      ElMessage.success('文档删除成功')

      // 如果删除的是当前选中的文档，需要重新选择
      if (selectedDocument.value?._id === document._id) {
        const remainingDocs = documents.value.filter(doc => doc._id !== document._id)
        selectedDocument.value = remainingDocs.length > 0 ? (remainingDocs[0] || null) : null
      }

      await fetchDocuments()
    } else {
      ElMessage.error(result.message || '删除文档失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除文档失败:', error)
      ElMessage.error('删除文档失败')
    }
  }
}

const handleDocumentCreated = () => {
  ElMessage.success('文档创建成功')
  fetchDocuments()
}

const handleDocumentSaved = () => {
  ElMessage.success('文档保存成功')
  fetchDocuments()
  showEditorDialog.value = false
  selectedDocument.value = null
}

const handleDocumentEdit = (document: Document) => {
  showViewerDialog.value = false
  showEditorDialog.value = true
  selectedDocument.value = document
}

const formatDate = (timestamp: number) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'draft':
      return '草稿'
    case 'published':
      return '已发布'
    case 'archived':
      return '已归档'
    default:
      return '未知'
  }
}

// 生命周期
onMounted(() => {
  fetchDocuments()
})
</script>

<style scoped>
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
</style>