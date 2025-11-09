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
        <el-tooltip>
          <template #content>
            <div class="flex items-center gap-1.5">
              <Keyboard :size="14" />
              <span>{{ focusMode ? '退出专注模式 (F1)' : '专注模式 (F1)' }}</span>
            </div>
          </template>
          <el-button type="default" @click="toggleFocusMode">
            <el-icon>
              <View v-if="!focusMode" />
              <Edit v-else />
            </el-icon>
            {{ focusMode ? '退出专注' : '专注模式' }}
          </el-button>
        </el-tooltip>

        <el-tooltip>
          <template #content>
            <div class="flex items-center gap-1.5">
              <Keyboard :size="14" />
              <span>新建文档 (N)</span>
            </div>
          </template>
          <el-button
            type="primary"
            @click="showCreateDialog = true"
            :style="{ backgroundColor: '#3762E3', borderColor: '#3762E3' }"
          >
            <el-icon class="mr-1">
              <Plus />
            </el-icon>
            新建文档
          </el-button>
        </el-tooltip>
      </div>
    </div>

    <!-- 专注模式悬浮按钮 -->
    <div v-if="focusMode" class="fixed top-16 right-4 z-50 bg-white rounded-full shadow-lg p-3 border border-gray-200">
      <el-tooltip>
        <template #content>
          <div class="flex items-center gap-1.5">
            <Keyboard :size="14" />
            <span>退出专注模式 (F1)</span>
          </div>
        </template>
        <el-button type="default" @click="toggleFocusMode" circle size="small">
          <el-icon>
            <View />
          </el-icon>
        </el-button>
      </el-tooltip>
    </div>

    <!-- 左右布局 - 同级分栏布局 -->
    <div class="flex overflow-hidden" :class="focusMode ? 'h-full' : 'h-[calc(100%-73px)]'">
      <!-- 左侧文档目录 - 同级布局 -->
      <transition name="slide-left">
        <div v-if="showLeftSidebar" class="w-80 border-r border-gray-200 bg-white flex flex-col flex-shrink-0">
          <!-- 目录头部 -->
          <div class="p-4 py-2 border-gray-200 flex items-center justify-between bg-gray-50 flex-shrink-0">
            <h3 class="text-sm font-medium text-gray-700">文档列表</h3>
            <el-tooltip>
              <template #content>
                <div class="flex items-center gap-1.5">
                  <Keyboard :size="14" />
                  <span>展开/收起左侧文档列表 (F2)</span>
                </div>
              </template>
              <el-button type="text" size="small" @click="toggleLeftSidebar"
                class="!text-gray-500 hover:!text-gray-700">
                <el-icon class="ml-1">
                  <ArrowLeft />
                </el-icon>收起
              </el-button>
            </el-tooltip>
          </div>

          <!-- 搜索和过滤区域 -->
          <div class="p-4 border-b border-gray-200 flex-shrink-0">
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

              <div v-else class="space-y-2">
                <!-- 文档列表 - 简单列表，无分组 -->
                <div v-for="document in filteredDocuments" :key="document._id" @click="selectDocument(document)" :class="[
                  'p-3 cursor-pointer transition-colors border border-gray-200 rounded-lg',
                  'hover:bg-blue-50 hover:border-blue-200',
                  selectedDocument?._id === document._id
                    ? 'bg-blue-50 border-l-4 border-l-blue-500'
                    : 'border-l-4 border-l-transparent'
                ]">
                  <div class="flex items-start justify-between">
                    <div class="flex-1 min-w-0">
                      <h4 class="text-sm font-medium text-gray-900 truncate">{{ document.title }}</h4>
                      <div class="flex items-center mt-1 space-x-2">
                        <span :class="[
                          'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                          document.status === 'published' ? 'bg-green-100 text-green-800' :
                            document.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                        ]">
                          {{ getStatusText(document.status) }}
                        </span>
                      </div>
                      <p class="text-xs text-gray-500 mt-1">
                        {{ formatDate(document.updatedAt) }}
                      </p>
                    </div>
                    <div class="flex items-center space-x-1 ml-2">
                      <el-button type="text" size="small" @click.stop="shareDocument(document)" title="复制链接">
                        <el-icon>
                          <Document />
                        </el-icon>
                      </el-button>
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
      </transition>

      <!-- 展开左侧目录按钮 - 收起时显示 -->
      <div v-if="!showLeftSidebar" class="w-8 flex-shrink-0 flex items-start justify-center pt-4">
        <div @click="toggleLeftSidebar"
          class="bg-white border border-gray-200 rounded-r-lg p-1 flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors shadow-sm">
          <ChevronRight class="w-4 h-4 text-gray-600" />
        </div>
      </div>

      <!-- 右侧文档内容 - 同级布局 -->
      <div class="flex-1 flex flex-col min-w-0">
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
                <el-tooltip>
                  <template #content>
                    <div class="flex items-center gap-1.5">
                      <Keyboard :size="14" />
                      <span>{{ isEditMode ? '查看模式 (F4)' : '编辑模式 (F4)' }}</span>
                    </div>
                  </template>
                  <el-button size="small" @click="toggleEditMode" :type="isEditMode ? 'default' : 'primary'">
                    <el-icon class="mr-1">
                      <Edit v-if="!isEditMode" />
                      <View v-else />
                    </el-icon>
                    {{ isEditMode ? '查看' : '编辑' }}
                  </el-button>
                </el-tooltip>
              </div>
            </div>
          </div>

          <!-- 文档内容区域 - 可滚动 -->
          <div class="flex-1 overflow-hidden flex">
            <!-- 编辑模式 - 编辑和预览双模式 -->
            <div v-if="isEditMode" class="flex-1 flex">
              <!-- 左侧编辑器区域 -->
              <div class="flex-1 p-6 pb-8 border-r border-gray-200">
                <!-- 编辑器头部 -->
                <div class="mb-4 pb-4 border-b border-gray-200">
                  <div class="flex items-center justify-between">
                    <!-- 左侧：保存状态指示器 -->
                    <div class="flex items-center space-x-3">
                      <div class="flex items-center space-x-2">
                        <div v-if="savingStatus === 'saving'" class="flex items-center text-blue-600">
                          <el-icon class="animate-spin mr-1">
                            <Loading />
                          </el-icon>
                          <span class="text-sm">保存中...</span>
                        </div>
                        <div v-else-if="savingStatus === 'saved'" class="flex items-center text-green-600">
                          <el-icon class="mr-1">
                            <Check />
                          </el-icon>
                          <span class="text-sm">已保存</span>
                        </div>
                        <div v-else-if="savingStatus === 'error'" class="flex items-center text-red-600">
                          <el-icon class="mr-1">
                            <Close />
                          </el-icon>
                          <span class="text-sm">保存失败</span>
                        </div>
                        <div v-else-if="!isSave" class="flex items-center text-orange-600">
                          <div class="w-2 h-2 bg-orange-400 rounded-full mr-2"></div>
                          <span class="text-sm">未保存</span>
                        </div>
                      </div>

                      <!-- 文档状态选择 -->
                      <el-select v-model="documentStatus" size="small" class="w-24">
                        <el-option label="草稿" value="draft" />
                        <el-option label="已发布" value="published" />
                        <el-option label="已归档" value="archived" />
                      </el-select>
                    </div>

                    <!-- 右侧：保存按钮 -->
                    <div class="flex items-center space-x-2">
                      <el-button type="primary" size="small" @click="saveDocument" :disabled="isSave"
                        :loading="savingStatus === 'saving'">
                        保存 (Ctrl+S)
                      </el-button>
                      <el-button type="default" size="small" @click="cancelEdit">
                        取消
                      </el-button>
                    </div>
                  </div>
                </div>

                <!-- 标题编辑 -->
                <div class="mb-4">
                  <el-input v-model="editingTitle" placeholder="文档标题" class="text-xl font-bold" size="large" />
                </div>

                <!-- 内容编辑器 -->
                <el-input ref="editorTextarea" v-model="editingContent" type="textarea" :rows="25"
                  placeholder="开始编辑文档内容..." resize="none" class="h-full" @scroll="handleEditorScroll" />
              </div>

              <!-- 右侧预览区域 -->
              <div ref="previewContainer" class="flex-1 p-6 pb-8 overflow-y-auto bg-white" @scroll="handlePreviewScroll">
                <div class="mb-4 pb-4 border-b border-gray-200">
                  <h3 class="text-lg font-semibold text-gray-800">预览</h3>
                </div>

                <!-- 预览标题 -->
                <h1 v-if="editingTitle" class="text-2xl font-bold text-gray-900 mb-4">
                  {{ editingTitle }}
                </h1>

                <!-- 预览内容 -->
                <div v-if="selectedDocument.type === 'markdown'" class="prose prose-sm max-w-none markdown-body mb-8">
                  <div v-html="markdownPreviewContent"></div>
                </div>
                <pre v-else class="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed mb-8">{{
                  editingContent }}
                </pre>
              </div>
            </div>

            <!-- 查看模式 -->
            <div v-else class="flex-1 flex">
              <!-- 内容区域 -->
              <div class="flex-1 p-6 pb-8 overflow-y-auto">
                <div v-if="selectedDocument.type === 'markdown'" class="prose prose-sm max-w-none markdown-body mb-8">
                  <div v-html="markdownContent"></div>
                </div>
                <pre v-else class="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed mb-8">{{
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
                      <el-tooltip>
                        <template #content>
                          <div class="flex items-center gap-1.5">
                            <Keyboard :size="14" />
                            <span>收起目录 (F3)</span>
                          </div>
                        </template>
                        <el-button type="text" size="small" @click="toggleToc"
                          class="!text-gray-500 hover:!text-gray-700">
                          <el-icon>
                            <ArrowRight />
                          </el-icon>
                        </el-button>
                      </el-tooltip>
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
                  <el-tooltip>
                    <template #content>
                      <div class="flex items-center gap-1.5">
                        <Keyboard :size="14" />
                        <span>展开目录 (F3)</span>
                      </div>
                    </template>
                    <div @click="toggleToc"
                      class="bg-white border rounded-full border-gray-200 p-[2px] flex justify-center items-center cursor-pointer hover:bg-gray-50">
                      <ChevronLeft class="w-4 h-4" />
                    </div>
                  </el-tooltip>
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
            <kbd class="px-1 py-0.5 text-xs bg-gray-100 border border-gray-300 rounded">{{ formatShortcut({ key: 'F1' })
              }}</kbd>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">左侧目录</span>
            <kbd class="px-1 py-0.5 text-xs bg-gray-100 border border-gray-300 rounded">{{ formatShortcut({ key: 'F2' })
              }}</kbd>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">右侧目录</span>
            <kbd class="px-1 py-0.5 text-xs bg-gray-100 border border-gray-300 rounded">{{ formatShortcut({ key: 'F3' })
              }}</kbd>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">编辑模式</span>
            <kbd class="px-1 py-0.5 text-xs bg-gray-100 border border-gray-300 rounded">{{ formatShortcut({ key: 'F4' })
              }}</kbd>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">刷新列表</span>
            <kbd class="px-1 py-0.5 text-xs bg-gray-100 border border-gray-300 rounded">{{ formatShortcut({ key: 'F5' })
              }}</kbd>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">新建文档</span>
            <kbd class="px-1 py-0.5 text-xs bg-gray-100 border border-gray-300 rounded">N</kbd>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">保存文档</span>
            <kbd class="px-1 py-0.5 text-xs bg-gray-100 border border-gray-300 rounded">
              {{ formatShortcut({ key: 's', ctrl: true, meta: true }) }}</kbd>
          </div>
        </div>
      </el-popover>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, inject, type Ref } from 'vue'
import { useRouter } from 'vue-router'
import { formatShortcut } from '@/composables/useKeyboard'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, Edit, Delete, View, Document, FolderOpened, ArrowRight, ArrowLeft, Loading, Check, Close } from '@element-plus/icons-vue'
import { ChevronRight, ChevronLeft, Keyboard } from 'lucide-vue-next'
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

// Router实例
const router = useRouter()

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
const editingTitle = ref('') // 编辑中的标题
const originalTitle = ref('') // 原始标题
const isSave = ref(true) // 内容是否有变更的标识
const savingStatus = ref<'idle' | 'saving' | 'saved' | 'error'>('idle') // 保存状态
const documentStatus = ref<'draft' | 'published' | 'archived'>('draft') // 当前文档状态
const showToc = ref(true) // 目录显示状态
const showLeftSidebar = ref(true) // 左侧目录显示状态

// 滚动同步相关的refs
const editorTextarea = ref()
const previewContainer = ref()
let isScrolling = ref(false) // 防止循环滚动

// 注入专注模式状态（从ProjectView组件提供）
const focusMode = inject<boolean>('focusMode', false)

// 注入专注模式切换方法（从ProjectView组件提供）
const toggleFocusMode = inject<(() => void) | null>('toggleFocusMode')

// 注入文档ID（从ProjectView组件提供）
const documentId = inject<Ref<string | undefined>>('documentId')

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
    renderer.heading = function (heading: { tokens?: any, depth?: number, text?: any, raw?: any }): string {
      // 新版本marked.js的heading函数签名，参数是单个heading对象
      const text = heading.tokens || heading.text || ''
      const level = heading.depth || 1

      // 处理text参数
      let textStr = ''

      // 处理文本内容
      if (Array.isArray(text)) {
        // 如果text是数组，提取文本内容
        textStr = text.map((token: any) => {
          if (typeof token === 'string') return token
          if (token && token.text) return String(token.text)
          if (token && token.type === 'text') return String(token.raw || token.text)
          return ''
        }).join('')
      } else if (text && typeof text === 'object') {
        // 如果text是对象，尝试提取文本
        textStr = String(text.text || text.raw || '')
      } else {
        // 如果是其他类型，直接转换
        textStr = String(text || '')
      }

      // 清理文本，移除多余的HTML标签
      textStr = textStr.replace(/<[^>]*>/g, '').trim()

      // 确保level是数字
      const headerLevel = typeof level === 'number' ? level : 1

      const id = textStr.toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-')
      return `<h${headerLevel} id="${id}" class="heading-${headerLevel}">${textStr}</h${headerLevel}>`
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

// Markdown 渲染内容（编辑模式预览）
const markdownPreviewContent = computed(() => {
  if (!editingContent.value || !selectedDocument.value || selectedDocument.value.type !== 'markdown') return ''
  try {
    // 使用相同的渲染器配置
    const renderer = new marked.Renderer()

    renderer.heading = function (heading: { tokens?: any, depth?: number, text?: any, raw?: any }): string {
      // 新版本marked.js的heading函数签名，参数是单个heading对象
      const text = heading.tokens || heading.text || ''
      const level = heading.depth || 1

      // 处理text参数
      let textStr = ''

      // 处理文本内容
      if (Array.isArray(text)) {
        // 如果text是数组，提取文本内容
        textStr = text.map((token: any) => {
          if (typeof token === 'string') return token
          if (token && token.text) return String(token.text)
          if (token && token.type === 'text') return String(token.raw || token.text)
          return ''
        }).join('')
      } else if (text && typeof text === 'object') {
        // 如果text是对象，尝试提取文本
        textStr = String(text.text || text.raw || '')
      } else {
        // 如果是其他类型，直接转换
        textStr = String(text || '')
      }

      // 清理文本，移除多余的HTML标签
      textStr = textStr.replace(/<[^>]*>/g, '').trim()

      // 确保level是数字
      const headerLevel = typeof level === 'number' ? level : 1

      const id = textStr.toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-')
      return `<h${headerLevel} id="${id}" class="heading-${headerLevel}">${textStr}</h${headerLevel}>`
    }

    // 使用 marked.use 配置渲染器（兼容新版本）
    marked.use({ renderer })

    return marked(editingContent.value || '')
  } catch (error) {
    console.error('Markdown 预览解析错误:', error)
    return '<p>Markdown 预览解析错误</p>'
  }
})

// 目录生成
const tableOfContents = computed(() => {
  if (!selectedDocument.value || selectedDocument.value.type !== 'markdown') return []

  try {
    const tokens = marked.lexer(selectedDocument.value.content || '')
    const headings = tokens.filter(token => token.type === 'heading')

    return headings.map((heading: any) => {
      let textStr = ''

      if (heading.text) {
        if (Array.isArray(heading.text)) {
          // 如果text是数组，提取文本内容
          textStr = heading.text.map((token: any) => {
            if (typeof token === 'string') return token
            if (token && token.text) return String(token.text)
            if (token && token.type === 'text') return String(token.raw || token.text)
            return ''
          }).join('')
        } else if (typeof heading.text === 'object') {
          // 如果text是对象，尝试提取文本
          textStr = String(heading.text.text || heading.text.raw || heading.text.tokens || '')
        } else {
          // 如果是其他类型，直接转换
          textStr = String(heading.text || '')
        }
      }

      // 清理文本，移除多余的HTML标签
      textStr = textStr.replace(/<[^>]*>/g, '').trim()

      // 确保level是数字
      const headerLevel = typeof heading.depth === 'number' ? heading.depth : 1

      return {
        id: textStr.toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-'),
        text: textStr,
        level: headerLevel
      }
    })
  } catch (error) {
    console.error('目录生成错误:', error)
    return []
  }
})

// 按状态分组的文档

// 方法
const fetchDocuments = async () => {
  loading.value = true
  try {
    // 这里调用实际的 API
    const response = await fetch(`/api/document/list?projectId=${props.projectId}&page=1&size=100`)
    const result = await response.json()

    if (result.code === 200) {
      documents.value = result.data.items
      // 如果URL中有文档ID，优先选择对应的文档
      if (documentId?.value) {
        const targetDocument = documents.value.find(doc => doc._id === documentId.value)
        if (targetDocument) {
          selectedDocument.value = targetDocument
        } else if (documents.value.length > 0 && !selectedDocument.value) {
          // 如果找不到对应文档，且没有选中任何文档，默认选中第一个
          selectedDocument.value = documents.value[0] || null
        }
      } else if (documents.value.length > 0 && !selectedDocument.value) {
        // 如果没有URL文档ID，且没有选中任何文档，默认选中第一个
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

// 监听文档ID变化，更新选中的文档
if (documentId) {
  watch(documentId, (newDocumentId) => {
    if (newDocumentId && documents.value.length > 0) {
      const targetDocument = documents.value.find(doc => doc._id === newDocumentId)
      if (targetDocument) {
        selectedDocument.value = targetDocument
      }
    }
  }, { immediate: true })
}

const handleSearch = () => {
  // 搜索逻辑已在 computed 中处理
}

const handleStatusFilter = () => {
  // 过滤逻辑已在 computed 中处理
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
  editingTitle.value = document.title
  originalTitle.value = document.title
  documentStatus.value = (document.status as 'draft' | 'published' | 'archived') || 'draft'
  isSave.value = true

  // 智能进入编辑模式：自动打开专注模式，收起侧边栏
  if (toggleFocusMode && !focusMode) {
    toggleFocusMode() // 打开专注模式
  }
  showLeftSidebar.value = false // 收起左侧文档列表
  showToc.value = false // 收起右侧目录
}

const cancelEdit = () => {
  // 恢复原始内容
  if (selectedDocument.value) {
    editingContent.value = selectedDocument.value.content
    editingTitle.value = selectedDocument.value.title
    documentStatus.value = selectedDocument.value.status
  }
  isEditMode.value = false
  isSave.value = true
  savingStatus.value = 'idle'
}

// 复制文档链接
const shareDocument = async (document: Document) => {
  try {
    // 检查projectId是否有效
    if (!props.projectId) {
      ElMessage.error('项目ID无效，无法生成链接')
      return
    }

    // 生成文档的唯一URL
    const documentUrl = router.resolve({
      name: 'document',
      params: {
        projectId: props.projectId,
        documentId: document._id
      }
    }).href

    // 获取当前域名并构建完整URL
    const baseUrl = window.location.origin + window.location.pathname.replace(/#.*$/, '')
    // hash模式下，documentUrl已经包含#号，不需要再加
    const fullUrl = baseUrl + documentUrl

    console.log('Generated document URL:', fullUrl) // 调试日志

    // 复制到剪贴板
    await navigator.clipboard.writeText(fullUrl)
    ElMessage.success('文档链接已复制到剪贴板')
  } catch (error) {
    console.error('复制链接失败:', error)
    ElMessage.error('复制链接失败')
  }
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
      editingTitle.value = selectedDocument.value.title
      originalTitle.value = selectedDocument.value.title
      documentStatus.value = (selectedDocument.value.status as 'draft' | 'published' | 'archived') || 'draft'
      isSave.value = true

      // 智能进入编辑模式：自动打开专注模式，收起侧边栏
      if (toggleFocusMode && !focusMode) {
        toggleFocusMode() // 打开专注模式
      }
      showLeftSidebar.value = false // 收起左侧文档列表
      showToc.value = false // 收起右侧目录
    }
  }
}

const saveDocument = async () => {
  if (!selectedDocument.value) return

  savingStatus.value = 'saving'

  try {
    const response = await fetch('/api/document/update', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: selectedDocument.value._id,
        title: editingTitle.value || selectedDocument.value.title,
        content: editingContent.value,
        status: documentStatus.value,
        changeLog: '编辑文档内容和状态'
      })
    })

    const result = await response.json()

    if (result.code === 200) {
      savingStatus.value = 'saved'
      ElMessage.success('文档保存成功')

      // 更新文档列表中的内容
      const docId = selectedDocument.value?._id
      if (docId) {
        const docIndex = documents.value.findIndex(d => d._id === docId)
        if (docIndex > -1) {
          documents.value[docIndex]!.content = editingContent.value
          documents.value[docIndex]!.title = editingTitle.value || documents.value[docIndex]!.title
          documents.value[docIndex]!.status = documentStatus.value
          documents.value[docIndex]!.updatedAt = Date.now()
        }
      }
      if (selectedDocument.value) {
        selectedDocument.value.content = editingContent.value
        selectedDocument.value.title = editingTitle.value || selectedDocument.value.title
        selectedDocument.value.status = documentStatus.value
        selectedDocument.value.updatedAt = Date.now()
      }

      // 重置编辑状态
      originalContent.value = editingContent.value
      originalTitle.value = editingTitle.value || selectedDocument.value.title
      isSave.value = true

      // 2秒后重置保存状态
      setTimeout(() => {
        savingStatus.value = 'idle'
      }, 2000)
    } else {
      savingStatus.value = 'error'
      ElMessage.error(result.message || '保存失败')
    }
  } catch (error) {
    savingStatus.value = 'error'
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


// 监听专注模式变化 - F1专用
watch(() => focusMode, (newFocusMode) => {
  if (newFocusMode) {
    // 进入专注模式：收起左侧文件列表和右侧目录
    showLeftSidebar.value = false
    showToc.value = false
  } else {
    // 退出专注模式：展开左侧文件列表（保持右侧目录原状态）
    showLeftSidebar.value = true
  }
}, { flush: 'post' })

// 监听选中文档变化，自动退出编辑模式
watch(selectedDocument, (newDoc) => {
  if (newDoc) {
    isEditMode.value = false
    editingContent.value = newDoc.content
    editingTitle.value = newDoc.title
    originalTitle.value = newDoc.title
    documentStatus.value = (newDoc.status as 'draft' | 'published' | 'archived') || 'draft'
    isSave.value = true
    savingStatus.value = 'idle'
  }
})

// 监听内容和标题变化，检测是否有变更
watch([editingContent, editingTitle], ([newContent, newTitle]) => {
  if (selectedDocument.value) {
    const contentChanged = newContent !== selectedDocument.value.content
    const titleChanged = newTitle !== selectedDocument.value.title
    isSave.value = !contentChanged && !titleChanged
  }
}, { deep: true })

// 左侧目录切换方法
const toggleLeftSidebar = () => {
  showLeftSidebar.value = !showLeftSidebar.value
}

// 滚动同步处理函数
const handleEditorScroll = (event: Event) => {
  if (isScrolling.value) return

  isScrolling.value = true
  const editorElement = event.target as HTMLTextAreaElement
  const scrollPercentage = editorElement.scrollTop / (editorElement.scrollHeight - editorElement.clientHeight)

  // 同步到预览区域
  if (previewContainer.value) {
    const previewElement = previewContainer.value
    const targetScrollTop = scrollPercentage * (previewElement.scrollHeight - previewElement.clientHeight)
    previewElement.scrollTop = targetScrollTop
  }

  // 防抖，避免循环滚动
  setTimeout(() => {
    isScrolling.value = false
  }, 50)
}

const handlePreviewScroll = (event: Event) => {
  if (isScrolling.value) return

  isScrolling.value = true
  const previewElement = event.target as HTMLElement
  const scrollPercentage = previewElement.scrollTop / (previewElement.scrollHeight - previewElement.clientHeight)

  // 同步到编辑器
  if (editorTextarea.value) {
    const editorElement = editorTextarea.value.$el.querySelector('textarea') as HTMLTextAreaElement
    if (editorElement) {
      const targetScrollTop = scrollPercentage * (editorElement.scrollHeight - editorElement.clientHeight)
      editorElement.scrollTop = targetScrollTop
    }
  }

  // 防抖，避免循环滚动
  setTimeout(() => {
    isScrolling.value = false
  }, 50)
}


// 快捷键处理
const handleKeyboardShortcuts = (event: KeyboardEvent) => {
  // F1 已移至ProjectView组件统一处理，避免重复监听

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

  // N - 新建文档（不使用修饰符，避免浏览器快捷键冲突）
  if (event.key === 'n' && !event.ctrlKey && !event.metaKey && !event.altKey) {
    event.preventDefault()
    showCreateDialog.value = true
  }

  // Ctrl/Cmd + S - 保存文档
  if ((event.ctrlKey || event.metaKey) && event.key === 's') {
    event.preventDefault()
    if (isEditMode.value && !isSave.value) {
      saveDocument()
    }
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