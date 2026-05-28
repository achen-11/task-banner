<template>
  <div class="markdown-editor-wrapper" :class="{ 'read-only': readOnly }">
    <!-- 编辑模式 -->
    <div v-if="!readOnly" class="edit-mode">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <el-tooltip placement="bottom">
            <template #content>
              <div class="flex items-center gap-1.5">
                <Keyboard :size="14" />
                <span>加粗 (⌘B / Ctrl+B)</span>
              </div>
            </template>
            <button @click="insertBold" class="toolbar-btn">
              <Bold :size="16" />
            </button>
          </el-tooltip>
          <el-tooltip placement="bottom">
            <template #content>
              <div class="flex items-center gap-1.5">
                <Keyboard :size="14" />
                <span>斜体 (⌘I / Ctrl+I)</span>
              </div>
            </template>
            <button @click="insertItalic" class="toolbar-btn">
              <Italic :size="16" />
            </button>
          </el-tooltip>
          <el-tooltip content="下划线" placement="bottom">
            <button @click="insertUnderline" class="toolbar-btn">
              <Underline :size="16" />
            </button>
          </el-tooltip>
          <span class="divider"></span>
          <el-tooltip content="有序列表" placement="bottom">
            <button @click="insertOrderedList" class="toolbar-btn">
              <ListOrdered :size="16" />
            </button>
          </el-tooltip>
          <el-tooltip content="无序列表" placement="bottom">
            <button @click="insertBulletList" class="toolbar-btn">
              <List :size="16" />
            </button>
          </el-tooltip>
          <el-tooltip content="任务列表" placement="bottom">
            <button @click="insertTaskList" class="toolbar-btn">
              <ListChecks :size="16" />
            </button>
          </el-tooltip>
          <span class="divider"></span>
          <el-tooltip content="代码块" placement="bottom">
            <button @click="insertCodeBlock" class="toolbar-btn">
              <Code :size="16" />
            </button>
          </el-tooltip>
          <el-tooltip content="链接" placement="bottom">
            <button @click="insertLink" class="toolbar-btn">
              <Link :size="16" />
            </button>
          </el-tooltip>
          <span class="divider"></span>
          <el-tooltip placement="bottom">
            <template #content>
              <div class="flex flex-col gap-1">
                <div class="flex items-center gap-1.5">
                  <Keyboard :size="14" />
                  <span>Tab 缩进</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <ArrowLeft :size="14" />
                  <span>Shift+Tab 反向缩进</span>
                </div>
              </div>
            </template>
            <button class="toolbar-btn" disabled>
              <ArrowRight :size="16" />
            </button>
          </el-tooltip>
        </div>
      </div>

      <!-- 编辑区 -->
      <textarea
        v-show="!isPreviewMode"
        ref="textareaRef"
        v-model="localContent"
        :placeholder="placeholder"
        :style="{ minHeight: minHeight }"
        class="markdown-textarea"
        @input="handleInput"
        @keydown="handleKeydown"
        @paste="handlePaste"
      />

      <!-- 预览区（编辑模式下的预览） -->
      <div
        v-show="isPreviewMode"
        class="markdown-preview preview-scroll"
        :style="{ height: minHeight }"
        v-html="renderedHtml"
      />
    </div>

    <!-- 只读显示模式 -->
    <div
      v-else
      class="markdown-preview"
      v-html="renderedHtml"
      @click="handlePreviewClick"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import MarkdownIt from 'markdown-it'
// @ts-ignore - no types available for markdown-it-task-lists
import taskLists from 'markdown-it-task-lists'
// @ts-ignore
import multimdTable from 'markdown-it-multimd-table'
import 'github-markdown-css/github-markdown-light.css'
import {
  Bold,
  Italic,
  Underline,
  ListOrdered,
  List,
  ListChecks,
  Code,
  Link,
  Edit3,
  Eye,
  Keyboard,
  ArrowLeft,
  ArrowRight
} from 'lucide-vue-next'

interface Props {
  modelValue?: string
  placeholder?: string
  readOnly?: boolean
  minHeight?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '请输入内容... 支持 Markdown 语法',
  readOnly: false,
  minHeight: '200px'
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'save'): void
  (e: 'submit'): void
  (e: 'paste-file', files: File[]): void
}>()

const textareaRef = ref<HTMLTextAreaElement>()
const localContent = ref(props.modelValue || '')
const isPreviewMode = ref(false) // 编辑/预览模式切换

// 配置 markdown-it
const md = new MarkdownIt({
  html: true,
  linkify: true,
  breaks: true // 支持换行
})

// 启用任务列表插件
md.use(taskLists, {
  enabled: true,
  label: true,
  labelAfter: true
})

md.use(multimdTable, {
  multiline: true,
  rowspan: true,
  headerless: false
})

// 渲染 Markdown
const renderedHtml = computed(() => {
  if (!localContent.value) return ''
  return md.render(localContent.value)
})

// 监听外部值变化
watch(() => props.modelValue, (newValue) => {
  if (newValue !== localContent.value) {
    localContent.value = newValue || ''
  }
})

// 处理输入变化
const handleInput = () => {
  emit('update:modelValue', localContent.value)
}

// 处理粘贴事件
const handlePaste = (e: ClipboardEvent) => {
  const items = e.clipboardData?.items
  if (!items) return

  const files: File[] = []

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    if (item && item.kind === 'file') {
      const file = item.getAsFile()
      if (file) {
        files.push(file)
      }
    }
  }

  // 如果检测到文件，触发粘贴文件事件，并阻止默认粘贴行为
  if (files.length > 0) {
    e.preventDefault()
    emit('paste-file', files)
    return
  }

  // 如果没有文件，允许正常的文本粘贴
}

// 处理键盘快捷键
const handleKeydown = (e: KeyboardEvent) => {
  // 处理Tab键缩进
  if (e.key === 'Tab') {
    e.preventDefault()
    handleTabIndent(e.shiftKey) // Shift+Tab 进行反向缩进
    return
  }

  if (e.metaKey || e.ctrlKey) {
    if (e.key === 'b') {
      e.preventDefault()
      insertBold()
    } else if (e.key === 'i') {
      e.preventDefault()
      insertItalic()
    } else if (e.key === 's') {
      // Cmd+S 保存，触发自定义事件
      e.preventDefault()
      emit('save')
    } else if (e.key === 'Enter') {
      // Cmd+Enter 提交，触发自定义事件
      e.preventDefault()
      emit('submit')
    }
  }
}

// 处理Tab键缩进
const handleTabIndent = (isShiftTab: boolean = false) => {
  const textarea = textareaRef.value
  if (!textarea) return

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selectedText = localContent.value.substring(start, end)

  if (selectedText) {
    // 有选中文本，对选中的多行进行缩进处理
    const lines = selectedText.split('\n')
    const indentChar = '    ' // 四个空格作为缩进

    if (isShiftTab) {
      // Shift+Tab：减少缩进
      const processedLines = lines.map(line => {
        // 如果行首有4个空格或制表符，则移除
        return line.startsWith('    ') ? line.substring(4) :
               line.startsWith('\t') ? line.substring(1) : line
      })

      const newText = processedLines.join('\n')
      localContent.value = localContent.value.substring(0, start) + newText + localContent.value.substring(end)

      // 重新设置选中区域
      nextTick(() => {
        textarea.selectionStart = start
        textarea.selectionEnd = start + newText.length
      })
    } else {
      // Tab：增加缩进
      const processedLines = lines.map(line => indentChar + line)
      const newText = processedLines.join('\n')
      localContent.value = localContent.value.substring(0, start) + newText + localContent.value.substring(end)

      // 重新设置选中区域
      nextTick(() => {
        textarea.selectionStart = start
        textarea.selectionEnd = start + newText.length
      })
    }
  } else {
    // 没有选中文本，在当前行插入缩进
    const textBeforeCursor = localContent.value.substring(0, start)
    const textAfterCursor = localContent.value.substring(end)

    // 找到当前行的开始位置
    const currentLineStart = textBeforeCursor.lastIndexOf('\n') + 1
    const currentLine = textBeforeCursor.substring(currentLineStart)

    if (isShiftTab) {
      // Shift+Tab：移除当前行开头的缩进
      let newLine = currentLine
      if (currentLine.startsWith('    ')) {
        newLine = currentLine.substring(4)
      } else if (currentLine.startsWith('\t')) {
        newLine = currentLine.substring(1)
      }

      localContent.value = textBeforeCursor.substring(0, currentLineStart) + newLine + textAfterCursor

      // 重新设置光标位置
      nextTick(() => {
        textarea.selectionStart = textarea.selectionEnd = currentLineStart + newLine.length
      })
    } else {
      // Tab：插入四个空格
      localContent.value = textBeforeCursor + '    ' + textAfterCursor

      // 重新设置光标位置
      nextTick(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 4
      })
    }
  }
}

// 处理预览模式下的 checkbox 点击
const handlePreviewClick = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (target.tagName === 'INPUT' && target.getAttribute('type') === 'checkbox') {
    e.preventDefault()
    const checkbox = target as HTMLInputElement
    const checked = !checkbox.checked

    // 更新 Markdown 内容中对应的 checkbox 状态
    updateCheckboxState(checkbox, checked)
  }
}

// 更新 checkbox 状态
const updateCheckboxState = (checkbox: HTMLInputElement, checked: boolean) => {
  // 找到对应的列表项索引
  let listItem = checkbox.closest('li')
  if (!listItem) return

  let index = 0
  let current = listItem.previousElementSibling
  while (current) {
    index++
    current = current.previousElementSibling
  }

  // 在 Markdown 文本中找到对应的 checkbox 并更新
  const lines = localContent.value.split('\n')
  let checkboxCount = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!line) continue

    const match = line.match(/^(\s*)-\s+\[([ x])\]/)
    if (match) {
      if (checkboxCount === index) {
        lines[i] = line.replace(/\[([ x])\]/, checked ? '[x]' : '[ ]')
        localContent.value = lines.join('\n')
        emit('update:modelValue', localContent.value)
        break
      }
      checkboxCount++
    }
  }
}

// 获取当前选中的文本和位置
const getSelection = () => {
  const textarea = textareaRef.value
  if (!textarea) return null

  return {
    start: textarea.selectionStart,
    end: textarea.selectionEnd,
    text: textarea.value.substring(textarea.selectionStart, textarea.selectionEnd)
  }
}

// 在当前位置插入文本
const insertText = (text: string, offsetStart = 0, offsetEnd = 0) => {
  const textarea = textareaRef.value
  if (!textarea) return

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const value = textarea.value

  const newValue = value.substring(0, start) + text + value.substring(end)
  localContent.value = newValue
  emit('update:modelValue', newValue)

  // 设置新的光标位置
  nextTick(() => {
    textarea.focus()
    textarea.selectionStart = start + text.length + offsetStart
    textarea.selectionEnd = start + text.length + offsetEnd
  })
}

// 包裹选中的文本
const wrapSelection = (before: string, after: string) => {
  const selection = getSelection()
  if (!selection) return

  const textarea = textareaRef.value!
  const { start, end, text } = selection
  const value = textarea.value

  const newValue = value.substring(0, start) + before + text + after + value.substring(end)
  localContent.value = newValue
  emit('update:modelValue', newValue)

  nextTick(() => {
    textarea.focus()
    if (text) {
      // 有选中文本，选中包裹后的文本
      textarea.selectionStart = start + before.length
      textarea.selectionEnd = end + before.length
    } else {
      // 无选中文本，光标放在中间
      textarea.selectionStart = textarea.selectionEnd = start + before.length
    }
  })
}

// 工具栏按钮功能
const insertBold = () => {
  wrapSelection('**', '**')
}

const insertItalic = () => {
  wrapSelection('*', '*')
}

const insertUnderline = () => {
  wrapSelection('<u>', '</u>')
}

const insertOrderedList = () => {
  insertText('1. ')
}

const insertBulletList = () => {
  insertText('- ')
}

const insertTaskList = () => {
  insertText('- [ ] ')
}

const insertCodeBlock = () => {
  wrapSelection('```\n', '\n```')
}

const insertLink = () => {
  const selection = getSelection()
  if (selection && selection.text) {
    wrapSelection('[', '](url)')
  } else {
    insertText('[链接文字](url)')
  }
}

// 暴露方法供父组件调用
defineExpose({
  focus: () => {
    if (textareaRef.value) {
      textareaRef.value.focus()
    }
  },
  isPreviewMode,
  setPreviewMode: (value: boolean) => {
    isPreviewMode.value = value
  }
})
</script>

<style scoped>
.markdown-editor-wrapper {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  overflow: hidden;
  transition: all 0.2s;
}

.markdown-editor-wrapper:not(.read-only):hover {
  border-color: #d1d5db;
}

.markdown-editor-wrapper:not(.read-only):focus-within {
  border-color: #3b82f6;
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.dark .markdown-editor-wrapper:not(.read-only) {
  border-color: #4b5563;
}

.dark .markdown-editor-wrapper:not(.read-only):hover {
  border-color: #6b7280;
}

.dark .markdown-editor-wrapper:not(.read-only):focus-within {
  border-color: #60a5fa;
  box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.2);
}

.markdown-editor-wrapper.read-only {
  border: none;
  background-color: transparent;
}

/* 工具栏样式 */
.toolbar {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background-color: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.dark .toolbar {
  background-color: #374151;
  border-bottom-color: #4b5563;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.toolbar-btn {
  padding: 4px 8px;
  min-width: 28px;
  height: 28px;
  border: none;
  background-color: transparent;
  color: #374151;
  cursor: pointer;
  border-radius: 4px;
  font-size: 14px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toolbar-btn:hover {
  background-color: #e5e7eb;
  color: #1f2937;
}

.toolbar-btn:active {
  background-color: #d1d5db;
}

.dark .toolbar-btn {
  color: #d1d5db;
}

.dark .toolbar-btn:hover {
  background-color: #4b5563;
  color: #f3f4f6;
}

.dark .toolbar-btn:active {
  background-color: #6b7280;
}

.divider {
  width: 1px;
  height: 20px;
  background-color: #d1d5db;
  margin: 0 4px;
}

.dark .divider {
  background-color: #4b5563;
}

/* Textarea 样式 */
.markdown-textarea {
  width: 100%;
  padding: 12px 16px;
  border: none;
  outline: none;
  resize: vertical;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  font-size: 14px;
  line-height: 1.6;
  color: #333;
  background-color: transparent;
}

.markdown-textarea::placeholder {
  color: #9ca3af;
}

/* 暗黑模式下的 textarea 样式 */
.dark .markdown-textarea {
  color: #f3f4f6;
  background-color: transparent;
}

.dark .markdown-textarea::placeholder {
  color: #9ca3af;
}

/* Markdown 预览样式 */
.markdown-preview {
  padding: 12px 16px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  font-size: 14px;
  line-height: 1.6;
  color: #333;
}

.dark .markdown-preview {
  color: #f3f4f6;
}

/* 预览模式独立滚动 */
.markdown-preview.preview-scroll {
  overflow-y: auto;
  overflow-x: hidden;
}

/* 应用 GitHub Markdown 样式 */
.markdown-preview :deep(*) {
  all: revert;
}

.markdown-preview :deep(p) {
  margin-bottom: 0.5em;
  margin-top: 0;
}

.markdown-preview :deep(ul),
.markdown-preview :deep(ol) {
  padding-left: 1em;
  margin-bottom: 0.5em;
  margin-top: 0.25em;
}

.markdown-preview :deep(li) {
  margin-bottom: 0.25em;
}

.markdown-preview :deep(ul.contains-task-list) {
  list-style: none;
  padding-left: 0em;
}

.markdown-preview :deep(li.task-list-item) {
  position: relative;
  padding-left: 1.5em;
}

.markdown-preview :deep(li.task-list-item input[type="checkbox"]) {
  position: absolute;
  left: 0;
  top: 0.15em;
  cursor: pointer;
}

.markdown-preview :deep(code) {
  background-color: rgba(175, 184, 193, 0.2);
  color: #EB5757;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 0.9em;
  border-radius: 3px;
  padding: 0.2em 0.4em;
}

.markdown-preview :deep(pre) {
  background-color: #f6f8fa;
  color: #24292e;
  border-radius: 6px;
  padding: 16px;
  overflow-x: auto;
  margin: 0.5em 0;
}

.markdown-preview :deep(pre code) {
  background-color: transparent;
  color: inherit;
  padding: 0;
  margin: 0;
}

.markdown-preview :deep(blockquote) {
  border-left: 3px solid #dfe1e4;
  padding-left: 12px;
  color: #606060;
  margin: 10px 0;
}

.markdown-preview :deep(a) {
  color: #3b82f6;
  text-decoration: underline;
}

.markdown-preview :deep(h1),
.markdown-preview :deep(h2),
.markdown-preview :deep(h3),
.markdown-preview :deep(h4),
.markdown-preview :deep(h5),
.markdown-preview :deep(h6) {
  margin-top: 1em;
  margin-bottom: 0.5em;
  font-weight: 600;
  line-height: 1.25;
}

.markdown-preview :deep(h1) { font-size: 2em; }
.markdown-preview :deep(h2) { font-size: 1.5em; }
.markdown-preview :deep(h3) { font-size: 1.25em; }
.markdown-preview :deep(h4) { font-size: 1em; }
.markdown-preview :deep(h5) { font-size: 0.875em; }
.markdown-preview :deep(h6) { font-size: 0.85em; }

.markdown-preview :deep(strong) {
  font-weight: 600;
}

.markdown-preview :deep(em) {
  font-style: italic;
}

.markdown-preview :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 0.75em 0;
  font-size: 13px;
  display: table;
}

.markdown-preview :deep(thead) {
  display: table-header-group;
}

.markdown-preview :deep(tbody) {
  display: table-row-group;
}

.markdown-preview :deep(tr) {
  display: table-row;
}

.markdown-preview :deep(th),
.markdown-preview :deep(td) {
  display: table-cell;
  border: 1px solid #e5e7eb;
  padding: 6px 10px;
  text-align: left;
  vertical-align: top;
}

.markdown-preview :deep(th) {
  background-color: #f9fafb;
  font-weight: 600;
}

.dark .markdown-preview :deep(th),
.dark .markdown-preview :deep(td) {
  border-color: #4b5563;
}

.dark .markdown-preview :deep(th) {
  background-color: #374151;
}
</style>
