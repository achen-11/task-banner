<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { Task, TaskStatus, Priority } from '@/types'
import { generateId } from '@/utils'
import { useTaskStore } from '@/stores/task'
import { useDBStore } from '@/stores/db'

interface Props {
  visible: boolean
  projectId: string
  task?: Task | null
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const taskStore = useTaskStore()
const dbStore = useDBStore()

const formRef = ref()
const formData = ref({
  title: '',
  description: '',
  status: 'todo' as TaskStatus,
  priority: 'medium' as Priority,
  tags: [] as string[],
  estimatedEffort: '',
  dueDate: '',
  technicalPoints: [] as string[],
  referenceLinks: [] as string[],
})

const tagInput = ref('')
const techPointInput = ref('')
const refLinkInput = ref('')

const statusOptions = [
  { label: '待办', value: 'todo' },
  { label: '进行中', value: 'in_progress' },
  { label: '已完成', value: 'completed' },
  { label: '已发送AI', value: 'sent_to_ai' },
  { label: '需优化', value: 'needs_optimization' },
]

const priorityOptions = [
  { label: '低', value: 'low' },
  { label: '中', value: 'medium' },
  { label: '高', value: 'high' },
  { label: '紧急', value: 'urgent' },
]

const rules = {
  title: [
    { required: true, message: '请输入任务标题', trigger: 'blur' },
    { min: 2, max: 100, message: '长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入任务描述', trigger: 'blur' },
  ],
}

watch(() => props.visible, (newVal) => {
  if (newVal) {
    if (props.task) {
      // 编辑模式
      formData.value = {
        title: props.task.title,
        description: props.task.description,
        status: props.task.status,
        priority: props.task.priority,
        tags: [...props.task.tags],
        estimatedEffort: props.task.estimatedEffort || '',
        dueDate: props.task.dueDate ? new Date(props.task.dueDate).toISOString().split('T')[0] : '',
        technicalPoints: props.task.technicalPoints ? [...props.task.technicalPoints] : [],
        referenceLinks: props.task.referenceLinks ? [...props.task.referenceLinks] : [],
      }
    } else {
      resetForm()
    }
  }
})

function resetForm() {
  formData.value = {
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    tags: [],
    estimatedEffort: '',
    dueDate: '',
    technicalPoints: [],
    referenceLinks: [],
  }
  tagInput.value = ''
  techPointInput.value = ''
  refLinkInput.value = ''
  formRef.value?.clearValidate()
}

function addTag() {
  if (tagInput.value.trim() && !formData.value.tags.includes(tagInput.value.trim())) {
    formData.value.tags.push(tagInput.value.trim())
    tagInput.value = ''
  }
}

function removeTag(index: number) {
  formData.value.tags.splice(index, 1)
}

function addTechPoint() {
  if (techPointInput.value.trim() && !formData.value.technicalPoints.includes(techPointInput.value.trim())) {
    formData.value.technicalPoints.push(techPointInput.value.trim())
    techPointInput.value = ''
  }
}

function removeTechPoint(index: number) {
  formData.value.technicalPoints.splice(index, 1)
}

function addRefLink() {
  if (refLinkInput.value.trim() && !formData.value.referenceLinks.includes(refLinkInput.value.trim())) {
    formData.value.referenceLinks.push(refLinkInput.value.trim())
    refLinkInput.value = ''
  }
}

function removeRefLink(index: number) {
  formData.value.referenceLinks.splice(index, 1)
}

async function handleSubmit() {
  try {
    await formRef.value?.validate()

    if (props.task) {
      // 更新任务 - 创建新的纯对象，避免克隆响应式对象
      const updatedTask: Task = {
        id: props.task.id,
        projectId: props.task.projectId,
        title: formData.value.title,
        description: formData.value.description,
        status: formData.value.status,
        priority: formData.value.priority,
        tags: [...formData.value.tags], // 创建新数组
        estimatedEffort: formData.value.estimatedEffort || undefined,
        dueDate: formData.value.dueDate ? new Date(formData.value.dueDate).getTime() : undefined,
        technicalPoints: formData.value.technicalPoints.length > 0 ? [...formData.value.technicalPoints] : undefined,
        referenceLinks: formData.value.referenceLinks.length > 0 ? [...formData.value.referenceLinks] : undefined,
        order: props.task.order,
        createdAt: props.task.createdAt,
        updatedAt: Date.now(),
      }
      taskStore.updateTask(props.task.id, updatedTask)
      await dbStore.saveTask(updatedTask)
      ElMessage.success('任务更新成功')
    } else {
      // 创建新任务
      const newTask: Task = {
        id: generateId(),
        projectId: props.projectId,
        title: formData.value.title,
        description: formData.value.description,
        status: formData.value.status,
        priority: formData.value.priority,
        tags: [...formData.value.tags], // 创建新数组
        estimatedEffort: formData.value.estimatedEffort || undefined,
        dueDate: formData.value.dueDate ? new Date(formData.value.dueDate).getTime() : undefined,
        technicalPoints: formData.value.technicalPoints.length > 0 ? [...formData.value.technicalPoints] : undefined,
        referenceLinks: formData.value.referenceLinks.length > 0 ? [...formData.value.referenceLinks] : undefined,
        order: taskStore.tasks.length,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      taskStore.addTask(newTask)
      await dbStore.saveTask(newTask)
      ElMessage.success('任务创建成功')
    }

    emit('success')
    handleClose()
  } catch (error) {
    console.error('Form validation failed:', error)
  }
}

function handleClose() {
  emit('update:visible', false)
  setTimeout(() => {
    resetForm()
  }, 300)
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    :title="task ? '编辑任务' : '创建任务'"
    width="700px"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="100px"
    >
      <el-form-item label="任务标题" prop="title">
        <el-input
          v-model="formData.title"
          placeholder="请输入任务标题"
          maxlength="100"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="任务描述" prop="description">
        <el-input
          v-model="formData.description"
          type="textarea"
          placeholder="支持 Markdown 格式"
          :rows="6"
          maxlength="2000"
          show-word-limit
        />
      </el-form-item>

      <div class="grid grid-cols-2 gap-4">
        <el-form-item label="任务状态" prop="status">
          <el-select v-model="formData.status" placeholder="请选择状态" class="w-full">
            <el-option
              v-for="item in statusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="优先级" prop="priority">
          <el-select v-model="formData.priority" placeholder="请选择优先级" class="w-full">
            <el-option
              v-for="item in priorityOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <el-form-item label="预计工作量">
          <el-input
            v-model="formData.estimatedEffort"
            placeholder="如: 2小时, 1天"
          />
        </el-form-item>

        <el-form-item label="截止日期">
          <el-date-picker
            v-model="formData.dueDate"
            type="date"
            placeholder="选择日期"
            class="w-full"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
      </div>

      <el-form-item label="标签">
        <div class="w-full">
          <div class="flex gap-2 mb-2">
            <el-input
              v-model="tagInput"
              placeholder="输入标签并回车添加"
              @keyup.enter="addTag"
            />
            <el-button @click="addTag">添加</el-button>
          </div>
          <div class="flex flex-wrap gap-2">
            <el-tag
              v-for="(tag, index) in formData.tags"
              :key="tag"
              closable
              @close="removeTag(index)"
            >
              {{ tag }}
            </el-tag>
            <span v-if="formData.tags.length === 0" class="text-gray-400 text-sm">
              暂无标签
            </span>
          </div>
        </div>
      </el-form-item>

      <el-form-item label="技术要点">
        <div class="w-full">
          <div class="flex gap-2 mb-2">
            <el-input
              v-model="techPointInput"
              placeholder="输入技术要点并回车添加"
              @keyup.enter="addTechPoint"
            />
            <el-button @click="addTechPoint">添加</el-button>
          </div>
          <div class="flex flex-col gap-1">
            <div
              v-for="(point, index) in formData.technicalPoints"
              :key="index"
              class="flex items-center gap-2"
            >
              <span class="flex-1 text-sm">{{ index + 1 }}. {{ point }}</span>
              <el-button size="small" text type="danger" @click="removeTechPoint(index)">
                删除
              </el-button>
            </div>
            <span v-if="formData.technicalPoints.length === 0" class="text-gray-400 text-sm">
              暂无技术要点
            </span>
          </div>
        </div>
      </el-form-item>

      <el-form-item label="参考链接">
        <div class="w-full">
          <div class="flex gap-2 mb-2">
            <el-input
              v-model="refLinkInput"
              placeholder="输入参考链接并回车添加"
              @keyup.enter="addRefLink"
            />
            <el-button @click="addRefLink">添加</el-button>
          </div>
          <div class="flex flex-col gap-1">
            <div
              v-for="(link, index) in formData.referenceLinks"
              :key="index"
              class="flex items-center gap-2"
            >
              <a :href="link" target="_blank" class="flex-1 text-sm text-blue-600 hover:underline truncate">
                {{ link }}
              </a>
              <el-button size="small" text type="danger" @click="removeRefLink(index)">
                删除
              </el-button>
            </div>
            <span v-if="formData.referenceLinks.length === 0" class="text-gray-400 text-sm">
              暂无参考链接
            </span>
          </div>
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleSubmit">
        {{ task ? '保存' : '创建' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
