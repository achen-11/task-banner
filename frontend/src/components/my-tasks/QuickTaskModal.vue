<template>
  <el-dialog
    v-model="visible"
    title="快速创建任务"
    width="500px"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="80px"
      @submit.prevent="handleSubmit"
    >
      <el-form-item label="任务标题" prop="title">
        <el-input
          v-model="formData.title"
          placeholder="请输入任务标题"
          :maxlength="100"
          show-word-limit
          @keydown.enter="handleSubmit"
        />
      </el-form-item>

      <el-form-item label="项目" prop="projectId">
        <el-select
          v-model="formData.projectId"
          placeholder="选择项目"
          class="w-full"
          filterable
        >
          <el-option
            v-for="project in projects"
            :key="project._id"
            :label="project.name"
            :value="project._id"
          >
            <div class="flex items-center gap-2">
              <div
                class="w-3 h-3 rounded-full"
                :style="{ backgroundColor: project.color }"
              ></div>
              {{ project.name }}
            </div>
          </el-option>
        </el-select>
      </el-form-item>

      <el-form-item label="优先级" prop="priority">
        <el-select v-model="formData.priority" placeholder="选择优先级" class="w-full">
          <el-option label="紧急" value="urgent" />
          <el-option label="高" value="high" />
          <el-option label="中" value="medium" />
          <el-option label="低" value="low" />
        </el-select>
      </el-form-item>

      <el-form-item label="截止日期" prop="dueDate">
        <el-date-picker
          v-model="dueDateValue"
          type="date"
          placeholder="选择截止日期"
          class="w-full"
          :disabled-date="disabledDate"
          @change="handleDueDateChange"
        />
      </el-form-item>

      <el-form-item label="描述" prop="summary">
        <el-input
          v-model="formData.summary"
          type="textarea"
          :rows="3"
          placeholder="请输入任务描述（可选）"
          :maxlength="500"
          show-word-limit
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="flex justify-end gap-2">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="loading">
          创建任务
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useProjectStore } from '@/stores/project'
import { createQuickTask } from '@/api/user'
import { ElMessage, type FormInstance } from 'element-plus'
import type { Project } from '@/types/project'

interface Props {
  visible: boolean
}

interface Emits {
  (e: 'update:visible', visible: boolean): void
  (e: 'created', task: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const projectStore = useProjectStore()
const formRef = ref<FormInstance>()

// 表单数据
const formData = ref({
  title: '',
  projectId: '',
  priority: 'medium',
  dueDate: undefined as number | undefined,
  summary: ''
})

// 日期选择器的绑定值
const dueDateValue = ref<Date | null>(null)

// 加载状态
const loading = ref(false)

// 项目列表
const projects = computed(() => projectStore.projects || [])

// 表单验证规则
const rules = {
  title: [
    { required: true, message: '请输入任务标题', trigger: 'blur' },
    { min: 1, max: 100, message: '标题长度为 1-100 个字符', trigger: 'blur' }
  ],
  projectId: [
    { required: true, message: '请选择项目', trigger: 'change' }
  ]
}

// 计算visible的双向绑定
const visible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

// 禁用过去的日期
const disabledDate = (time: Date) => {
  return time.getTime() < Date.now() - 8.64e7 // 禁用昨天之前的日期
}

// 处理截止日期变化
const handleDueDateChange = (date: Date | null) => {
  if (date) {
    formData.value.dueDate = Math.floor(date.getTime() / 1000)
  } else {
    formData.value.dueDate = undefined
  }
}

// 重置表单
const resetForm = () => {
  formData.value = {
    title: '',
    projectId: '',
    priority: 'medium',
    dueDate: undefined,
    summary: ''
  }
  dueDateValue.value = null
  if (formRef.value) {
    formRef.value.clearValidate()
  }
}

// 处理关闭
const handleClose = () => {
  visible.value = false
  resetForm()
}

// 处理提交
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    loading.value = true

    const taskData = {
      title: formData.value.title,
      projectId: formData.value.projectId,
      priority: formData.value.priority,
      dueDate: formData.value.dueDate,
      summary: formData.value.summary || undefined
    }

    const task = await createQuickTask(taskData)

    ElMessage.success('任务创建成功')
    emit('created', task)
    handleClose()
  } catch (error: any) {
    console.error('Failed to create task:', error)
    ElMessage.error(error?.message || '创建任务失败')
  } finally {
    loading.value = false
  }
}

// 监听弹窗显示状态，重置表单
watch(() => props.visible, (newValue) => {
  if (newValue) {
    resetForm()
    // 如果只有一个项目，自动选中
    if (projects.value.length === 1) {
      formData.value.projectId = projects.value[0]._id
    }
  }
})
</script>