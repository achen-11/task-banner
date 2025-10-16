<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { Project, ProjectStatus } from '@/types'
import { generateId } from '@/utils'
import { useProjectStore } from '@/stores/project'
import { useDBStore } from '@/stores/db'

interface Props {
  visible: boolean
  project?: Project | null
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const projectStore = useProjectStore()
const dbStore = useDBStore()

const formRef = ref()
const formData = ref({
  name: '',
  description: '',
  status: 'active' as ProjectStatus,
  techStack: [] as string[],
})

const techInput = ref('')

const statusOptions = [
  { label: '进行中', value: 'active' },
  { label: '已完成', value: 'completed' },
  { label: '已暂停', value: 'paused' },
]

const rules = {
  name: [
    { required: true, message: '请输入项目名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
}

// 监听 visible 变化
watch(() => props.visible, (newVal) => {
  if (newVal) {
    if (props.project) {
      // 编辑模式
      formData.value = {
        name: props.project.name,
        description: props.project.description || '',
        status: props.project.status,
        techStack: [...props.project.techStack],
      }
    } else {
      // 创建模式
      resetForm()
    }
  }
})

function resetForm() {
  formData.value = {
    name: '',
    description: '',
    status: 'active',
    techStack: [],
  }
  techInput.value = ''
  formRef.value?.clearValidate()
}

function addTech() {
  if (techInput.value.trim() && !formData.value.techStack.includes(techInput.value.trim())) {
    formData.value.techStack.push(techInput.value.trim())
    techInput.value = ''
  }
}

function removeTech(index: number) {
  formData.value.techStack.splice(index, 1)
}

async function handleSubmit() {
  try {
    await formRef.value?.validate()

    if (props.project) {
      // 更新项目 - 创建新的纯对象，避免克隆响应式对象
      const updatedProject: Project = {
        id: props.project.id,
        name: formData.value.name,
        description: formData.value.description,
        status: formData.value.status,
        techStack: [...formData.value.techStack], // 创建新数组
        createdAt: props.project.createdAt,
        updatedAt: Date.now(),
      }
      projectStore.updateProject(props.project.id, updatedProject)
      await dbStore.saveProject(updatedProject)
      ElMessage.success('项目更新成功')
    } else {
      // 创建新项目
      const newProject: Project = {
        id: generateId(),
        name: formData.value.name,
        description: formData.value.description,
        status: formData.value.status,
        techStack: [...formData.value.techStack], // 创建新数组
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      projectStore.addProject(newProject)
      await dbStore.saveProject(newProject)
      ElMessage.success('项目创建成功')
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
    :title="project ? '编辑项目' : '创建项目'"
    width="600px"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="100px"
    >
      <el-form-item label="项目名称" prop="name">
        <el-input
          v-model="formData.name"
          placeholder="请输入项目名称"
          maxlength="50"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="项目描述">
        <el-input
          v-model="formData.description"
          type="textarea"
          placeholder="请输入项目描述（可选）"
          :rows="3"
          maxlength="200"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="项目状态" prop="status">
        <el-select v-model="formData.status" placeholder="请选择状态">
          <el-option
            v-for="item in statusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="技术栈">
        <div class="w-full">
          <div class="flex gap-2 mb-2">
            <el-input
              v-model="techInput"
              placeholder="输入技术栈并回车添加"
              @keyup.enter="addTech"
            />
            <el-button @click="addTech">添加</el-button>
          </div>
          <div class="flex flex-wrap gap-2">
            <el-tag
              v-for="(tech, index) in formData.techStack"
              :key="tech"
              closable
              @close="removeTech(index)"
            >
              {{ tech }}
            </el-tag>
            <span v-if="formData.techStack.length === 0" class="text-gray-400 text-sm">
              暂无技术栈标签
            </span>
          </div>
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleSubmit">
        {{ project ? '保存' : '创建' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
</style>
