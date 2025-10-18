<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import type { Task, TaskStatus, Priority, ChangeLogEntry } from '@/types'
import { generateId } from '@/utils'
import { useTaskStore } from '@/stores/task'
import { useDBStore } from '@/stores/db'
import { useProjectStore } from '@/stores/project'
import { marked } from 'marked'
import { exportTasksToMarkdown, copyToClipboard } from '@/utils/export'

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
const projectStore = useProjectStore()

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

// 当前任务（用于新建后切换为编辑模式）
const currentTask = ref<Task | null>(null)

// Markdown 预览模式
const isPreviewMode = ref(false)

// 渲染 Markdown
const renderedMarkdown = computed(() => {
  if (!formData.value.description) return ''
  return marked(formData.value.description, { breaks: true })
})

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
      currentTask.value = props.task
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
      currentTask.value = null
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

      // 更新 currentTask，保持最新状态
      currentTask.value = updatedTask

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

      // 创建成功后，更新 currentTask，切换为编辑模式
      currentTask.value = newTask

      ElMessage.success('任务创建成功')
    }

    emit('success')
    // Cmd+S 保存后不关闭抽屉，用户可以继续编辑或使用 Cmd+E 导出
    // handleClose() - 注释掉自动关闭
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

// Cmd+E 导出当前任务
async function handleExportCurrentTask() {
  if (!props.visible) return

  const project = projectStore.getProjectById(props.projectId)
  if (!project) {
    ElMessage.error('未找到项目信息')
    return
  }

  // 使用 currentTask（包含新创建的任务）
  if (currentTask.value) {
    const markdown = exportTasksToMarkdown([currentTask.value], project)
    const success = await copyToClipboard(markdown)

    if (success) {
      ElMessage.success('已复制当前任务到剪贴板')
    } else {
      ElMessage.error('复制失败，请重试')
    }
  } else {
    ElMessage.warning('请先保存任务后再导出')
  }
}

// 快捷键处理
function handleKeyDown(event: KeyboardEvent) {
  // Cmd+S (Mac) 或 Ctrl+S (Windows/Linux) 保存
  if ((event.metaKey || event.ctrlKey) && event.key === 's') {
    event.preventDefault()
    if (props.visible) {
      handleSubmit()
    }
  }
  // Cmd+E (Mac) 或 Ctrl+E (Windows/Linux) 导出当前任务
  else if ((event.metaKey || event.ctrlKey) && event.key === 'e') {
    event.preventDefault()
    if (props.visible) {
      handleExportCurrentTask()
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <el-drawer
    :model-value="visible"
    :title="currentTask ? '编辑任务' : '创建任务'"
    size="1000px"
    direction="rtl"
    @close="handleClose"
  >
    <div class="drawer-content">
      <!-- 左侧：任务信息 -->
      <div class="task-form-section">
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

          <el-form-item label="标签">
            <div class="w-full">
              <div class="flex flex-wrap gap-2">
                <!-- 快速选择预定义标签 -->
                <el-tag
                  v-for="tag in predefinedTags"
                  :key="tag.value"
                  :type="isTagSelected(tag.value) ? tag.color : 'info'"
                  :effect="isTagSelected(tag.value) ? 'dark' : 'plain'"
                  class="cursor-pointer tag-selectable"
                  :closable="isTagSelected(tag.value)"
                  @click="addPredefinedTag(tag.value)"
                  @close="removeTag(formData.tags.indexOf(tag.value))"
                >
                  {{ tag.label }}
                </el-tag>

                <!-- 自定义标签 -->
                <el-tag
                  v-for="(tag, index) in formData.tags.filter(t => !predefinedTags.some(pt => pt.value === t))"
                  :key="tag"
                  closable
                  @close="removeTag(formData.tags.indexOf(tag))"
                >
                  {{ tag }}
                </el-tag>

                <!-- 添加自定义标签按钮 -->
                <el-popover
                  placement="bottom"
                  :width="200"
                  trigger="click"
                >
                  <template #reference>
                    <el-tag class="cursor-pointer add-tag-btn">
                      <span class="add-icon">+</span>
                    </el-tag>
                  </template>
                  <div class="flex gap-2">
                    <el-input
                      v-model="tagInput"
                      placeholder="自定义标签"
                      size="small"
                      @keyup.enter="addTag"
                    />
                    <el-button size="small" type="primary" @click="addTag">添加</el-button>
                  </div>
                </el-popover>
              </div>
            </div>
          </el-form-item>

          <el-form-item label="任务描述" prop="description">
            <div class="description-container">
              <!-- 模式切换按钮 -->
              <div class="description-toolbar">
                <div class="toolbar-tabs">
                  <button
                    :class="['toolbar-tab', { 'active': !isPreviewMode }]"
                    @click.prevent="isPreviewMode = false"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                    编辑
                  </button>
                  <button
                    :class="['toolbar-tab', { 'active': isPreviewMode }]"
                    @click.prevent="isPreviewMode = true"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                    </svg>
                    预览
                  </button>
                </div>
                <div class="toolbar-hint">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  支持 Markdown 格式
                </div>
              </div>

              <!-- 编辑模式 -->
              <el-input
                v-show="!isPreviewMode"
                v-model="formData.description"
                type="textarea"
                placeholder="支持 Markdown 格式，如：**粗体** *斜体* `代码` [链接](url)"
                :rows="15"
                maxlength="2000"
                show-word-limit
                class="description-textarea"
              />

              <!-- 预览模式 -->
              <div
                v-show="isPreviewMode"
                class="markdown-preview"
                v-html="renderedMarkdown"
              />
            </div>
          </el-form-item>
        </el-form>
      </div>

      <!-- 右侧：迭代历史 -->
      <div class="iteration-section">
        <div class="iteration-header">
          <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
          </svg>
          <span class="iteration-title">迭代历史 {{ currentTask && currentTask.changelog ? `(${currentTask.changelog.length}次)` : '' }}</span>
        </div>

        <!-- 有迭代历史 -->
        <div v-if="currentTask && currentTask.changelog && currentTask.changelog.length > 0" class="iteration-list">
          <div
            v-for="(entry, index) in [...currentTask.changelog].reverse()"
            :key="index"
            class="iteration-entry"
          >
            <div class="iteration-number">v{{ currentTask.changelog.length - index }}</div>
            <div class="iteration-content">
              <div class="iteration-action">{{ entry.action }}</div>
              <div class="iteration-details" v-if="entry.oldValue || entry.newValue">
                <span v-if="entry.oldValue" class="old-value">{{ entry.oldValue }}</span>
                <span v-if="entry.oldValue && entry.newValue" class="arrow">→</span>
                <span v-if="entry.newValue" class="new-value">{{ entry.newValue }}</span>
              </div>
              <div class="iteration-time">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                {{ new Date(entry.timestamp).toLocaleString('zh-CN') }}
              </div>
            </div>
          </div>
        </div>

        <!-- 无迭代历史时的占位内容 -->
        <div v-else class="iteration-placeholder">
          <div class="placeholder-icon">
            <svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
          </div>
          <div class="placeholder-text">
            <p class="placeholder-title">暂无迭代历史</p>
            <p class="placeholder-desc">保存任务后，所有修改记录将在此显示</p>
          </div>
          <div class="placeholder-tips">
            <div class="tip-item">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
              <span>自动记录每次修改</span>
            </div>
            <div class="tip-item">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span>追踪完整时间线</span>
            </div>
            <div class="tip-item">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span>版本对比一目了然</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="drawer-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSubmit">
          {{ currentTask ? '保存' : '创建' }}
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

.tag-selectable {
  transition: all 0.2s ease;
}

.tag-selectable:hover {
  transform: scale(1.05);
}

.add-tag-btn {
  border: 2px dashed #d1d5db;
  background: transparent;
  transition: all 0.2s ease;
}

.add-tag-btn:hover {
  border-color: #9ca3af;
  transform: scale(1.05);
}

.add-icon {
  font-size: 16px;
  font-weight: bold;
  color: #6b7280;
}

/* 抽屉内容布局 */
.drawer-content {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 24px;
  height: calc(100vh - 180px); /* 减去头部和底部的高度 */
  overflow: hidden; /* 防止整体滚动 */
}

.task-form-section {
  overflow-y: auto; /* 独立滚动 */
  padding-right: 8px;
}

.iteration-section {
  width: 360px;
  display: flex;
  flex-direction: column;
  border-left: 1px solid #e5e7eb;
  padding-left: 24px;
  overflow: hidden; /* 防止整体滚动 */
}

.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 0;
}

/* 迭代历史样式 */
.iteration-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 10px;
  margin-bottom: 16px;
  box-shadow: 0 4px 6px rgba(102, 126, 234, 0.2);
  flex-shrink: 0;
}

.iteration-title {
  color: white;
  font-weight: 600;
  font-size: 15px;
}

.iteration-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
  padding-left: 32px;
  overflow-y: auto;
  flex: 1;
}

.iteration-list::before {
  content: '';
  position: absolute;
  left: 14px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
}

.iteration-entry {
  display: flex;
  align-items: start;
  gap: 12px;
  position: relative;
}

.iteration-number {
  position: absolute;
  left: -32px;
  width: 28px;
  height: 28px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 11px;
  font-weight: 700;
  box-shadow: 0 2px 4px rgba(102, 126, 234, 0.3);
  z-index: 1;
}

.iteration-content {
  flex: 1;
  padding: 14px 16px;
  background: #f9fafb;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  transition: all 0.2s ease;
}

.iteration-content:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
  transform: translateX(2px);
}

.iteration-action {
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 6px;
  font-size: 14px;
}

.iteration-details {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.old-value {
  text-decoration: line-through;
  color: #ef4444;
  background: #fee2e2;
  padding: 2px 6px;
  border-radius: 4px;
}

.arrow {
  color: #9ca3af;
  font-weight: bold;
}

.new-value {
  color: #10b981;
  font-weight: 500;
  background: #d1fae5;
  padding: 2px 6px;
  border-radius: 4px;
}

.iteration-time {
  font-size: 12px;
  color: #9ca3af;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 占位内容样式 */
.iteration-placeholder {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  overflow-y: auto; /* 独立滚动（虽然占位内容通常不需要滚动） */
}

.placeholder-icon {
  margin-bottom: 20px;
  color: #d1d5db;
}

.placeholder-text {
  margin-bottom: 24px;
}

.placeholder-title {
  font-size: 16px;
  font-weight: 600;
  color: #6b7280;
  margin: 0 0 8px 0;
}

.placeholder-desc {
  font-size: 14px;
  color: #9ca3af;
  margin: 0;
}

.placeholder-tips {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 280px;
}

.tip-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: #f9fafb;
  border-radius: 8px;
  font-size: 13px;
  color: #6b7280;
  border: 1px solid #e5e7eb;
}

.tip-item svg {
  flex-shrink: 0;
  color: #8b5cf6;
}

/* 描述编辑器样式 */
.description-container {
  width: 100%;
}

.description-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-bottom: none;
  border-radius: 6px 6px 0 0;
}

.toolbar-tabs {
  display: flex;
  gap: 4px;
}

.toolbar-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: transparent;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toolbar-tab:hover {
  background: #e5e7eb;
  color: #1f2937;
}

.toolbar-tab.active {
  background: white;
  color: #667eea;
  font-weight: 500;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.toolbar-hint {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #9ca3af;
}

.description-textarea {
  border-radius: 0 0 6px 6px !important;
}

.description-textarea :deep(textarea) {
  border-top-left-radius: 0 !important;
  border-top-right-radius: 0 !important;
}

.markdown-preview {
  min-height: 360px;
  max-height: 360px;
  overflow-y: auto;
  padding: 12px 16px;
  background: white;
  border: 1px solid #e5e7eb;
  border-top: none;
  border-radius: 0 0 6px 6px;
  font-size: 14px;
  line-height: 1.6;
  color: #1f2937;
}

.markdown-preview:empty::before {
  content: '暂无内容';
  color: #9ca3af;
  font-style: italic;
}

/* Markdown 渲染样式 */
.markdown-preview :deep(h1),
.markdown-preview :deep(h2),
.markdown-preview :deep(h3),
.markdown-preview :deep(h4),
.markdown-preview :deep(h5),
.markdown-preview :deep(h6) {
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  font-weight: 600;
  line-height: 1.25;
}

.markdown-preview :deep(h1) {
  font-size: 1.875em;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 0.3em;
}

.markdown-preview :deep(h2) {
  font-size: 1.5em;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 0.3em;
}

.markdown-preview :deep(h3) {
  font-size: 1.25em;
}

.markdown-preview :deep(h4) {
  font-size: 1.125em;
}

.markdown-preview :deep(p) {
  margin-top: 0;
  margin-bottom: 1em;
}

.markdown-preview :deep(ul),
.markdown-preview :deep(ol) {
  margin-top: 0;
  margin-bottom: 1em;
  padding-left: 2em;
}

.markdown-preview :deep(li) {
  margin-top: 0.25em;
}

.markdown-preview :deep(code) {
  padding: 0.2em 0.4em;
  background: #f3f4f6;
  border-radius: 3px;
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 0.875em;
}

.markdown-preview :deep(pre) {
  padding: 1em;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow-x: auto;
  margin-bottom: 1em;
}

.markdown-preview :deep(pre code) {
  padding: 0;
  background: none;
  border-radius: 0;
}

.markdown-preview :deep(blockquote) {
  margin: 0 0 1em 0;
  padding-left: 1em;
  border-left: 4px solid #667eea;
  color: #6b7280;
}

.markdown-preview :deep(a) {
  color: #667eea;
  text-decoration: none;
}

.markdown-preview :deep(a:hover) {
  text-decoration: underline;
}

.markdown-preview :deep(strong) {
  font-weight: 600;
}

.markdown-preview :deep(em) {
  font-style: italic;
}

.markdown-preview :deep(hr) {
  height: 0;
  margin: 1.5em 0;
  border: none;
  border-top: 1px solid #e5e7eb;
}

.markdown-preview :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1em;
}

.markdown-preview :deep(table th),
.markdown-preview :deep(table td) {
  padding: 6px 13px;
  border: 1px solid #e5e7eb;
}

.markdown-preview :deep(table th) {
  background: #f9fafb;
  font-weight: 600;
}

.markdown-preview :deep(table tr:nth-child(even)) {
  background: #f9fafb;
}

.markdown-preview :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 6px;
}
</style>
