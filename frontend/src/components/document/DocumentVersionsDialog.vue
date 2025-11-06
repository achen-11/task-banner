<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    title="版本历史"
    width="800px"
    :before-close="handleClose"
    destroy-on-close
  >
    <div v-if="loading" class="flex items-center justify-center py-8">
      <el-icon class="animate-spin text-2xl text-blue-500">
        <Loading />
      </el-icon>
      <span class="ml-2 text-gray-600">加载版本历史...</span>
    </div>

    <div v-else-if="versions.length === 0" class="text-center py-8">
      <el-icon class="text-4xl text-gray-400 mb-2">
        <Clock />
      </el-icon>
      <p class="text-gray-500">暂无版本历史</p>
    </div>

    <div v-else class="space-y-3 max-h-96 overflow-y-auto">
      <div
        v-for="version in versions"
        :key="`${version.documentId}-${version.version}`"
        class="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
        :class="{ 'border-blue-500 bg-blue-50': version.version === currentVersion }"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center space-x-2 mb-2">
              <span class="text-sm font-medium text-gray-900">
                版本 {{ version.version }}
              </span>
              <el-tag v-if="version.version === currentVersion" size="small" type="success">
                当前版本
              </el-tag>
              <span class="text-xs text-gray-500">
                {{ formatDate(version.createdAt) }}
              </span>
            </div>

            <div class="text-sm text-gray-600 mb-2">
              <span class="font-medium">创建者:</span> {{ version.createdBy }}
            </div>

            <div v-if="version.changeLog" class="text-sm text-gray-500 mb-3">
              <span class="font-medium">变更说明:</span> {{ version.changeLog }}
            </div>

            <div class="flex items-center space-x-2">
              <el-button
                size="small"
                @click="viewVersion(version)"
              >
                <el-icon><View /></el-icon>
                查看
              </el-button>
              <el-button
                v-if="version.version !== currentVersion"
                size="small"
                type="primary"
                @click="restoreVersion(version)"
              >
                <el-icon><RefreshLeft /></el-icon>
                恢复
              </el-button>
              <el-button
                size="small"
                @click="compareVersion(version)"
              >
                <el-icon><ScaleToOriginal /></el-icon>
                对比
              </el-button>
            </div>
          </div>

          <div class="text-xs text-gray-400 text-right">
            <div>内容长度</div>
            <div class="font-mono">{{ version.content?.length || 0 }} 字符</div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end space-x-2">
        <el-button @click="handleClose">关闭</el-button>
      </div>
    </template>

    <!-- 版本对比对话框 -->
    <el-dialog
      :model-value="showCompareDialog"
      @update:model-value="showCompareDialog = $event"
      title="版本对比"
      width="1000px"
      append-to-body
    >
      <div v-if="compareData" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div class="border rounded-lg p-4">
            <h3 class="font-medium text-gray-900 mb-2">
              版本 {{ compareData.current.version }} (当前)
            </h3>
            <p class="text-xs text-gray-500 mb-3">
              {{ formatDate(compareData.current.createdAt) }}
            </p>
            <div class="prose prose-sm max-w-none bg-gray-50 p-3 rounded">
              <div v-html="compareData.currentHtml" />
            </div>
          </div>

          <div class="border rounded-lg p-4">
            <h3 class="font-medium text-gray-900 mb-2">
              版本 {{ compareData.history.version }}
            </h3>
            <p class="text-xs text-gray-500 mb-3">
              {{ formatDate(compareData.history.createdAt) }}
            </p>
            <div class="prose prose-sm max-w-none bg-gray-50 p-3 rounded">
              <div v-html="compareData.historyHtml" />
            </div>
          </div>
        </div>

        <div class="border-t pt-4">
          <h4 class="font-medium text-gray-900 mb-2">差异对比</h4>
          <div class="bg-gray-50 p-3 rounded text-sm font-mono whitespace-pre-wrap">
            {{ compareData.diff }}
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end space-x-2">
          <el-button @click="showCompareDialog = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 版本查看对话框 -->
    <el-dialog
      :model-value="showViewDialog"
      @update:model-value="showViewDialog = $event"
      :title="`版本 ${viewData?.version} - ${viewData?.title}`"
      width="800px"
      append-to-body
    >
      <div v-if="viewData" class="space-y-4">
        <div class="bg-gray-50 p-3 rounded">
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="font-medium">创建者:</span> {{ viewData.createdBy }}
            </div>
            <div>
              <span class="font-medium">创建时间:</span> {{ formatDate(viewData.createdAt) }}
            </div>
            <div v-if="viewData.changeLog" class="col-span-2">
              <span class="font-medium">变更说明:</span> {{ viewData.changeLog }}
            </div>
          </div>
        </div>

        <div class="border rounded-lg p-4">
          <h3 class="font-medium text-gray-900 mb-3">文档内容</h3>
          <div
            v-if="viewData.content.startsWith('#') || viewData.content.includes('**')"
            class="prose prose-sm max-w-none"
            v-html="markdownContent"
          />
          <pre v-else class="whitespace-pre-wrap text-sm text-gray-700">{{ viewData.content }}</pre>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end space-x-2">
          <el-button @click="showViewDialog = false">关闭</el-button>
          <el-button
            v-if="viewData && viewData.version !== currentVersion"
            type="primary"
            @click="restoreVersion(viewData)"
          >
            恢复到此版本
          </el-button>
        </div>
      </template>
    </el-dialog>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Loading, Clock, View, RefreshLeft, ScaleToOriginal
} from '@element-plus/icons-vue'
import { marked } from 'marked'

interface DocumentVersion {
  documentId: string
  version: number
  title: string
  content: string
  createdBy: string
  changeLog?: string
  createdAt: number
}

interface Props {
  visible: boolean
  documentId?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  restore: [version: DocumentVersion]
}>()

// 响应式数据
const loading = ref(false)
const versions = ref<DocumentVersion[]>([])
const currentVersion = ref(1)
const showCompareDialog = ref(false)
const showViewDialog = ref(false)
const compareData = ref<any>(null)
const viewData = ref<DocumentVersion | null>(null)

// Markdown 渲染
const markdownContent = computed(() => {
  if (!viewData.value?.content) return ''
  try {
    return marked(viewData.value.content)
  } catch (error) {
    console.error('Markdown 解析错误:', error)
    return '<p class="text-red-500">Markdown 解析错误</p>'
  }
})

// 监听可见性和文档ID变化
watch([() => props.visible, () => props.documentId], ([visible, documentId]) => {
  if (visible && documentId) {
    fetchVersions()
  }
}, { immediate: true })

// 获取版本历史
const fetchVersions = async () => {
  if (!props.documentId) return

  loading.value = true
  try {
    const response = await fetch(`/api/document/versions?documentId=${props.documentId}`)
    const result = await response.json()

    if (result.code === 200) {
      versions.value = result.data
      // 获取当前版本号
      if (versions.value.length > 0) {
        currentVersion.value = Math.max(...versions.value.map(v => v.version))
      }
    } else {
      ElMessage.error(result.message || '获取版本历史失败')
    }
  } catch (error) {
    console.error('获取版本历史失败:', error)
    ElMessage.error('获取版本历史失败')
  } finally {
    loading.value = false
  }
}

// 查看版本
const viewVersion = async (version: DocumentVersion) => {
  try {
    const response = await fetch(`/api/document/version?documentId=${version.documentId}&version=${version.version}`)
    const result = await response.json()

    if (result.code === 200) {
      viewData.value = result.data
      showViewDialog.value = true
    } else {
      ElMessage.error(result.message || '获取版本详情失败')
    }
  } catch (error) {
    console.error('获取版本详情失败:', error)
    ElMessage.error('获取版本详情失败')
  }
}

// 恢复版本
const restoreVersion = async (version: DocumentVersion) => {
  try {
    await ElMessageBox.confirm(
      `确定要恢复到版本 ${version.version} 吗？此操作将创建一个新版本。`,
      '恢复版本确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const response = await fetch('/api/document/update', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: version.documentId,
        title: version.title,
        content: version.content,
        changeLog: `从版本 ${version.version} 恢复`
      })
    })

    const result = await response.json()

    if (result.code === 200) {
      ElMessage.success('版本恢复成功')
      emit('restore', version)
      handleClose()
    } else {
      ElMessage.error(result.message || '版本恢复失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('版本恢复失败:', error)
      ElMessage.error('版本恢复失败')
    }
  }
}

// 对比版本
const compareVersion = async (version: DocumentVersion) => {
  try {
    // 获取历史版本内容
    const historyResponse = await fetch(`/api/document/version?documentId=${version.documentId}&version=${version.version}`)
    const historyResult = await historyResponse.json()

    if (historyResult.code !== 200) {
      ElMessage.error('获取历史版本失败')
      return
    }

    // 获取当前版本内容（假设当前版本是最新的）
    const currentVersionData = versions.value.find(v => v.version === currentVersion.value)
    if (!currentVersionData) {
      ElMessage.error('获取当前版本失败')
      return
    }

    const currentResponse = await fetch(`/api/document/version?documentId=${version.documentId}&version=${currentVersion.value}`)
    const currentResult = await currentResponse.json()

    if (currentResult.code !== 200) {
      ElMessage.error('获取当前版本失败')
      return
    }

    // 计算差异
    const diff = calculateDiff(
      currentResult.data.content,
      historyResult.data.content
    )

    compareData.value = {
      current: {
        version: currentVersion.value,
        createdAt: currentResult.data.createdAt
      },
      history: {
        version: version.version,
        createdAt: version.createdAt
      },
      currentHtml: marked(currentResult.data.content),
      historyHtml: marked(historyResult.data.content),
      diff
    }

    showCompareDialog.value = true
  } catch (error) {
    console.error('版本对比失败:', error)
    ElMessage.error('版本对比失败')
  }
}

// 计算文本差异（简单实现）
const calculateDiff = (current: string, history: string): string => {
  const currentLines = current.split('\n')
  const historyLines = history.split('\n')
  const maxLines = Math.max(currentLines.length, historyLines.length)
  let diff = ''

  for (let i = 0; i < maxLines; i++) {
    const currentLine = currentLines[i] || ''
    const historyLine = historyLines[i] || ''

    if (currentLine === historyLine) {
      diff += `  ${currentLine}\n`
    } else {
      if (historyLine) {
        diff += `- ${historyLine}\n`
      }
      if (currentLine) {
        diff += `+ ${currentLine}\n`
      }
    }
  }

  return diff
}

// 格式化日期
const formatDate = (timestamp: number) => {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN')
}

// 关闭对话框
const handleClose = () => {
  emit('update:visible', false)
  versions.value = []
  compareData.value = null
  viewData.value = null
  showCompareDialog.value = false
  showViewDialog.value = false
}
</script>