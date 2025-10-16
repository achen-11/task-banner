<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import draggable from 'vuedraggable'
import { useProjectStore } from '@/stores/project'
import { useTaskStore } from '@/stores/task'
import { useDBStore } from '@/stores/db'
import type { Task, TaskStatus } from '@/types'
import TaskDialog from '@/components/TaskDialog.vue'
import ExportDialog from '@/components/ExportDialog.vue'
import ImportDialog from '@/components/ImportDialog.vue'

const route = useRoute()
const router = useRouter()
const projectStore = useProjectStore()
const taskStore = useTaskStore()
const dbStore = useDBStore()

const projectId = computed(() => route.params.projectId as string)
const project = computed(() => projectStore.getProjectById(projectId.value))

const showTaskDialog = ref(false)
const showExportDialog = ref(false)
const showImportDialog = ref(false)
const editingTask = ref<Task | null>(null)
const selectedTasks = ref<Set<string>>(new Set())

// 任务列状态配置
const columns = [
  { status: 'todo' as TaskStatus, label: '待办', color: 'bg-gray-100' },
  { status: 'in_progress' as TaskStatus, label: '进行中', color: 'bg-blue-100' },
  { status: 'completed' as TaskStatus, label: '已完成', color: 'bg-green-100' },
  { status: 'sent_to_ai' as TaskStatus, label: '已发送AI', color: 'bg-purple-100' },
  { status: 'needs_optimization' as TaskStatus, label: '需优化', color: 'bg-orange-100' },
]

// 优先级颜色映射
const priorityColorMap: Record<string, string> = {
  low: 'text-gray-600',
  medium: 'text-blue-600',
  high: 'text-orange-600',
  urgent: 'text-red-600',
}

// 优先级标签映射
const priorityLabelMap: Record<string, string> = {
  low: '低',
  medium: '中',
  high: '高',
  urgent: '紧急',
}

// 预定义标签颜色映射
const tagColorMap: Record<string, string> = {
  '功能': 'primary',
  'UI': 'success',
  '优化': 'warning',
  'Bug': 'danger',
  '文档': 'info',
  '测试': '',
  '重构': '',
}

// 获取标签颜色类型
const getTagType = (tag: string): '' | 'success' | 'warning' | 'danger' | 'info' | 'primary' => {
  return (tagColorMap[tag] || '') as '' | 'success' | 'warning' | 'danger' | 'info' | 'primary'
}

// 按状态获取任务
const getTasksByStatus = (status: TaskStatus) => {
  return taskStore.getTasksByStatus(projectId.value, status)
}

// 拖拽结束处理
const onDragEnd = async (status: TaskStatus) => {
  const tasks = getTasksByStatus(status)
  tasks.forEach((task: Task, index: number) => {
    // 深度克隆 changelog
    const clonedChangelog = Array.isArray(task.changelog)
      ? task.changelog.map(entry => ({
          timestamp: entry.timestamp,
          field: entry.field,
          oldValue: entry.oldValue,
          newValue: entry.newValue,
          action: entry.action
        }))
      : []

    // 创建纯对象用于保存，避免克隆响应式对象
    const updatedTask: Task = {
      id: task.id,
      projectId: task.projectId,
      title: task.title,
      description: task.description,
      status: status,
      priority: task.priority,
      tags: [...task.tags],
      technicalPoints: task.technicalPoints ? [...task.technicalPoints] : undefined,
      referenceLinks: task.referenceLinks ? [...task.referenceLinks] : undefined,
      progress: task.progress !== undefined ? task.progress : 0,
      changelog: clonedChangelog,
      order: index,
      createdAt: task.createdAt,
      updatedAt: Date.now(),
    }
    taskStore.updateTask(task.id, { order: index, status })
    dbStore.saveTask(updatedTask)
  })
}

// 创建任务
const createTask = () => {
  editingTask.value = null
  showTaskDialog.value = true
}

// 编辑任务
const editTask = (task: Task) => {
  editingTask.value = task
  showTaskDialog.value = true
}

// 删除任务
const deleteTask = async (task: Task) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除任务"${task.title}"吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    taskStore.deleteTask(task.id)
    await dbStore.removeTask(task.id)
    ElMessage.success('任务删除成功')
  } catch (error) {
    // 用户取消删除
  }
}

// 切换任务选中状态
const toggleTaskSelection = (taskId: string) => {
  if (selectedTasks.value.has(taskId)) {
    selectedTasks.value.delete(taskId)
  } else {
    selectedTasks.value.add(taskId)
  }
}

// 获取选中的任务列表
const getSelectedTasks = computed(() => {
  return taskStore.tasks.filter(task => selectedTasks.value.has(task.id))
})

// 批量导出任务
const exportTasks = () => {
  if (selectedTasks.value.size === 0) {
    ElMessage.warning('请先选择要导出的任务')
    return
  }
  showExportDialog.value = true
}

// 导入任务
const importTasks = () => {
  showImportDialog.value = true
}

// 导入成功处理
const handleImportSuccess = (importedTasks: Task[]) => {
  ElMessage.success(`成功导入 ${importedTasks.length} 个任务`)
  // 清空选中状态
  selectedTasks.value.clear()
}

// 返回项目列表
const goBack = () => {
  router.push('/projects')
}

const handleTaskDialogSuccess = () => {
  // 任务创建/更新成功
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container mx-auto px-6 py-8">
      <!-- 顶部工具栏 -->
      <div class="mb-8">
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-4">
            <el-button @click="goBack">
              ← 返回
            </el-button>
            <div v-if="project">
              <h1 class="text-3xl font-bold text-gray-900">{{ project.name }}</h1>
              <p class="text-gray-600 mt-1">{{ project.description }}</p>
            </div>
          </div>
          <div class="flex gap-2">
            <el-button
              type="info"
              @click="importTasks"
            >
              导入任务
            </el-button>
            <el-button
              v-if="selectedTasks.size > 0"
              type="success"
              @click="exportTasks"
            >
              导出选中 ({{ selectedTasks.size }})
            </el-button>
            <el-button type="primary" @click="createTask">
              新建任务
            </el-button>
          </div>
        </div>

        <!-- 技术栈标签 -->
        <div v-if="project" class="flex gap-2">
          <el-tag
            v-for="tech in project.techStack"
            :key="tech"
            type="info"
            size="small"
          >
            {{ tech }}
          </el-tag>
        </div>
      </div>

      <!-- 看板列 -->
      <div class="grid grid-cols-5 gap-6">
        <div
          v-for="column in columns"
          :key="column.status"
          class="flex flex-col"
        >
          <div :class="['rounded-t-xl p-4 font-semibold', column.color]">
            <div class="flex justify-between items-center">
              <span>{{ column.label }}</span>
              <span class="text-sm opacity-75">{{ getTasksByStatus(column.status).length }}</span>
            </div>
          </div>

          <div class="bg-white rounded-b-xl p-3 flex-1 min-h-[600px] shadow-sm">
            <draggable
              :list="getTasksByStatus(column.status)"
              group="tasks"
              item-key="id"
              class="space-y-3 min-h-full"
              @end="onDragEnd(column.status)"
            >
              <template #item="{ element: task }">
                <div
                  :class="[
                    'bg-white border rounded-xl p-4 cursor-move hover:shadow-lg transition-all duration-200',
                    selectedTasks.has(task.id) ? 'border-blue-400 shadow-md ring-2 ring-blue-100' : 'border-gray-200 hover:border-gray-300'
                  ]"
                  @click="toggleTaskSelection(task.id)"
                >
                  <div class="flex justify-between items-start mb-3">
                    <h3 class="font-semibold text-gray-900 text-base flex-1 line-clamp-2 leading-relaxed">
                      {{ task.title }}
                    </h3>
                    <el-checkbox
                      :model-value="selectedTasks.has(task.id)"
                      @click.stop
                      @change="toggleTaskSelection(task.id)"
                    />
                  </div>

                  <p class="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed" :title="task.description">
                    {{ task.description }}
                  </p>

                  <div class="flex flex-wrap gap-2 mb-3">
                    <el-tag
                      v-for="tag in task.tags"
                      :key="tag"
                      size="small"
                      :type="getTagType(tag)"
                    >
                      {{ tag }}
                    </el-tag>
                    <!-- 迭代标记 -->
                    <el-tag
                      v-if="task.changelog && task.changelog.length > 0"
                      size="small"
                      effect="dark"
                      class="iteration-badge"
                    >
                      🔄 v{{ task.changelog.length }}
                    </el-tag>
                  </div>

                  <div class="flex justify-between items-center text-xs">
                    <span :class="priorityColorMap[task.priority]">
                      {{ priorityLabelMap[task.priority] }}
                    </span>
                    <div class="flex gap-1" @click.stop>
                      <el-button
                        size="small"
                        text
                        type="primary"
                        @click="editTask(task)"
                      >
                        编辑
                      </el-button>
                      <el-button
                        size="small"
                        text
                        type="danger"
                        @click="deleteTask(task)"
                      >
                        删除
                      </el-button>
                    </div>
                  </div>
                </div>
              </template>
            </draggable>
          </div>
        </div>
      </div>

      <!-- 任务对话框 -->
      <TaskDialog
        v-model:visible="showTaskDialog"
        :project-id="projectId"
        :task="editingTask"
        @success="handleTaskDialogSuccess"
      />

      <!-- 导出对话框 -->
      <ExportDialog
        v-model:visible="showExportDialog"
        :tasks="getSelectedTasks"
        :project="project || null"
      />

      <!-- 导入对话框 -->
      <ImportDialog
        v-model:visible="showImportDialog"
        :project-id="projectId"
        @success="handleImportSuccess"
      />
    </div>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.iteration-badge {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  border: none !important;
  font-weight: 600;
}
</style>
