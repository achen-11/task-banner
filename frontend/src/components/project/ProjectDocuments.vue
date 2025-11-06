<template>
  <div class="h-full bg-white rounded-lg shadow-sm">
    <!-- 顶部工具栏 -->
    <div class="flex items-center justify-between p-4 border-b border-gray-200" :class="{ 'hidden': focusMode }">
      <div class="flex items-center space-x-3">
        <h2 class="text-lg font-semibold text-gray-900">项目文档</h2>
        <span class="text-sm text-gray-500">({{ documents.length }} 个文档)</span>
      </div>

      <div class="flex items-center space-x-2">
        <!-- 专注模式按钮 -->
        <el-button type="default" @click="toggleFocusMode" :title="focusMode ? '退出专注模式' : '专注模式'">
          <el-icon>
            <View v-if="!focusMode" />
            <Edit v-else />
          </el-icon>
          {{ focusMode ? '退出专注' : '专注模式' }}
        </el-button>

        <el-button type="primary" @click="showCreateDialog = true">
          <el-icon class="mr-1">
            <Plus />
          </el-icon>
          新建文档
        </el-button>
      </div>
    </div>

    <!-- 专注模式悬浮按钮 -->
    <div v-if="focusMode" class="fixed top-4 right-4 z-50 bg-white rounded-full shadow-lg p-3 border border-gray-200">
      <el-button type="default" @click="toggleFocusMode" circle size="small" title="退出专注模式">
        <el-icon>
          <View />
        </el-icon>
      </el-button>
    </div>

    <!-- 左右布局 - 独立滚动 -->
    <div class="flex overflow-hidden" :class="focusMode ? 'h-full' : 'h-[calc(100%-73px)]'">
      <!-- 左侧文档目录悬浮按钮 -->
      <div class="relative">
        <!-- 左侧目录面板 - 可收起 -->
        <transition name="slide-left">
          <div v-if="showLeftSidebar"
            class="absolute left-0 top-0 h-full w-80 border-r border-gray-200 bg-white shadow-lg z-10 flex flex-col">
            <!-- 目录头部 -->
            <div class="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <h3 class="text-sm font-medium text-gray-700">文档列表</h3>
              <el-button type="text" size="small" @click="toggleLeftSidebar"
                class="!text-gray-500 hover:!text-gray-700">
                <el-icon>
                  <ArrowLeft />
                </el-icon>
              </el-button>
            </div>

            <!-- 搜索和过滤区域 -->
            <div class="p-4 border-b border-gray-200">
              <el-input v-model="searchKeyword" placeholder="搜索文档..." class="mb-3" @input="handleSearch">
                <template #prefix>
                  <el-icon>
                    <Search />
                  </el-icon>
                </template>
              </el-input>

              <el-select v-model="statusFilter" placeholder="选择状态" class="w-full" @change="handleStatusFilter">
                <el-option label="所有状态" value="" />
                <el-option label="草稿" value="draft" />
                <el-option label="已发布" value="published" />
                <el-option label="已归档" value="archived" />
              </el-select>
            </div>

            <!-- 文档列表 - 可滚动 -->
            <div class="flex-1 overflow-y-auto">
              <div class="p-4">
                <div v-if="loading" class="flex items-center justify-center py-8">
                  <el-loading text="加载中..." />
                </div>

                <div v-else-if="filteredDocuments.length === 0" class="text-center py-8">
                  <el-icon class="mx-auto h-12 w-12 text-gray-400">
                    <FolderOpened />
                  </el-icon>
                  <p class="mt-2 text-sm text-gray-500">暂无文档</p>
                </div>

                <div v-else class="space-y-3">
                  <!-- 按状态分组的文档 -->
                  <div v-for="(group, status) in groupedDocuments" :key="status"
                    class="border border-gray-200 rounded-lg overflow-hidden">
                    <!-- 分组标题 -->
                    <div @click="toggleGroup(status)"
                      class="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors">
                      <div class="flex items-center space-x-2">
                        <el-icon :class="[
                          'transition-transform duration-200',
                          expandedGroups.includes(status) ? 'rotate-90' : ''
                        ]">
                          <ArrowRight />
                        </el-icon>
                        <span class="font-medium text-sm text-gray-700">
                          {{ getStatusText(status) }} ({{ group.length }})
                        </span>
                      </div>
                    </div>

                    <!-- 文档列表 -->
                    <div v-show="expandedGroups.includes(status)" class="divide-y divide-gray-100">
                      <div v-for="document in group" :key="document._id" @click="selectDocument(document)" :class="[
                        'p-3 cursor-pointer transition-colors hover:bg-gray-50',
                        selectedDocument?._id === document._id
                          ? 'bg-blue-50 border-l-4 border-l-blue-500'
                          : ''
                      ]">
                        <div class="flex items-start justify-between">
                          <div class="flex-1 min-w-0">
                            <h4 class="text-sm font-medium text-gray-900 truncate">{{ document.title }}</h4>
                            <div class="flex items-center mt-1 space-x-2">
                              <span v-for="tag in document.tags" :key="tag"
                                class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                                {{ tag }}
                              </span>
                            </div>
                            <p class="text-xs text-gray-500 mt-1">
                              {{ formatDate(document.updatedAt) }}
                            </p>
                          </div>
                          <div class="flex items-center space-x-1 ml-2">
                            <el-button type="text" size="small" @click.stop="editDocument(document)" title="编辑">
                              <el-icon>
                                <Edit />
                              </el-icon>
                            </el-button>
                            <el-button type="text" size="small" @click.stop="deleteDocument(document)" title="删除"
                              class="!text-red-500 hover:!text-red-600">
                              <el-icon>
                                <Delete />
                              </el-icon>
                            </el-button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </transition>

        <!-- 展开左侧目录按钮 -->
        <div v-if="!showLeftSidebar" class="absolute -left-2 top-4 z-10">
          <div type="default" @click="toggleLeftSidebar"
            class="bg-white border rounded-full border-gray-200 p-[2px] flex justify-center items-center">
            <ChevronRight class="w-4 h-4" />
          </div>
        </div>
      </div>

      <!-- 右侧文档内容 - 独立滚动 -->
      <div class="flex-1 flex flex-col">
        <div v-if="!selectedDocument" class="flex items-center justify-center h-full text-gray-400">
          <div class="text-center">
            <el-icon class="mx-auto h-12 w-12 text-gray-400 mb-2">
              <Document />
            </el-icon>
            <p class="text-sm">选择一个文档查看内容</p>
          </div>
        </div>

        <div v-else class="h-full flex flex-col">
          <!-- 简化的文档头部 - 固定不滚动 -->
          <div class="flex-shrink-0 px-6 py-4 border-b border-gray-200 bg-white">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <h2 class="text-lg font-semibold text-gray-900">{{ selectedDocument.title }}</h2>
                <span :class="{
                  'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium': true,
                  'bg-gray-100 text-gray-700': selectedDocument.status === 'draft',
                  'bg-green-100 text-green-700': selectedDocument.status === 'published',
                  'bg-gray-400 text-gray-700': selectedDocument.status === 'archived'
                }">
                  {{ getStatusText(selectedDocument.status) }}
                </span>
              </div>
              <div class="flex items-center space-x-2">
                <el-button size="small" @click="toggleEditMode" :type="isEditMode ? 'default' : 'primary'">
                  <el-icon class="mr-1">
                    <Edit v-if="!isEditMode" />
                    <View v-else />
                  </el-icon>
                  {{ isEditMode ? '查看' : '编辑' }}
                </el-button>
              </div>
            </div>
          </div>

          <!-- 文档内容区域 - 可滚动 -->
          <div class="flex-1 overflow-hidden flex">
            <!-- 编辑模式 -->
            <div v-if="isEditMode" class="flex-1 flex">
              <!-- 编辑器区域 -->
              <div class="flex-1 p-6">
                <el-input v-model="editingContent" type="textarea" :rows="30" placeholder="开始编辑文档内容..." class="h-full"
                  resize="none" />
              </div>
            </div>

            <!-- 查看模式 -->
            <div v-else class="flex-1 flex">
              <!-- 内容区域 -->
              <div class="flex-1 p-6 overflow-y-auto">
                <div v-if="selectedDocument.type === 'markdown'" class="prose prose-sm max-w-none markdown-body">
                  <div v-html="markdownContent"></div>
                </div>
                <pre v-else class="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">{{
                  selectedDocument.content }}
                </pre>
              </div>

              <!-- 右侧目录悬浮按钮 - 仅在查看模式且为Markdown时显示 -->
              <div v-if="selectedDocument.type === 'markdown' && tableOfContents.length > 0" class="relative">
                <!-- 目录面板 - 可收起 -->
                <transition name="slide-right">
                  <div v-if="showToc"
                    class="absolute right-0 top-0 h-full w-64 border-l border-gray-200 bg-white shadow-lg z-10 flex flex-col">
                    <!-- 目录头部 -->
                    <div class="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                      <h3 class="text-sm font-medium text-gray-700">目录</h3>
                      <el-button type="text" size="small" @click="toggleToc"
                        class="!text-gray-500 hover:!text-gray-700">
                        <el-icon>
                          <ArrowRight />
                        </el-icon>
                      </el-button>
                    </div>

                    <!-- 目录内容 -->
                    <div class="flex-1 overflow-y-auto p-4">
                      <div class="space-y-1">
                        <a v-for="item in tableOfContents" :key="item.id" :href="`#${item.id}`"
                          @click.prevent="scrollToHeading(item.id)" :class="[
                            'block text-sm py-1 px-2 rounded transition-colors',
                            'hover:bg-blue-50 hover:text-blue-600',
                            'text-gray-600'
                          ]" :style="{ paddingLeft: `${(item.level - 1) * 12 + 8}px` }">
                          {{ item.text }}
                        </a>
                      </div>
                    </div>
                  </div>
                </transition>

                <!-- 展开目录按钮 -->
                <div v-if="!showToc" class="absolute -right-2 top-4 z-10">
                  <div @click="toggleToc" class="bg-white border rounded-full border-gray-200 p-[2px] flex justify-center items-center">
                    <ChevronLeft class="w-4 h-4" />
                  </div>  
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 新建文档对话框 -->
    <CreateDocumentDialog v-model:visible="showCreateDialog" :project-id="projectId" @created="handleDocumentCreated" />

    <!-- 快捷键提示悬浮按钮 -->
    <div class="fixed bottom-4 right-4 z-20">
      <el-popover placement="top" :width="200" trigger="hover" title="快捷键说明">
        <template #reference>
          <el-button type="default" size="small" circle class="shadow-md bg-white border border-gray-200" title="快捷键说明">
            <el-icon>
              <Document />
            </el-icon>
          </el-button>
        </template>
        <div class="space-y-1 text-xs">
          <div class="flex justify-between">
            <span class="text-gray-600">专注模式</span>
            <kbd class="px-1 py-0.5 text-xs bg-gray-100 border border-gray-300 rounded">{{ formatShortcut({ key: 'F1' }) }}</kbd>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">左侧目录</span>
            <kbd class="px-1 py-0.5 text-xs bg-gray-100 border border-gray-300 rounded">{{ formatShortcut({ key: 'F2' }) }}</kbd>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">右侧目录</span>
            <kbd class="px-1 py-0.5 text-xs bg-gray-100 border border-gray-300 rounded">{{ formatShortcut({ key: 'F3' }) }}</kbd>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">编辑模式</span>
            <kbd class="px-1 py-0.5 text-xs bg-gray-100 border border-gray-300 rounded">{{ formatShortcut({ key: 'F4' }) }}</kbd>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">刷新列表</span>
            <kbd class="px-1 py-0.5 text-xs bg-gray-100 border border-gray-300 rounded">{{ formatShortcut({ key: 'F5' }) }}</kbd>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">新建文档</span>
            <kbd class="px-1 py-0.5 text-xs bg-gray-100 border border-gray-300 rounded">
              {{ formatShortcut({ key: 'n', ctrl: true, meta: true }) }}</kbd>
          </div>
        </div>
      </el-popover>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, inject } from 'vue'
import { formatShortcut } from '@/composables/useKeyboard'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, Edit, Delete, View, Document, FolderOpened, ArrowRight } from '@element-plus/icons-vue'
import { ChevronRight, ChevronLeft } from 'lucide-vue-next'
import { marked } from 'marked'
import CreateDocumentDialog from '../document/CreateDocumentDialog.vue'

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
const isEditMode = ref(false)
const editingContent = ref('')
const originalContent = ref('')
const expandedGroups = ref<string[]>(['draft', 'published', 'archived']) // 默认展开所有分组
const showToc = ref(true) // 目录显示状态
const showLeftSidebar = ref(true) // 左侧目录显示状态

// 注入专注模式状态（从ProjectView组件提供）
const focusMode = inject('focusMode')

// 注入专注模式切换方法（从ProjectView组件提供）
const toggleFocusMode = inject('toggleFocusMode')

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
    // 配置 marked 为标题添加 ID
    const renderer = new marked.Renderer()
    renderer.heading = function (text: any, level: number) {
      // 确保text是字符串类型
      const textStr = String(text || '')
      const id = textStr.toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-')
      return `<h${level} id="${id}" class="heading-${level}">${textStr}</h${level}>`
    }

    // 使用 marked.use 配置渲染器（兼容新版本）
    marked.use({ renderer })

    return marked(selectedDocument.value.content || '')
  } catch (error) {
    console.error('Markdown 解析错误:', error)
    console.error('文档内容:', selectedDocument.value?.content)
    return `<p class="text-red-500">Markdown 解析错误: ${error instanceof Error ? error.message : '未知错误'}</p>`
  }
})

// 目录生成
const tableOfContents = computed(() => {
  if (!selectedDocument.value || selectedDocument.value.type !== 'markdown') return []

  try {
    const tokens = marked.lexer(selectedDocument.value.content || '')
    const headings = tokens.filter(token => token.type === 'heading')

    return headings.map(heading => {
      const textStr = String(heading.text || '')
      return {
        id: textStr.toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-'),
        text: textStr,
        level: heading.depth
      }
    })
  } catch (error) {
    console.error('目录生成错误:', error)
    return []
  }
})

// 按状态分组的文档
const groupedDocuments = computed(() => {
  const groups: Record<string, Document[]> = {}

  filteredDocuments.value.forEach(doc => {
    if (!groups[doc.status]) {
      groups[doc.status] = []
    }
    groups[doc.status]!.push(doc)
  })

  // 按优先级排序：草稿 > 已发布 > 已归档
  const priorityOrder = ['draft', 'published', 'archived']
  const orderedGroups: Record<string, Document[]> = {}

  priorityOrder.forEach(status => {
    if (groups[status] && groups[status].length > 0) {
      orderedGroups[status] = groups[status]
    }
  })

  return orderedGroups
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

const toggleGroup = (status: string) => {
  const index = expandedGroups.value.indexOf(status)
  if (index > -1) {
    expandedGroups.value.splice(index, 1)
  } else {
    expandedGroups.value.push(status)
  }
}

const selectDocument = (document: Document) => {
  selectedDocument.value = document
  isEditMode.value = false
}

const viewDocument = (document: Document) => {
  selectedDocument.value = document
  isEditMode.value = false
}

const editDocument = (document: Document) => {
  selectedDocument.value = document
  isEditMode.value = true
  editingContent.value = document.content
  originalContent.value = document.content
}

const toggleEditMode = () => {
  if (isEditMode.value) {
    // 退出编辑模式，保存内容
    saveDocument()
  } else {
    // 进入编辑模式
    if (selectedDocument.value) {
      isEditMode.value = true
      editingContent.value = selectedDocument.value.content
      originalContent.value = selectedDocument.value.content
    }
  }
}

const saveDocument = async () => {
  if (!selectedDocument.value) return

  try {
    const response = await fetch('/api/document/update', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: selectedDocument.value._id,
        title: selectedDocument.value.title,
        content: editingContent.value,
        changeLog: '编辑文档内容'
      })
    })

    const result = await response.json()

    if (result.code === 200) {
      ElMessage.success('文档保存成功')
      // 更新文档列表中的内容
      const docId = selectedDocument.value?._id
      if (docId) {
        const docIndex = documents.value.findIndex(d => d._id === docId)
        if (docIndex > -1) {
          documents.value[docIndex]!.content = editingContent.value
          documents.value[docIndex]!.updatedAt = Date.now()
        }
      }
      if (selectedDocument.value) {
        selectedDocument.value.content = editingContent.value
      }
      isEditMode.value = false
    } else {
      ElMessage.error(result.message || '保存失败')
    }
  } catch (error) {
    console.error('保存文档失败:', error)
    ElMessage.error('保存失败')
  }
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

// 目录相关方法
const toggleToc = () => {
  showToc.value = !showToc.value
}

const scrollToHeading = (id: string) => {
  const element = document.getElementById(id)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}


// 监听选中文档变化，自动退出编辑模式
watch(selectedDocument, (newDoc) => {
  if (newDoc) {
    isEditMode.value = false
    editingContent.value = newDoc.content
  }
})

// 左侧目录切换方法
const toggleLeftSidebar = () => {
  showLeftSidebar.value = !showLeftSidebar.value
}

// 左侧目录内容展开/收起方法
const toggleGroupExpansion = () => {
  // 切换所有分组的展开状态
  const allExpanded = expandedGroups.value.length === 3
  if (allExpanded) {
    expandedGroups.value = []
  } else {
    expandedGroups.value = ['draft', 'published', 'archived']
  }
}

// 快捷键处理
const handleKeyboardShortcuts = (event: KeyboardEvent) => {
  // F1 - 切换专注模式
  if (event.key === 'F1') {
    event.preventDefault()
    if (toggleFocusMode) {
      toggleFocusMode()
    }
  }

  // F2 - 切换左侧目录展开/收起
  if (event.key === 'F2') {
    event.preventDefault()
    toggleLeftSidebar()
  }

  // F3 - 切换右侧目录显示/隐藏
  if (event.key === 'F3' && selectedDocument.value && selectedDocument.value.type === 'markdown') {
    event.preventDefault()
    toggleToc()
  }

  // F4 - 切换编辑模式
  if (event.key === 'F4' && selectedDocument.value) {
    event.preventDefault()
    toggleEditMode()
  }

  // F5 - 刷新文档列表
  if (event.key === 'F5') {
    event.preventDefault()
    fetchDocuments()
  }

  // Ctrl/Cmd + N - 新建文档
  if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
    event.preventDefault()
    showCreateDialog.value = true
  }
}

// 生命周期
onMounted(() => {
  fetchDocuments()

  // 添加键盘事件监听
  document.addEventListener('keydown', handleKeyboardShortcuts)
})

// 组件卸载时移除事件监听
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyboardShortcuts)
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

/* 目录过渡动画 */
.slide-right-enter-active,
.slide-right-leave-active,
.slide-left-enter-active,
.slide-left-leave-active {
  transition: all 0.3s ease;
}

.slide-right-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.slide-right-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.slide-left-enter-from {
  transform: translateX(-100%);
  opacity: 0;
}

.slide-left-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}
</style>