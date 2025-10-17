<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Download, Upload, Delete, Warning } from '@element-plus/icons-vue'
import { db, exportAllData, importAllData } from '@/db'
import { useProjectStore } from '@/stores/project'
import { useTaskStore } from '@/stores/task'
import { useDBStore } from '@/stores/db'

const projectStore = useProjectStore()
const taskStore = useTaskStore()
const dbStore = useDBStore()

const stats = ref({
  projects: 0,
  tasks: 0,
  templates: 0,
  history: 0
})

const loading = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

// 加载统计信息
async function loadStats() {
  try {
    stats.value.projects = await db.projects.count()
    stats.value.tasks = await db.tasks.count()
    stats.value.templates = await db.exportTemplates.count()
    stats.value.history = await db.exportHistory.count()
  } catch (error) {
    console.error('Failed to load stats:', error)
  }
}

// 导出数据
async function handleExport() {
  try {
    loading.value = true
    const data = await exportAllData()

    // 创建 JSON 文件并下载
    const jsonStr = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
    link.href = url
    link.download = `task-banner-backup-${timestamp}.json`

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    ElMessage.success('数据导出成功！')
  } catch (error) {
    console.error('Export failed:', error)
    ElMessage.error('导出失败，请重试')
  } finally {
    loading.value = false
  }
}

// 触发文件选择
function triggerFileInput() {
  fileInput.value?.click()
}

// 处理文件选择
async function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  // 检查文件类型
  if (!file.name.endsWith('.json')) {
    ElMessage.error('请选择 JSON 格式的备份文件')
    return
  }

  try {
    loading.value = true

    // 读取文件内容
    const text = await file.text()
    const data = JSON.parse(text)

    // 验证数据格式
    if (!data.version || !data.data) {
      ElMessage.error('无效的备份文件格式')
      return
    }

    // 确认导入
    await ElMessageBox.confirm(
      '导入数据将覆盖当前所有数据，此操作不可恢复。是否继续？',
      '确认导入',
      {
        confirmButtonText: '确认导入',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    // 执行导入
    await importAllData(data)

    // 清空当前 store 数据
    projectStore.projects = []
    taskStore.tasks = []

    // 重新加载 store 数据
    await dbStore.loadAllData()

    // 重新加载统计信息
    await loadStats()

    ElMessage.success('数据导入成功！')
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('Import failed:', error)
      ElMessage.error(error.message || '导入失败，请检查文件格式')
    }
  } finally {
    loading.value = false
    // 清空文件选择
    if (target) target.value = ''
  }
}

// 清空数据库
async function handleClearAll() {
  try {
    await ElMessageBox.confirm(
      '此操作将清空所有数据（项目、任务、模板、历史记录），且不可恢复。建议先导出备份。是否继续？',
      '危险操作',
      {
        confirmButtonText: '确认清空',
        cancelButtonText: '取消',
        type: 'error',
        confirmButtonClass: 'el-button--danger',
      }
    )

    loading.value = true

    // 清空所有表
    await db.transaction('rw', db.projects, db.tasks, db.exportTemplates, db.exportHistory, async () => {
      await db.projects.clear()
      await db.tasks.clear()
      await db.exportTemplates.clear()
      await db.exportHistory.clear()
    })

    // 清空 store 数据
    projectStore.projects = []
    taskStore.tasks = []

    // 重新加载统计信息
    await loadStats()

    ElMessage.success('数据已清空')
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('Clear failed:', error)
      ElMessage.error('清空失败')
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadStats()
})
</script>

<template>
  <div class="data-management">
    <div class="page-header">
      <h1 class="page-title">数据管理</h1>
      <p class="page-description">导出、导入和管理你的任务数据</p>
    </div>

    <div class="content-container">
      <!-- 数据统计 -->
      <div class="stats-section">
        <h2 class="section-title">数据统计</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon projects">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
              </svg>
            </div>
            <div class="stat-content">
              <div class="stat-label">项目数</div>
              <div class="stat-value">{{ stats.projects }}</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon tasks">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
              </svg>
            </div>
            <div class="stat-content">
              <div class="stat-label">任务数</div>
              <div class="stat-value">{{ stats.tasks }}</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon templates">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
              </svg>
            </div>
            <div class="stat-content">
              <div class="stat-label">导出模板</div>
              <div class="stat-value">{{ stats.templates }}</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon history">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div class="stat-content">
              <div class="stat-label">导出历史</div>
              <div class="stat-value">{{ stats.history }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 数据操作 -->
      <div class="actions-section">
        <h2 class="section-title">数据操作</h2>

        <div class="action-cards">
          <!-- 导出数据 -->
          <div class="action-card">
            <div class="action-header">
              <el-icon class="action-icon export"><Download /></el-icon>
              <div>
                <h3 class="action-title">导出数据</h3>
                <p class="action-desc">将所有数据导出为 JSON 文件备份</p>
              </div>
            </div>
            <el-button
              type="primary"
              :loading="loading"
              @click="handleExport"
            >
              导出备份文件
            </el-button>
          </div>

          <!-- 导入数据 -->
          <div class="action-card">
            <div class="action-header">
              <el-icon class="action-icon import"><Upload /></el-icon>
              <div>
                <h3 class="action-title">导入数据</h3>
                <p class="action-desc">从备份文件恢复数据（将覆盖现有数据）</p>
              </div>
            </div>
            <input
              ref="fileInput"
              type="file"
              accept=".json"
              style="display: none"
              @change="handleFileSelect"
            />
            <el-button
              :loading="loading"
              @click="triggerFileInput"
            >
              选择备份文件
            </el-button>
          </div>

          <!-- 清空数据 -->
          <div class="action-card danger">
            <div class="action-header">
              <el-icon class="action-icon danger"><Delete /></el-icon>
              <div>
                <h3 class="action-title">清空数据</h3>
                <p class="action-desc">删除所有数据（不可恢复，请谨慎操作）</p>
              </div>
            </div>
            <el-button
              type="danger"
              :loading="loading"
              @click="handleClearAll"
            >
              清空所有数据
            </el-button>
          </div>
        </div>

        <!-- 使用说明 -->
        <el-alert
          class="mt-6"
          type="info"
          :closable="false"
          show-icon
        >
          <template #title>
            <div class="text-sm">
              <p class="font-semibold mb-2">使用说明：</p>
              <ul class="list-disc list-inside space-y-1 text-gray-700">
                <li>导出的备份文件包含所有项目、任务、模板和历史记录</li>
                <li>导入数据会完全覆盖当前数据库中的所有内容</li>
                <li>建议定期导出数据进行备份</li>
                <li>更换端口或浏览器前，请先导出数据</li>
              </ul>
            </div>
          </template>
        </el-alert>
      </div>
    </div>
  </div>
</template>

<style scoped>
.data-management {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.page-header {
  margin-bottom: 2rem;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 0.5rem 0;
}

.page-description {
  font-size: 1rem;
  color: #6b6b6b;
  margin: 0;
}

.content-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 1rem 0;
}

/* 统计卡片 */
.stats-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon.projects {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.stat-icon.tasks {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.stat-icon.templates {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
}

.stat-icon.history {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  color: white;
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.stat-value {
  font-size: 1.875rem;
  font-weight: 700;
  color: #1a1a1a;
}

/* 操作区域 */
.actions-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.action-cards {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.action-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  transition: all 0.2s;
}

.action-card:hover {
  border-color: #d1d5db;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.action-card.danger {
  border-color: #fee2e2;
  background: #fef2f2;
}

.action-card.danger:hover {
  border-color: #fecaca;
}

.action-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.action-icon {
  font-size: 1.75rem;
}

.action-icon.export {
  color: #3b82f6;
}

.action-icon.import {
  color: #10b981;
}

.action-icon.danger {
  color: #ef4444;
}

.action-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 0.25rem 0;
}

.action-desc {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

.mt-6 {
  margin-top: 1.5rem;
}
</style>
