<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { Task, Project } from '@/types'
import { exportTasksToMarkdown, copyToClipboard, downloadAsFile } from '@/utils/export'

interface Props {
  visible: boolean
  tasks: Task[]
  project: Project | null
}

interface Emits {
  (e: 'update:visible', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const markdownContent = ref('')
const copying = ref(false)

// 生成 Markdown 内容
watch(() => [props.visible, props.tasks, props.project], () => {
  if (props.visible && props.project) {
    markdownContent.value = exportTasksToMarkdown(props.tasks, props.project)
  }
}, { immediate: true })

// 复制到剪贴板
const handleCopy = async () => {
  copying.value = true
  try {
    const success = await copyToClipboard(markdownContent.value)
    if (success) {
      ElMessage.success('已复制到剪贴板')
    } else {
      ElMessage.error('复制失败，请手动复制')
    }
  } catch (error) {
    ElMessage.error('复制失败')
  } finally {
    copying.value = false
  }
}

// 下载为文件
const handleDownload = () => {
  if (!props.project) return

  const timestamp = new Date().toISOString().split('T')[0]
  const filename = `${props.project.name}-任务需求-${timestamp}.md`

  downloadAsFile(markdownContent.value, filename)
  ElMessage.success('下载成功')
}

// 关闭对话框
const handleClose = () => {
  emit('update:visible', false)
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    title="导出 Markdown"
    width="800px"
    @close="handleClose"
  >
    <div class="mb-4 flex justify-between items-center">
      <div class="text-sm text-gray-600">
        已选择 {{ tasks.length }} 个任务
      </div>
      <div class="flex gap-2">
        <el-button
          :loading="copying"
          type="primary"
          @click="handleCopy"
        >
          {{ copying ? '复制中...' : '复制到剪贴板' }}
        </el-button>
        <el-button @click="handleDownload">
          下载 MD 文件
        </el-button>
      </div>
    </div>

    <div class="preview-container">
      <pre class="markdown-preview">{{ markdownContent }}</pre>
    </div>

    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.preview-container {
  max-height: 60vh;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background-color: #f9fafb;
}

.markdown-preview {
  padding: 1.5rem;
  margin: 0;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  color: #374151;
}
</style>
