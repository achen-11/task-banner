<template>
  <el-dialog
    v-model="visible"
    title="全局搜索"
    width="700px"
    align-center
    :append-to-body="true"
    :close-on-click-modal="false"
    @closed="handleClosed"
  >
    <!-- 搜索输入框 -->
    <div class="search-input-wrapper">
      <el-input
        v-model="keyword"
        placeholder="搜索任务、评论、文档..."
        size="large"
        clearable
        @input="handleSearch"
        @keydown.enter="handleEnter"
        @keydown.esc="handleEsc"
        @keydown.down.prevent="handleArrowDown"
        @keydown.up.prevent="handleArrowUp"
        ref="inputRef"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      
      <!-- 搜索选项 -->
      <div class="search-options">
        <el-checkbox v-model="includeArchived" @change="handleSearch">
          包含已归档项目
        </el-checkbox>
      </div>
    </div>

    <!-- 搜索结果 -->
    <div class="search-results" v-if="keyword.trim()">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <Loader2 class="loading-icon" :size="32" />
        <span>搜索中...</span>
      </div>

      <!-- 空结果 -->
      <div v-else-if="!loading && results.length === 0" class="empty-state">
        <el-icon><DocumentRemove /></el-icon>
        <p>未找到相关结果</p>
      </div>

      <!-- 结果列表 -->
      <div v-else class="results-list">
        <div
          v-for="(item, index) in results"
          :key="`${item.type}-${item.id}`"
          class="result-item"
          :class="{ 'is-active': selectedIndex === index }"
          @click="handleItemClick(item)"
          @mouseenter="selectedIndex = index"
        >
          <!-- 类型图标和标题 -->
          <div class="result-header">
            <component
              :is="item.type === 'task' ? CheckSquare : item.type === 'comment' ? MessageSquare : FileText"
              class="result-type-icon"
              :class="`type-${item.type}`"
              :size="18"
            />
            <div class="result-title">
              <span class="title-text" v-html="highlightText(item.title, keyword)"></span>
              <el-tag
                v-if="item.projectName"
                :style="getProjectTagStyle(item.projectColor)"
                size="small"
                effect="plain"
                class="project-tag"
              >
                {{ item.projectName }}
              </el-tag>
            </div>
          </div>

          <!-- 匹配文本片段 -->
          <div
            v-if="item.matchedText"
            class="result-snippet"
            v-html="highlightText(item.matchedText, keyword)"
          ></div>
        </div>
      </div>

      <!-- 结果统计 -->
      <div v-if="!loading && results.length > 0" class="results-footer">
        共找到 {{ total }} 个结果
      </div>
    </div>

    <!-- 提示信息 -->
    <div v-else class="search-hint">
      <Search class="hint-icon w-10 h-10"  />
      <p>输入关键字搜索任务、评论和文档</p>
      <div class="hint-shortcut">
        <kbd>⌘</kbd> + <kbd>K</kbd> 快速打开搜索
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <span class="footer-hint">按 <kbd>Enter</kbd> 打开第一个结果，<kbd>Esc</kbd> 关闭</span>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElInput } from 'element-plus'
import { Search, Loading, DocumentRemove, Document } from '@element-plus/icons-vue'
import { CheckSquare, MessageSquare, FileText, Loader2 } from 'lucide-vue-next'
import { globalSearch } from '@/api/search'
import type { SearchResultItem } from '@/types/search'

const router = useRouter()

const visible = ref(false)
const keyword = ref('')
const results = ref<SearchResultItem[]>([])
const loading = ref(false)
const total = ref(0)
const selectedIndex = ref(0)
const inputRef = ref<any>(null)
const includeArchived = ref(false)

// 防抖定时器
let searchTimer: ReturnType<typeof setTimeout> | null = null

// 监听 visible 变化，自动聚焦输入框
watch(visible, (newVal) => {
  if (newVal) {
    keyword.value = ''
    results.value = []
    selectedIndex.value = 0
    includeArchived.value = false
    // 聚焦输入框
    nextTick(() => {
      const inputEl = inputRef.value?.$el?.querySelector('input')
      if (inputEl) {
        inputEl.focus()
      }
    })
  }
})

// 搜索处理
const handleSearch = () => {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }

  const searchKeyword = keyword.value.trim()
  if (!searchKeyword) {
    results.value = []
    total.value = 0
    return
  }

  searchTimer = setTimeout(() => {
    performSearch(searchKeyword)
  }, 300)
}

// 执行搜索
const performSearch = async (searchKeyword: string) => {
  loading.value = true
  selectedIndex.value = 0

  try {
    const response = await globalSearch({
      keyword: searchKeyword,
      limit: 20,
      includeArchived: includeArchived.value
    })
    results.value = response.items || []
    total.value = response.total || 0
  } catch (error) {
    console.error('Search error:', error)
    ElMessage.error('搜索失败，请稍后重试')
    results.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

// 高亮文本
const highlightText = (text: string, keyword: string): string => {
  if (!keyword || !text) return text
  const regex = new RegExp(`(${escapeRegex(keyword)})`, 'gi')
  return text.replace(regex, '<mark class="highlight">$1</mark>')
}

// 转义正则表达式特殊字符
const escapeRegex = (str: string): string => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// 处理结果项点击
const handleItemClick = (item: SearchResultItem) => {
  navigateToItem(item)
  visible.value = false
}

// 导航到结果项
const navigateToItem = (item: SearchResultItem) => {
  if (item.type === 'task') {
    // 导航到任务详情 - 切换到看板tab并打开任务
    router.push({
      path: `/projects/${item.projectId}`,
      query: { tab: 'board', taskId: item.id }
    })
  } else if (item.type === 'comment') {
    // 评论导航到所属任务
    const taskId = item.taskId || item.id
    router.push({
      path: `/projects/${item.projectId}`,
      query: { tab: 'board', taskId: taskId }
    })
  } else if (item.type === 'document') {
    // 导航到文档
    router.push(`/projects/${item.projectId}/documents/${item.id}`)
  }
}

// 处理 Enter 键
const handleEnter = () => {
  if (results.value.length > 0 && selectedIndex.value >= 0) {
    const item = results.value[selectedIndex.value]
    if (item) {
      navigateToItem(item)
      visible.value = false
    }
  }
}

// 处理 Esc 键
const handleEsc = () => {
  visible.value = false
}

// 处理向下箭头
const handleArrowDown = () => {
  if (results.value.length > 0) {
    selectedIndex.value = Math.min(selectedIndex.value + 1, results.value.length - 1)
  }
}

// 处理向上箭头
const handleArrowUp = () => {
  if (results.value.length > 0) {
    selectedIndex.value = Math.max(selectedIndex.value - 1, 0)
  }
}

// 处理对话框关闭
const handleClosed = () => {
  keyword.value = ''
  results.value = []
  selectedIndex.value = 0
  includeArchived.value = false
  if (searchTimer) {
    clearTimeout(searchTimer)
  }
}

// 显示/隐藏方法
const show = () => {
  visible.value = true
}

const hide = () => {
  visible.value = false
}

const toggle = () => {
  visible.value = !visible.value
}

// 获取项目tag样式，确保对比度
const getProjectTagStyle = (color?: string) => {
  if (!color) {
    return {
      backgroundColor: '#f3f4f6',
      color: '#374151',
      borderColor: '#e5e7eb'
    }
  }
  
  // 将颜色转换为RGB并计算亮度
  const hex = color.replace('#', '')
  let r = 0, g = 0, b = 0
  
  if (hex.length === 6) {
    r = parseInt(hex.substring(0, 2), 16) || 0
    g = parseInt(hex.substring(2, 4), 16) || 0
    b = parseInt(hex.substring(4, 6), 16) || 0
  } else if (hex.length === 3) {
    r = parseInt((hex[0] || '0') + (hex[0] || '0'), 16) || 0
    g = parseInt((hex[1] || '0') + (hex[1] || '0'), 16) || 0
    b = parseInt((hex[2] || '0') + (hex[2] || '0'), 16) || 0
  }
  
  // 计算相对亮度 (0-1)，使用WCAG标准
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  
  // 根据亮度选择文字颜色，确保对比度
  // 使用深色文字（#1f2937）或白色文字（#ffffff）
  const textColor = luminance > 0.5 ? '#1f2937' : '#ffffff'
  const bgColor = color
  
  return {
    backgroundColor: bgColor,
    color: textColor,
    borderColor: bgColor,
    fontWeight: '500'
  }
}

defineExpose({
  show,
  hide,
  toggle
})
</script>

<style scoped>
.search-input-wrapper {
  margin-bottom: 16px;
}

.search-options {
  margin-top: 8px;
  display: flex;
  align-items: center;
}

.search-results {
  min-height: 200px;
  max-height: 400px;
  overflow-y: auto;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #909399;
}

.loading-icon {
  animation: spin 1s linear infinite;
  color: #409eff;
  margin-bottom: 12px;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}


.empty-state p {
  margin: 0;
  font-size: 14px;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.result-item {
  padding: 12px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  background: #fff;
}

.result-item:hover,
.result-item.is-active {
  border-color: #409eff;
  background: #f0f9ff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.result-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.result-type-icon {
  flex-shrink: 0;
}

.result-type-icon.type-task {
  color: #409eff;
}

.result-type-icon.type-comment {
  color: #67c23a;
}

.result-type-icon.type-document {
  color: #e6a23c;
}

.result-title {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.title-text {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.project-tag {
  flex-shrink: 0;
}

.result-snippet {
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
  margin-left: 26px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

:deep(.highlight) {
  background: #fff566;
  color: #303133;
  padding: 0 2px;
  font-weight: 500;
}

.results-footer {
  padding: 12px 0;
  text-align: center;
  font-size: 13px;
  color: #909399;
  border-top: 1px solid #e4e7ed;
  margin-top: 12px;
}

.search-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #909399;
}

.hint-icon {
  margin-bottom: 12px;
  color: #c0c4cc;
}

.search-hint p {
  margin: 0 0 16px 0;
  font-size: 14px;
}

.hint-shortcut {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
}

.hint-shortcut kbd {
  padding: 2px 6px;
  background: #f5f7fa;
  border: 1px solid #dcdfe6;
  border-radius: 3px;
  font-family: 'SF Mono', 'Monaco', 'Menlo', monospace;
  font-size: 12px;
  color: #606266;
}

.dialog-footer {
  display: flex;
  justify-content: center;
  width: 100%;
}

.footer-hint {
  font-size: 12px;
  color: #909399;
}

.footer-hint kbd {
  padding: 2px 6px;
  background: #f5f7fa;
  border: 1px solid #dcdfe6;
  border-radius: 3px;
  font-family: 'SF Mono', 'Monaco', 'Menlo', monospace;
  font-size: 11px;
  color: #606266;
  margin: 0 2px;
}
</style>
