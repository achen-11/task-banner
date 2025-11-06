<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    title="新建文档"
    width="800px"
    :before-close="handleClose"
    destroy-on-close
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="80px"
      class="px-4"
    >
      <el-form-item label="文档标题" prop="title">
        <el-input
          v-model="form.title"
          placeholder="请输入文档标题"
          maxlength="100"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="文档类型" prop="type">
        <el-select v-model="form.type" placeholder="选择文档类型" style="width: 200px">
          <el-option label="Markdown" value="markdown" />
          <el-option label="文本" value="text" />
          <el-option label="富文本" value="richtext" />
        </el-select>
      </el-form-item>

      <el-form-item label="状态" prop="status">
        <el-select v-model="form.status" placeholder="选择文档状态" style="width: 200px">
          <el-option label="草稿" value="draft" />
          <el-option label="已发布" value="published" />
          <el-option label="已归档" value="archived" />
        </el-select>
      </el-form-item>

      <el-form-item label="标签" prop="tags">
        <el-tag
          v-for="tag in form.tags"
          :key="tag"
          closable
          @close="removeTag(tag)"
          class="mr-2 mb-2"
        >
          {{ tag }}
        </el-tag>
        <el-input
          v-if="tagInputVisible"
          ref="tagInputRef"
          v-model="tagInputValue"
          class="w-32"
          size="small"
          @keyup.enter="addTag"
          @blur="addTag"
        />
        <el-button
          v-else
          size="small"
          @click="showTagInput"
        >
          + 新标签
        </el-button>
      </el-form-item>

      <el-form-item label="文档内容" prop="content">
        <div class="w-full">
          <el-tabs v-model="editMode" type="border-card">
            <el-tab-pane label="编辑" name="edit">
              <el-input
                v-model="form.content"
                type="textarea"
                :rows="12"
                placeholder="请输入文档内容..."
                class="w-full"
              />
            </el-tab-pane>
            <el-tab-pane label="预览" name="preview" :disabled="form.type !== 'markdown'">
              <div
                v-if="form.type === 'markdown'"
                class="prose prose-sm max-w-none h-96 overflow-y-auto p-4 border border-gray-200 rounded"
                v-html="markdownPreview"
              />
              <div
                v-else
                class="h-96 overflow-y-auto p-4 border border-gray-200 rounded bg-gray-50"
              >
                <pre class="whitespace-pre-wrap text-sm text-gray-700">{{ form.content || '暂无内容' }}</pre>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="flex justify-end space-x-3">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="loading">
          创建文档
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { ElMessage, ElForm } from 'element-plus'
import { marked } from 'marked'

interface Props {
  visible: boolean
  projectId: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  created: []
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

// 编辑模式
const editMode = ref('edit')

// 表单验证规则
const rules = {
  title: [
    { required: true, message: '请输入文档标题', trigger: 'blur' },
    { min: 1, max: 100, message: '标题长度应在 1-100 个字符之间', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择文档类型', trigger: 'change' }
  ],
  status: [
    { required: true, message: '请选择文档状态', trigger: 'change' }
  ]
}

// 表单引用
const formRef = ref<InstanceType<typeof ElForm>>()
const loading = ref(false)

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

// 重置表单
const resetForm = () => {
  form.value = {
    title: '',
    content: '',
    type: 'markdown',
    status: 'draft',
    tags: []
  }
  editMode.value = 'edit'
  tagInputVisible.value = false
  tagInputValue.value = ''
  formRef.value?.clearValidate()
}

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

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    loading.value = true

    const response = await fetch('/api/document/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...form.value,
        projectId: props.projectId
      })
    })

    const result = await response.json()

    if (result.code === 200) {
      ElMessage.success('文档创建成功')
      emit('created')
      handleClose()
    } else {
      ElMessage.error(result.message || '创建文档失败')
    }
  } catch (error) {
    console.error('创建文档失败:', error)
    ElMessage.error('创建文档失败')
  } finally {
    loading.value = false
  }
}

// 关闭对话框
const handleClose = () => {
  emit('update:visible', false)
}
</script>