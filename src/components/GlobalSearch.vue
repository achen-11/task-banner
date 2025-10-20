<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useTaskStore } from '@/stores/task'
import { useProjectStore } from '@/stores/project'
import type { Task } from '@/types'

const router = useRouter()
const taskStore = useTaskStore()
const projectStore = useProjectStore()

const visible = ref(false)
const searchQuery = ref('')
const searchInputRef = ref<HTMLInputElement | null>(null)
const selectedIndex = ref(0)

interface SearchResult {
  task: Task
  project: any
  matchType: 'title' | 'description' | 'changelog'
  matchText: string
  matchContext: string
}

// 高亮关键字
function highlightText(text: string, query: string): string {
  if (!query) return text

  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  return text.replace(regex, '<mark class="search-highlight">$1</mark>')
}

// 截断文本，保留关键字周围的内容
function truncateText(text: string, query: string, maxLength: number = 150): string {
  if (!query || text.length <= maxLength) {
    return text.substring(0, maxLength)
  }

  const lowerText = text.toLowerCase()
  const lowerQuery = query.toLowerCase()
  const index = lowerText.indexOf(lowerQuery)

  if (index === -1) {
    return text.substring(0, maxLength) + '...'
  }

  // 计算显示范围，确保关键字在中间
  const start = Math.max(0, index - Math.floor(maxLength / 2))
  const end = Math.min(text.length, start + maxLength)

  let result = text.substring(start, end)
  if (start > 0) result = '...' + result
  if (end < text.length) result = result + '...'

  return result
}

// 搜索结果
const searchResults = computed((): SearchResult[] => {
  if (!searchQuery.value.trim()) return []

  const query = searchQuery.value.toLowerCase()
  const results: SearchResult[] = []

  // 搜索所有任务
  taskStore.tasks.forEach(task => {
    const project = projectStore.getProjectById(task.projectId)
    if (!project) return

    // 搜索标题
    if (task.title.toLowerCase().includes(query)) {
      results.push({
        task,
        project,
        matchType: 'title',
        matchText: task.title,
        matchContext: task.title
      })
    }
    // 搜索描述
    else if (task.description.toLowerCase().includes(query)) {
      results.push({
        task,
        project,
        matchType: 'description',
        matchText: task.description,
        matchContext: truncateText(task.description, query)
      })
    }
    // 搜索 changelog
    else if (task.changelog) {
      for (const entry of task.changelog) {
        const searchableText = `${entry.action} ${entry.field} ${entry.oldValue} ${entry.newValue}`.toLowerCase()
        if (searchableText.includes(query)) {
          results.push({
            task,
            project,
            matchType: 'changelog',
            matchText: entry.action,
            matchContext: truncateText(`${entry.action} - ${entry.field}: ${entry.oldValue} → ${entry.newValue}`, query)
          })
          break
        }
      }
    }
  })

  return results.slice(0, 20) // 限制最多显示 20 个结果
})

// 打开搜索面板
function openSearch() {
  visible.value = true
  selectedIndex.value = 0
  nextTick(() => {
    searchInputRef.value?.focus()
  })
}

// 关闭搜索面板
function closeSearch() {
  visible.value = false
  searchQuery.value = ''
  selectedIndex.value = 0
}

// 选择结果
function selectResult(result: SearchResult) {
  // 跳转到任务所在的看板
  router.push(`/board/${result.project.id}`)
  closeSearch()

  // 稍后触发编辑任务（需要等待看板加载）
  setTimeout(() => {
    // 这里可以通过事件总线或其他方式触发任务编辑
    // 暂时只跳转到看板
  }, 300)
}

// 键盘导航
function handleKeyDown(event: KeyboardEvent) {
  if (!visible.value) return

  if (event.key === 'ArrowDown') {
    event.preventDefault()
    selectedIndex.value = Math.min(selectedIndex.value + 1, searchResults.value.length - 1)
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    selectedIndex.value = Math.max(selectedIndex.value - 1, 0)
  } else if (event.key === 'Enter') {
    event.preventDefault()
    const result = searchResults.value[selectedIndex.value]
    if (result) {
      selectResult(result)
    }
  } else if (event.key === 'Escape') {
    event.preventDefault()
    closeSearch()
  }
}

// 全局快捷键 (Cmd+K 或 Ctrl+K)
function handleGlobalKeyDown(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
    event.preventDefault()
    if (visible.value) {
      closeSearch()
    } else {
      openSearch()
    }
  }
}

// 获取匹配类型的图标
function getMatchTypeIcon(type: string) {
  switch (type) {
    case 'title':
      return '📝'
    case 'description':
      return '📄'
    case 'changelog':
      return '🔄'
    default:
      return '📋'
  }
}

// 获取匹配类型的标签
function getMatchTypeLabel(type: string) {
  switch (type) {
    case 'title':
      return '标题'
    case 'description':
      return '描述'
    case 'changelog':
      return '历史'
    default:
      return '任务'
  }
}

// 监听键盘事件
watch(visible, (newVal) => {
  if (newVal) {
    window.addEventListener('keydown', handleKeyDown)
  } else {
    window.removeEventListener('keydown', handleKeyDown)
  }
})

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeyDown)
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <transition name="search-fade">
    <div v-if="visible" class="global-search-overlay" @click="closeSearch">
      <div class="global-search-container" @click.stop>
        <!-- 搜索输入框 -->
        <div class="search-header">
          <div class="search-icon">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
          <input
            ref="searchInputRef"
            v-model="searchQuery"
            type="text"
            class="search-input"
            placeholder="搜索任务标题、描述或历史记录..."
            @keydown="handleKeyDown"
          />
          <div class="search-shortcut">
            <kbd>ESC</kbd>
          </div>
        </div>

        <!-- 搜索结果 -->
        <div class="search-results">
          <div v-if="searchQuery && searchResults.length === 0" class="no-results">
            <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <p>未找到匹配的任务</p>
          </div>

          <div v-else-if="!searchQuery" class="search-tips">
            <div class="tip-item">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
              <span>输入关键字开始搜索</span>
            </div>
            <div class="tip-item">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"></path>
              </svg>
              <span>可搜索任务标题、描述和变更历史</span>
            </div>
            <div class="tip-item">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path>
              </svg>
              <span>使用 ↑↓ 键导航，Enter 选择</span>
            </div>
          </div>

          <div
            v-for="(result, index) in searchResults"
            :key="`${result.task.id}-${index}`"
            :class="['result-item', { 'selected': index === selectedIndex }]"
            @click="selectResult(result)"
            @mouseenter="selectedIndex = index"
          >
            <div class="result-icon">
              {{ getMatchTypeIcon(result.matchType) }}
            </div>
            <div class="result-content">
              <div class="result-title" v-html="highlightText(result.task.title, searchQuery)"></div>
              <div class="result-meta">
                <span class="result-project">{{ result.project.name }}</span>
                <span class="result-separator">•</span>
                <span class="result-type">{{ getMatchTypeLabel(result.matchType) }}</span>
              </div>
              <div class="result-context" v-html="highlightText(result.matchContext, searchQuery)"></div>
            </div>
          </div>
        </div>

        <!-- 底部提示 -->
        <div class="search-footer">
          <div class="footer-hint">
            <kbd>↑</kbd><kbd>↓</kbd> 导航
            <span class="separator">·</span>
            <kbd>Enter</kbd> 选择
            <span class="separator">·</span>
            <kbd>ESC</kbd> 关闭
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.global-search-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 2000;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 15vh;
}

.global-search-container {
  width: 90%;
  max-width: 640px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 70vh;
}

.search-header {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
  gap: 12px;
}

.search-icon {
  color: #9ca3af;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 16px;
  color: #1f2937;
}

.search-input::placeholder {
  color: #9ca3af;
}

.search-shortcut kbd {
  padding: 4px 8px;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 12px;
  font-family: monospace;
  color: #6b7280;
}

.search-results {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #9ca3af;
}

.no-results p {
  margin-top: 12px;
  font-size: 14px;
}

.search-tips {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
}

.tip-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  color: #6b7280;
  font-size: 14px;
}

.tip-item svg {
  flex-shrink: 0;
  color: #8b5cf6;
}

.result-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.result-item:hover,
.result-item.selected {
  background: #f3f4f6;
}

.result-icon {
  font-size: 20px;
  flex-shrink: 0;
  margin-top: 2px;
}

.result-content {
  flex: 1;
  min-width: 0;
}

.result-title {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 6px;
}

.result-separator {
  color: #d1d5db;
}

.result-project {
  font-weight: 500;
}

.result-type {
  padding: 2px 6px;
  background: #e0e7ff;
  color: #6366f1;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.result-context {
  font-size: 13px;
  color: #6b7280;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.search-footer {
  padding: 12px 20px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.footer-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #6b7280;
}

.footer-hint kbd {
  padding: 2px 6px;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 11px;
  font-family: monospace;
}

.footer-hint .separator {
  color: #d1d5db;
  margin: 0 4px;
}

/* 高亮样式 */
.result-title :deep(.search-highlight),
.result-context :deep(.search-highlight) {
  background: #fef3c7;
  color: #92400e;
  font-weight: 600;
  padding: 1px 2px;
  border-radius: 2px;
}

/* 动画 */
.search-fade-enter-active,
.search-fade-leave-active {
  transition: opacity 0.2s ease;
}

.search-fade-enter-active .global-search-container,
.search-fade-leave-active .global-search-container {
  transition: all 0.2s ease;
}

.search-fade-enter-from,
.search-fade-leave-to {
  opacity: 0;
}

.search-fade-enter-from .global-search-container {
  transform: translateY(-20px) scale(0.95);
}

.search-fade-leave-to .global-search-container {
  transform: translateY(-20px) scale(0.95);
}

/* 滚动条样式 */
.search-results::-webkit-scrollbar {
  width: 6px;
}

.search-results::-webkit-scrollbar-track {
  background: transparent;
}

.search-results::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

.search-results::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
</style>
