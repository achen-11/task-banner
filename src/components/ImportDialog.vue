<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { importTasksFromMarkdown } from '@/utils/export'
import { useTaskStore } from '@/stores/task'
import { useDBStore } from '@/stores/db'
import type { Task } from '@/types'

interface Props {
  visible: boolean
  projectId: string
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'success', tasks: Task[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const taskStore = useTaskStore()
const dbStore = useDBStore()

const markdownInput = ref('')
const importing = ref(false)
const importMode = ref<'update' | 'new'>('update')

async function handleImport() {
  if (!markdownInput.value.trim()) {
    ElMessage.warning('请输入要导入的 Markdown 内容')
    return
  }

  try {
    importing.value = true

    // 获取现有任务 ID 列表
    const existingTasks = taskStore.getTasksByProject(props.projectId)
    const existingTaskIds = existingTasks.map(t => t.id)

    // 解析 Markdown
    const parsedTasks = importTasksFromMarkdown(
      markdownInput.value,
      props.projectId,
      importMode.value === 'new' ? existingTaskIds : []
    )

    if (parsedTasks.length === 0) {
      ElMessage.warning('未能从 Markdown 中解析出任何任务')
      return
    }

    const importedTasks: Task[] = []

    for (const parsedTask of parsedTasks) {
      // 确保必需字段存在
      if (!parsedTask.title || !parsedTask.id) {
        continue
      }

      const fullTask: Task = {
        id: parsedTask.id,
        projectId: props.projectId,
        title: parsedTask.title,
        description: parsedTask.description || '',
        status: parsedTask.status || 'todo',
        priority: parsedTask.priority || 'medium',
        tags: parsedTask.tags || [],
        technicalPoints: parsedTask.technicalPoints,
        referenceLinks: parsedTask.referenceLinks,
        progress: parsedTask.progress || 0,
        changelog: parsedTask.changelog || [],
        order: parsedTask.order || taskStore.tasks.length,
        createdAt: parsedTask.createdAt || Date.now(),
        updatedAt: Date.now(),
      }

      if (importMode.value === 'update') {
        // 更新模式：查找并更新现有任务
        const existingTask = taskStore.getTaskById(fullTask.id)
        if (existingTask) {
          // 添加变更日志
          const changes = [{
            timestamp: Date.now(),
            field: 'AI回填',
            oldValue: '任务更新前',
            newValue: '任务已通过AI回填更新',
            action: 'AI回填更新了任务内容'
          }]
          fullTask.changelog = [...existingTask.changelog, ...changes]

          taskStore.updateTask(fullTask.id, fullTask)
          await dbStore.saveTask(fullTask)
        } else {
          // ID 不存在，作为新任务添加
          taskStore.addTask(fullTask)
          await dbStore.saveTask(fullTask)
        }
      } else {
        // 新建模式：始终作为新任务添加
        taskStore.addTask(fullTask)
        await dbStore.saveTask(fullTask)
      }

      importedTasks.push(fullTask)
    }

    ElMessage.success(`成功导入 ${importedTasks.length} 个任务`)
    emit('success', importedTasks)
    handleClose()
  } catch (error) {
    console.error('Import failed:', error)
    ElMessage.error('导入失败，请检查 Markdown 格式')
  } finally {
    importing.value = false
  }
}

function handleClose() {
  markdownInput.value = ''
  emit('update:visible', false)
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    title="导入任务"
    width="800px"
    @close="handleClose"
  >
    <div class="import-container">
      <div class="mb-4">
        <el-alert
          type="info"
          :closable="false"
          show-icon
        >
          <template #title>
            <div class="text-sm">
              <p class="mb-2">将 AI 生成或修改后的 Markdown 内容粘贴到下方文本框中</p>
              <p class="text-xs text-gray-600">
                • 更新模式：根据任务 ID 更新现有任务<br>
                • 新建模式：忽略任务 ID，所有任务都作为新任务导入
              </p>
            </div>
          </template>
        </el-alert>
      </div>

      <el-radio-group v-model="importMode" class="mb-4">
        <el-radio value="update">更新现有任务</el-radio>
        <el-radio value="new">全部作为新任务</el-radio>
      </el-radio-group>

      <el-input
        v-model="markdownInput"
        type="textarea"
        placeholder="请粘贴 Markdown 内容..."
        :rows="16"
        class="markdown-input"
      />

      <div class="mt-4 text-sm text-gray-500">
        提示：确保 Markdown 内容包含任务 ID（HTML 注释格式：&lt;!-- task-id: xxx --&gt;）以便正确匹配和更新任务
      </div>
    </div>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button
        type="primary"
        :loading="importing"
        @click="handleImport"
      >
        {{ importing ? '导入中...' : '确认导入' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.import-container {
  padding: 8px 0;
}

.markdown-input :deep(textarea) {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace;
  font-size: 13px;
  line-height: 1.6;
}
</style>
