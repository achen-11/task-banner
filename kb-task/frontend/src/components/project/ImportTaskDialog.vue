<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    title="确认导入任务"
    width="700px"
    :append-to-body="true"
  >
    <div class="space-y-4">
      <div class="text-sm text-gray-600 mb-4">
        检测到 {{ tasks.length }} 个任务，请确认并编辑任务摘要：
      </div>

      <div class="max-h-96 overflow-y-auto space-y-2">
        <div v-for="(task, index) in tasks" :key="index" class="border border-gray-200 rounded-lg p-3"
             :class="task._id && task.existingInfo ? 'border-blue-200 bg-blue-50' : ''">
          <div class="flex items-start gap-2 mb-2">
            <div class="flex-1">
              <!-- 任务标题 -->
              <h4 class="text-sm font-medium text-gray-900 mb-1">
                {{ task.title || '未命名任务' }}
                <span v-if="task._id" class="text-xs text-gray-500 ml-1">#{{ task._id.slice(-6) }}</span>
              </h4>

              <!-- 状态标签 -->
              <div class="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
                <span class="px-1.5 py-0.5 rounded" :class="getStatusBadgeClass(task.status || 'todo')">
                  {{ getStatusText(task.status || 'todo') }}
                </span>
                <span class="px-1.5 py-0.5 rounded" :class="getPriorityBadgeClass(task.priority || 'medium')">
                  {{ getPriorityText(task.priority || 'medium') }}优先级
                </span>
                <span v-if="task._id && task.existingInfo" class="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 text-xs">
                  更新现有任务
                </span>
                <span v-else-if="task._id" class="px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 text-xs">
                  任务不存在（将新建）
                </span>
                <span v-else class="px-1.5 py-0.5 rounded bg-green-100 text-green-700 text-xs">
                  新建任务
                </span>
              </div>

              <!-- 现有任务信息对比 -->
              <div v-if="task._id && task.existingInfo" class="text-xs text-gray-600 bg-white rounded p-2 mb-2">
                <div class="font-medium text-gray-700 mb-1">现有任务信息：</div>
                <div class="grid grid-cols-3 gap-2">
                  <div>
                    <span class="text-gray-500">标题:</span> {{ task.existingInfo.title }}
                  </div>
                  <div>
                    <span class="text-gray-500">状态:</span>
                    <span class="ml-1 px-1 py-0.5 rounded text-xs" :class="getStatusBadgeClass(task.existingInfo.status)">
                      {{ getStatusText(task.existingInfo.status) }}
                    </span>
                  </div>
                  <div>
                    <span class="text-gray-500">优先级:</span>
                    <span class="ml-1 px-1 py-0.5 rounded text-xs" :class="getPriorityBadgeClass(task.existingInfo.priority)">
                      {{ getPriorityText(task.existingInfo.priority) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="block text-xs font-medium text-gray-700">任务摘要</label>
            <el-input v-model="editableSummaries[index]" type="textarea" :rows="2" placeholder="简要描述此次变更的内容..."
              maxlength="100" show-word-limit size="small" />
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleConfirm" :loading="loading">确认导入</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { Task } from '@/types/task'
import {
  getStatusBadgeClass,
  getStatusText,
  getPriorityBadgeClass,
  getPriorityText
} from '@/utils/taskStatus'

interface ImportTask extends Partial<Task> {
  summary?: string
  existingInfo?: {
    title: string
    status: string
    priority: string
  }
  aiSolution?: string
}

interface Props {
  visible: boolean
  tasks: ImportTask[]
  loading?: boolean
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'confirm', tasks: ImportTask[]): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const emit = defineEmits<Emits>()

// 可编辑的摘要
const editableSummaries = ref<Record<number, string>>({})

// 监听 tasks 变化，重新初始化摘要
watch(() => props.tasks, (newTasks) => {
  editableSummaries.value = {}
  newTasks.forEach((task, index) => {
    editableSummaries.value[index] = task.summary || ''
  })
}, { immediate: true, deep: true })


// 处理取消
const handleCancel = () => {
  emit('cancel')
}

// 处理确认
const handleConfirm = () => {
  // 更新任务的摘要
  const finalTasks = props.tasks.map((task, index) => ({
    ...task,
    summary: editableSummaries.value[index] || ''
  }))

  emit('confirm', finalTasks)
}
</script>

<style scoped>
/* 样式保持与原组件一致 */
</style>