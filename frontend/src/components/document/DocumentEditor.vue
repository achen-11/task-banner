<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    :title="isEditing ? '编辑文档' : '新建文档'"
    width="1200px"
    :before-close="handleClose"
    destroy-on-close
    fullscreen
  >
    <div class="h-full flex flex-col">
      <!-- 文档信息区 -->
      <div class="flex-shrink-0 bg-gray-50 p-4 border-b">
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="文档标题" class="mb-2">
              <el-input
                v-model="form.title"
                placeholder="请输入文档标题"
                maxlength="100"
                show-word-limit
              />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="文档类型" class="mb-2">
              <el-select v-model="form.type" placeholder="选择类型" :disabled="isEditing">
                <el-option label="Markdown" value="markdown" />
                <el-option label="文本" value="text" />
                <el-option label="富文本" value="richtext" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="状态" class="mb-2">
              <el-select v-model="form.status" placeholder="选择状态">
                <el-option label="草稿" value="draft" />
                <el-option label="已发布" value="published" />
                <el-option label="已归档" value="archived" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="标签" class="mb-2">
              <div class="flex items-center flex-wrap gap-2">
                <el-tag
                  v-for="tag in form.tags"
                  :key="tag"
                  closable
                  @close="removeTag(tag)"
                  size="small"
                >
                  {{ tag }}
                </el-tag>
                <el-input
                  v-if="tagInputVisible"
                  ref="tagInputRef"
                  v-model="tagInputValue"
                  size="small"
                  style="width: 100px"
                  @keyup.enter="addTag"
                  @blur="addTag"
                />
                <el-button
                  v-else
                  size="small"
                  @click="showTagInput"
                >
                  + 添加
                </el-button>
              </div>
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- 编辑器区 -->
      <div class="flex-1 flex">
        <!-- 左侧编辑器 -->
        <div class="flex-1 flex flex-col">
          <div class="flex-shrink-0 bg-white border-b px-4 py-2 flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <span class="text-sm font-medium text-gray-700">编辑器</span>
              <el-tag v-if="form.type === 'markdown'" size="small" type="success">Markdown</el-tag>
              <el-tag v-else size="small" type="info">{{ form.type }}</el-tag>
            </div>
            <div class="flex items-center space-x-2">
              <el-button size="small" @click="insertMarkdown('**', '**')" :disabled="form.type !== 'markdown'">
                <strong>B</strong>
              </el-button>
              <el-button size="small" @click="insertMarkdown('*', '*')" :disabled="form.type !== 'markdown'">
                <em>I</em>
              </el-button>
              <el-button size="small" @click="insertMarkdown('`', '`')" :disabled="form.type !== 'markdown'">
                <code>Code</code>
              </el-button>
              <el-button size="small" @click="insertMarkdown('## ', '')" :disabled="form.type !== 'markdown'">
                H2
              </el-button>
              <el-button size="small" @click="insertMarkdown('[', '](url)')" :disabled="form.type !== 'markdown'">
                Link
              </el-button>
              <el-button size="small" @click="insertMarkdown('- ', '')" :disabled="form.type !== 'markdown'">
                List
              </el-button>
            </div>
          </div>

          <div class="flex-1 p-0">
            <el-input
              v-if="form.type === 'text' || form.type === 'markdown'"
              v-model="form.content"
              type="textarea"
              :rows="20"
              placeholder="请输入文档内容..."
              class="h-full"
              style="height: 100%"
              @keydown.ctrl.s.prevent="handleSave"
            />
            <div
              v-else-if="form.type === 'richtext'"
              class="h-full"
            >
              <!-- 富文本编辑器占位符 -->
              <div class="h-full p-4 border border-gray-200 bg-gray-50 flex items-center justify-center">
                <div class="text-center">
                  <el-icon size="48" class="text-gray-400 mb-2">
                    <Edit />
                  </el-icon>
                  <p class="text-gray-500">富文本编辑器功能开发中...</p>
                  <p class="text-sm text-gray-400 mt-1">请选择 Markdown 或文本类型</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧预览区 -->
        <div class="flex-1 flex flex-col border-l">
          <div class="flex-shrink-0 bg-white border-b px-4 py-2 flex items-center justify-between">
            <span class="text-sm font-medium text-gray-700">预览</span>
            <el-button size="small" @click="syncScroll">
              <el-icon><Refresh /></el-icon>
              同步滚动
            </el-button>
          </div>

          <div class="flex-1 overflow-y-auto p-4 bg-white">
            <div
              v-if="form.type === 'markdown'"
              class="prose prose-sm max-w-none markdown-body"
              v-html="markdownPreview"
            />
            <div
              v-else
              class="whitespace-pre-wrap text-sm text-gray-700"
            >
              {{ form.content || '暂无内容预览' }}
            </div>
          </div>
        </div>
      </div>

      <!-- 底部状态栏 -->
      <div class="flex-shrink-0 bg-gray-50 border-t px-4 py-2 flex items-center justify-between">
        <div class="flex items-center space-x-4 text-sm text-gray-600">
          <span>字数: {{ wordCount }}</span>
          <span>行数: {{ lineCount }}</span>
          <span v-if="isEditing" class="text-xs text-gray-500">
            最后修改: {{ formatDate(document?.updatedAt) }}
          </span>
        </div>

        <div class="flex items-center space-x-2">
          <span v-if="autoSaveStatus" class="text-xs text-green-600">
            {{ autoSaveStatus }}
          </span>
          <el-button size="small" @click="handleClose">取消</el-button>
          <el-button type="primary" size="small" @click="handleSave" :loading="loading">
            {{ isEditing ? '保存修改' : '创建文档' }}
          </el-button>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Edit, Refresh } from '@element-plus/icons-vue'
import { marked } from 'marked'
import { createDocument, updateDocument } from '@/api/document'

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

interface Props {
  visible: boolean
  projectId: string
  document?: Document
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  saved: []
}>()

// 表单数据
const form = ref({
  title: '',
  content: '',
  type: 'markdown',
  status: 'draft',
  tags: [] as string[]
})

// 标签输入相关
const tagInputVisible = ref(false)
const tagInputValue = ref('')
const tagInputRef = ref()

// 状态
const loading = ref(false)
const autoSaveStatus = ref('')

// 是否为编辑模式
const isEditing = computed(() => !!props.document)

// Markdown 预览
const markdownPreview = computed(() => {
  if (form.value.type === 'markdown' && form.value.content) {
    try {
      return marked(form.value.content)
    } catch (error) {
      console.error('Markdown 解析错误:', error)
      return '<p class="text-red-500">Markdown 解析错误</p>'
    }
  }
  return ''
})

// 字数统计
const wordCount = computed(() => {
  if (!form.value.content) return 0
  // 简单的中英文字数统计
  const chineseChars = (form.value.content.match(/[\u4e00-\u9fa5]/g) || []).length
  const englishWords = (form.value.content.match(/[a-zA-Z]+/g) || []).length
  return chineseChars + englishWords
})

// 行数统计
const lineCount = computed(() => {
  if (!form.value.content) return 0
  return form.value.content.split('\n').length
})

// 重置表单
const resetForm = () => {
  form.value = {
    title: '',
    content: '',
    type: 'markdown',
    status: 'draft',
    tags: []
  }
  tagInputVisible.value = false
  tagInputValue.value = ''
  autoSaveStatus.value = ''
}

// 监听文档变化
watch(() => props.document, (doc) => {
  if (doc) {
    form.value = {
      title: doc.title,
      content: doc.content,
      type: doc.type,
      status: doc.status,
      tags: [...doc.tags]
    }
  } else {
    resetForm()
  }
}, { immediate: true })

// 监听可见性变化
watch(() => props.visible, (newVal) => {
  if (!newVal) {
    resetForm()
  }
})

// 添加标签
const addTag = () => {
  const tag = tagInputValue.value.trim()
  if (tag && !form.value.tags.includes(tag)) {
    form.value.tags.push(tag)
  }
  tagInputVisible.value = false
  tagInputValue.value = ''
}

// 移除标签
const removeTag = (tag: string) => {
  const index = form.value.tags.indexOf(tag)
  if (index > -1) {
    form.value.tags.splice(index, 1)
  }
}

// 显示标签输入框
const showTagInput = () => {
  tagInputVisible.value = true
  nextTick(() => {
    tagInputRef.value?.focus()
  })
}

// 插入 Markdown 语法
const insertMarkdown = (before: string, after: string) => {
  const textarea = document.querySelector('textarea') as HTMLTextAreaElement
  if (!textarea) return

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selectedText = form.value.content.substring(start, end)
  const newText = before + selectedText + after

  form.value.content =
    form.value.content.substring(0, start) +
    newText +
    form.value.content.substring(end)

  nextTick(() => {
    textarea.focus()
    const newCursorPos = start + before.length + selectedText.length
    textarea.setSelectionRange(newCursorPos, newCursorPos)
  })
}

// 同步滚动
const syncScroll = () => {
  // 这里可以实现编辑器和预览区的滚动同步
  ElMessage.info('滚动同步功能开发中...')
}

// 保存文档
const handleSave = async () => {
  if (!form.value.title.trim()) {
    ElMessage.warning('请输入文档标题')
    return
  }

  loading.value = true
  autoSaveStatus.value = '保存中...'

  try {
    let result
    if (isEditing.value) {
      result = await updateDocument({
        id: props.document!._id,
        title: form.value.title,
        content: form.value.content,
        status: form.value.status,
        changeLog: '更新文档内容'
      })
    } else {
      result = await createDocument({
        ...form.value,
        projectId: props.projectId
      })
    }

    ElMessage.success(isEditing.value ? '文档保存成功' : '文档创建成功')
      autoSaveStatus.value = '保存成功'
    emit('saved')

    // 延迟关闭
    setTimeout(() => {
      handleClose()
    }, 1000)
  } catch (error) {
    console.error('保存文档失败:', error)
    ElMessage.error('保存失败')
    autoSaveStatus.value = '保存失败'
  } finally {
    loading.value = false
    setTimeout(() => {
      autoSaveStatus.value = ''
    }, 2000)
  }
}

// 关闭对话框
const handleClose = async () => {
  if (form.value.content !== props.document?.content ||
      form.value.title !== props.document?.title ||
      JSON.stringify(form.value.tags) !== JSON.stringify(props.document?.tags)) {

    try {
      await ElMessageBox.confirm(
        '您有未保存的修改，确定要关闭吗？',
        '确认关闭',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
    } catch {
      return
    }
  }

  emit('update:visible', false)
}

// 格式化日期
const formatDate = (timestamp?: number) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN')
}
</script>

<style scoped>
.markdown-body {
  min-height: 100%;
}

:deep(.el-textarea__inner) {
  height: 100% !important;
  resize: none;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  line-height: 1.5;
}
</style>