<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { Task, TaskStatus, Priority, ChangeLogEntry } from '@/types'
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
  technicalPoints: [] as string[],
  referenceLinks: [] as string[],
  progress: 0,
})

const tagInput = ref('')
const techPointInput = ref('')
const refLinkInput = ref('')

// 预定义标签选项
const predefinedTags = [
  { label: '功能', value: '功能', color: 'primary' },
  { label: 'UI', value: 'UI', color: 'success' },
  { label: '优化', value: '优化', color: 'warning' },
  { label: 'Bug', value: 'Bug', color: 'danger' },
  { label: '文档', value: '文档', color: 'info' },
  { label: '测试', value: '测试', color: '' },
  { label: '重构', value: '重构', color: '' },
]

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
        technicalPoints: props.task.technicalPoints ? [...props.task.technicalPoints] : [],
        referenceLinks: props.task.referenceLinks ? [...props.task.referenceLinks] : [],
        progress: props.task.progress || 0,
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
    technicalPoints: [],
    referenceLinks: [],
    progress: 0,
  }
  tagInput.value = ''
  techPointInput.value = ''
  refLinkInput.value = ''
  formRef.value?.clearValidate()
}

// 快速添加预定义标签
function addPredefinedTag(tag: string) {
  if (!formData.value.tags.includes(tag)) {
    formData.value.tags.push(tag)
  }
}

// 添加自定义标签
function addTag() {
  if (tagInput.value.trim() && !formData.value.tags.includes(tagInput.value.trim())) {
    formData.value.tags.push(tagInput.value.trim())
    tagInput.value = ''
  }
}

function removeTag(index: number) {
  formData.value.tags.splice(index, 1)
}

// 判断标签是否已选中
function isTagSelected(tag: string) {
  return formData.value.tags.includes(tag)
}

// 获取标签颜色类型
function getTagType(tag: string) {
  const predefined = predefinedTags.find(t => t.value === tag)
  return predefined?.color || ''
}

// 创建变更日志条目
function createChangeLogEntry(field: string, oldValue: any, newValue: any, action: string): ChangeLogEntry {
  return {
    timestamp: Date.now(),
    field,
    oldValue: String(oldValue),
    newValue: String(newValue),
    action,
  }
}

// 检测并记录字段变更
function detectChanges(oldTask: Task): ChangeLogEntry[] {
  const changes: ChangeLogEntry[] = []

  if (oldTask.title !== formData.value.title) {
    changes.push(createChangeLogEntry('标题', oldTask.title, formData.value.title, '修改了标题'))
  }

  if (oldTask.description !== formData.value.description) {
    changes.push(createChangeLogEntry('描述', oldTask.description, formData.value.description, '修改了描述'))
  }

  if (oldTask.status !== formData.value.status) {
    const statusMap: Record<string, string> = {
      'todo': '待办',
      'in_progress': '进行中',
      'completed': '已完成',
      'sent_to_ai': '已发送AI',
      'needs_optimization': '需优化',
    }
    changes.push(createChangeLogEntry('状态', statusMap[oldTask.status], statusMap[formData.value.status], '修改了状态'))
  }

  if (oldTask.priority !== formData.value.priority) {
    const priorityMap: Record<string, string> = {
      'low': '低',
      'medium': '中',
      'high': '高',
      'urgent': '紧急',
    }
    changes.push(createChangeLogEntry('优先级', priorityMap[oldTask.priority], priorityMap[formData.value.priority], '修改了优先级'))
  }

  if (oldTask.progress !== formData.value.progress) {
    changes.push(createChangeLogEntry('进度', `${oldTask.progress}%`, `${formData.value.progress}%`, '修改了进度'))
  }

  if (JSON.stringify(oldTask.tags) !== JSON.stringify(formData.value.tags)) {
    changes.push(createChangeLogEntry('标签', oldTask.tags.join(', '), formData.value.tags.join(', '), '修改了标签'))
  }

  return changes
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
      // 检测变更
      const changes = detectChanges(props.task)
      // 处理向后兼容：如果 changelog 不存在，初始化为空数组
      const existingChangelog = props.task.changelog || []

      // 深度克隆 changelog 以避免响应式对象
      const clonedExistingChangelog = existingChangelog.map(entry => ({
        timestamp: entry.timestamp,
        field: entry.field,
        oldValue: entry.oldValue,
        newValue: entry.newValue,
        action: entry.action
      }))

      const updatedChangelog = [...clonedExistingChangelog, ...changes]

      // 更新任务 - 创建新的纯对象，避免克隆响应式对象
      const updatedTask: Task = {
        id: props.task.id,
        projectId: props.task.projectId,
        title: formData.value.title,
        description: formData.value.description,
        status: formData.value.status,
        priority: formData.value.priority,
        tags: [...formData.value.tags], // 创建新数组
        technicalPoints: formData.value.technicalPoints.length > 0 ? [...formData.value.technicalPoints] : undefined,
        referenceLinks: formData.value.referenceLinks.length > 0 ? [...formData.value.referenceLinks] : undefined,
        progress: formData.value.progress,
        changelog: updatedChangelog,
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
        technicalPoints: formData.value.technicalPoints.length > 0 ? [...formData.value.technicalPoints] : undefined,
        referenceLinks: formData.value.referenceLinks.length > 0 ? [...formData.value.referenceLinks] : undefined,
        progress: formData.value.progress,
        changelog: [createChangeLogEntry('任务', '', '创建任务', '创建了任务')],
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
  <el-drawer
    :model-value="visible"
    :title="task ? '编辑任务' : '创建任务'"
    size="700px"
    direction="rtl"
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

      <!-- 任务进度 -->
      <el-form-item label="任务进度">
        <div class="w-full">
          <div class="flex items-center gap-4">
            <el-slider
              v-model="formData.progress"
              :min="0"
              :max="100"
              :step="5"
              :show-tooltip="true"
              class="flex-1"
            />
            <span class="text-lg font-semibold min-w-[60px] text-right">{{ formData.progress }}%</span>
          </div>
        </div>
      </el-form-item>

      <el-form-item label="标签">
        <div class="w-full">
          <!-- 快速选择预定义标签 -->
          <div class="mb-3">
            <div class="text-sm text-gray-600 mb-2">快速选择：</div>
            <div class="flex flex-wrap gap-2">
              <el-tag
                v-for="tag in predefinedTags"
                :key="tag.value"
                :type="isTagSelected(tag.value) ? tag.color : 'info'"
                :effect="isTagSelected(tag.value) ? 'dark' : 'plain'"
                class="cursor-pointer"
                @click="addPredefinedTag(tag.value)"
              >
                {{ tag.label }}
                <span v-if="isTagSelected(tag.value)">✓</span>
              </el-tag>
            </div>
          </div>

          <!-- 自定义标签输入 -->
          <div class="mb-2">
            <div class="text-sm text-gray-600 mb-2">自定义标签：</div>
            <div class="flex gap-2">
              <el-input
                v-model="tagInput"
                placeholder="输入自定义标签并回车添加"
                size="small"
                @keyup.enter="addTag"
              />
              <el-button size="small" @click="addTag">添加</el-button>
            </div>
          </div>

          <!-- 已选择的标签 -->
          <div>
            <div class="text-sm text-gray-600 mb-2">已选择：</div>
            <div class="flex flex-wrap gap-2">
              <el-tag
                v-for="(tag, index) in formData.tags"
                :key="tag"
                :type="getTagType(tag)"
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

      <!-- 变更日志 -->
      <el-form-item v-if="task && task.changelog && task.changelog.length > 0" label="变更日志">
        <div class="w-full">
          <el-collapse>
            <el-collapse-item title="查看变更历史" name="changelog">
              <div class="changelog-list">
                <div
                  v-for="(entry, index) in task.changelog"
                  :key="index"
                  class="changelog-entry"
                >
                  <div class="flex items-start gap-3">
                    <div class="changelog-icon">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </div>
                    <div class="flex-1">
                      <div class="changelog-action">{{ entry.action }}</div>
                      <div class="changelog-details" v-if="entry.oldValue || entry.newValue">
                        <span v-if="entry.oldValue" class="old-value">{{ entry.oldValue }}</span>
                        <span v-if="entry.oldValue && entry.newValue" class="arrow">→</span>
                        <span v-if="entry.newValue" class="new-value">{{ entry.newValue }}</span>
                      </div>
                      <div class="changelog-time">{{ new Date(entry.timestamp).toLocaleString('zh-CN') }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </el-collapse-item>
          </el-collapse>
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="drawer-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSubmit">
          {{ task ? '保存' : '创建' }}
        </el-button>
      </div>
    </template>
  </el-drawer>
</template>

<style scoped>
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cursor-pointer {
  cursor: pointer;
  transition: transform 0.2s ease;
}

.cursor-pointer:hover {
  transform: translateY(-2px);
}

.cursor-pointer:active {
  transform: translateY(0);
}

.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 0;
}

/* 变更日志样式 */
.changelog-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.changelog-entry {
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  border-left: 3px solid #3b82f6;
}

.changelog-icon {
  color: #3b82f6;
  margin-top: 2px;
}

.changelog-action {
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
}

.changelog-details {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.old-value {
  text-decoration: line-through;
  color: #ef4444;
}

.arrow {
  color: #9ca3af;
  font-weight: bold;
}

.new-value {
  color: #10b981;
  font-weight: 500;
}

.changelog-time {
  font-size: 12px;
  color: #9ca3af;
}
</style>
