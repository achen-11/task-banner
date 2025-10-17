<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { Task, TaskStatus } from '@/types'

interface Props {
  tasks: Task[]
  selectedTasks: Set<string>
}

interface Emits {
  (e: 'toggleSelection', taskId: string): void
  (e: 'toggleAllSelection'): void
  (e: 'edit', task: Task): void
  (e: 'delete', task: Task): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 搜索和筛选
const searchText = ref('')
const statusFilter = ref<TaskStatus | 'all'>('all')
const priorityFilter = ref<'all' | 'low' | 'medium' | 'high' | 'urgent'>('all')

// 排序
const sortField = ref<'title' | 'status' | 'priority' | 'createdAt'>('createdAt')
const sortOrder = ref<'asc' | 'desc'>('desc')

// 分页
const currentPage = ref(1)
const pageSize = ref(10)

// 状态映射
const statusLabelMap: Record<TaskStatus, string> = {
  todo: '待办',
  in_progress: '进行中',
  completed: '已完成',
  sent_to_ai: '已发送AI',
  needs_optimization: '需优化',
}

const statusIconMap: Record<TaskStatus, string> = {
  todo: '○',
  in_progress: '◐',
  completed: '✓',
  sent_to_ai: '◎',
  needs_optimization: '⚠',
}

// 优先级映射
const priorityLabelMap: Record<string, string> = {
  low: '低',
  medium: '中',
  high: '高',
  urgent: '紧急',
}

const priorityIconMap: Record<string, string> = {
  low: '↓',
  medium: '→',
  high: '↑',
  urgent: '⇡',
}

// 标签颜色映射
const tagTypeMap: Record<string, '' | 'success' | 'warning' | 'danger' | 'info'> = {
  'Documentation': 'info',
  'Bug': 'danger',
  'Feature': 'success',
}

// 筛选和排序后的任务
const filteredTasks = computed(() => {
  let result = props.tasks

  // 搜索过滤
  if (searchText.value) {
    const search = searchText.value.toLowerCase()
    result = result.filter(task =>
      task.title.toLowerCase().includes(search) ||
      task.description.toLowerCase().includes(search)
    )
  }

  // 状态过滤
  if (statusFilter.value !== 'all') {
    result = result.filter(task => task.status === statusFilter.value)
  }

  // 优先级过滤
  if (priorityFilter.value !== 'all') {
    result = result.filter(task => task.priority === priorityFilter.value)
  }

  // 排序
  result = [...result].sort((a, b) => {
    let comparison = 0

    if (sortField.value === 'title') {
      comparison = a.title.localeCompare(b.title)
    } else if (sortField.value === 'status') {
      comparison = a.status.localeCompare(b.status)
    } else if (sortField.value === 'priority') {
      const priorityOrder = ['low', 'medium', 'high', 'urgent']
      comparison = priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority)
    } else if (sortField.value === 'createdAt') {
      comparison = a.createdAt - b.createdAt
    }

    return sortOrder.value === 'asc' ? comparison : -comparison
  })

  return result
})

// 分页后的任务
const paginatedTasks = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredTasks.value.slice(start, end)
})

// 总页数
const totalPages = computed(() => {
  return Math.ceil(filteredTasks.value.length / pageSize.value)
})

// 是否全选
const isAllSelected = computed(() => {
  return paginatedTasks.value.length > 0 &&
    paginatedTasks.value.every(task => props.selectedTasks.has(task.id))
})

// 切换排序
const toggleSort = (field: typeof sortField.value) => {
  if (sortField.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortOrder.value = 'asc'
  }
}

// 切换全选
const toggleAllSelection = () => {
  emit('toggleAllSelection')
}

// 获取标签类型
const getTagType = (tag: string) => {
  return tagTypeMap[tag] || ''
}
</script>

<template>
  <div class="list-view">
    <!-- 搜索和筛选栏 -->
    <div class="filter-bar">
      <div class="filter-left">
        <el-input
          v-model="searchText"
          placeholder="Filter tasks..."
          class="search-input"
          clearable
        >
          <template #prefix>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </template>
        </el-input>

        <el-select v-model="statusFilter" placeholder="Status" class="filter-select">
          <el-option label="All Status" value="all" />
          <el-option
            v-for="(label, status) in statusLabelMap"
            :key="status"
            :label="label"
            :value="status"
          />
        </el-select>

        <el-select v-model="priorityFilter" placeholder="Priority" class="filter-select">
          <el-option label="All Priority" value="all" />
          <el-option
            v-for="(label, priority) in priorityLabelMap"
            :key="priority"
            :label="label"
            :value="priority"
          />
        </el-select>
      </div>
    </div>

    <!-- 任务表格 -->
    <div class="task-table">
      <!-- 表头 -->
      <div class="table-header">
        <div class="header-cell checkbox-cell">
          <el-checkbox
            :model-value="isAllSelected"
            @change="toggleAllSelection"
          />
        </div>
        <div class="header-cell task-id-cell">Task</div>
        <div class="header-cell title-cell" @click="toggleSort('title')">
          <span>Title</span>
          <span v-if="sortField === 'title'" class="sort-icon">
            {{ sortOrder === 'asc' ? '↑' : '↓' }}
          </span>
        </div>
        <div class="header-cell status-cell" @click="toggleSort('status')">
          <span>Status</span>
          <span v-if="sortField === 'status'" class="sort-icon">
            {{ sortOrder === 'asc' ? '↑' : '↓' }}
          </span>
        </div>
        <div class="header-cell priority-cell" @click="toggleSort('priority')">
          <span>Priority</span>
          <span v-if="sortField === 'priority'" class="sort-icon">
            {{ sortOrder === 'asc' ? '↑' : '↓' }}
          </span>
        </div>
        <div class="header-cell actions-cell"></div>
      </div>

      <!-- 表格内容 -->
      <div class="table-body">
        <div
          v-for="task in paginatedTasks"
          :key="task.id"
          class="table-row"
          @click="emit('edit', task)"
        >
          <div class="body-cell checkbox-cell" @click.stop>
            <el-checkbox
              :model-value="selectedTasks.has(task.id)"
              @change="emit('toggleSelection', task.id)"
            />
          </div>

          <div class="body-cell task-id-cell">
            <span class="task-id">TASK-{{ task.id.split('-')[0] }}</span>
          </div>

          <div class="body-cell title-cell">
            <div class="title-content">
              <div class="task-tags">
                <el-tag
                  v-for="tag in task.tags.slice(0, 1)"
                  :key="tag"
                  size="small"
                  :type="getTagType(tag)"
                >
                  {{ tag }}
                </el-tag>
              </div>
              <div class="task-title">{{ task.title }}</div>
            </div>
          </div>

          <div class="body-cell status-cell">
            <div class="status-badge">
              <span class="status-icon">{{ statusIconMap[task.status] }}</span>
              <span>{{ statusLabelMap[task.status] }}</span>
            </div>
          </div>

          <div class="body-cell priority-cell">
            <div class="priority-badge">
              <span class="priority-icon">{{ priorityIconMap[task.priority] }}</span>
              <span>{{ priorityLabelMap[task.priority] }}</span>
            </div>
          </div>

          <div class="body-cell actions-cell" @click.stop>
            <el-dropdown>
              <span class="actions-trigger">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path>
                </svg>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="emit('edit', task)">编辑</el-dropdown-item>
                  <el-dropdown-item @click="emit('delete', task)">删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="paginatedTasks.length === 0" class="empty-state">
          <p>没有找到任务</p>
        </div>
      </div>
    </div>

    <!-- 分页栏 -->
    <div class="pagination-bar">
      <div class="pagination-info">
        {{ selectedTasks.size }} of {{ filteredTasks.length }} row(s) selected.
      </div>

      <div class="pagination-controls">
        <div class="page-size-select">
          <span>Rows per page:</span>
          <el-select v-model="pageSize" size="small">
            <el-option :value="10" label="10" />
            <el-option :value="20" label="20" />
            <el-option :value="50" label="50" />
            <el-option :value="100" label="100" />
          </el-select>
        </div>

        <div class="page-info">
          Page {{ currentPage }} of {{ totalPages }}
        </div>

        <div class="page-buttons">
          <el-button
            size="small"
            :disabled="currentPage === 1"
            @click="currentPage = 1"
          >
            ⟪
          </el-button>
          <el-button
            size="small"
            :disabled="currentPage === 1"
            @click="currentPage--"
          >
            ‹
          </el-button>
          <el-button
            size="small"
            :disabled="currentPage === totalPages"
            @click="currentPage++"
          >
            ›
          </el-button>
          <el-button
            size="small"
            :disabled="currentPage === totalPages"
            @click="currentPage = totalPages"
          >
            ⟫
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.list-view {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
}

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 12px;
}

.filter-left {
  display: flex;
  gap: 12px;
  flex: 1;
}

.search-input {
  width: 300px;
}

.filter-select {
  width: 150px;
}

.task-table {
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 16px;
}

.table-header {
  display: grid;
  grid-template-columns: 40px 120px 1fr 150px 120px 40px;
  background: #f7f7f5;
  border-bottom: 1px solid #e5e5e5;
  font-size: 12px;
  font-weight: 600;
  color: #6b6b6b;
  text-transform: uppercase;
}

.header-cell {
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  user-select: none;
}

.header-cell.checkbox-cell,
.header-cell.actions-cell {
  cursor: default;
}

.sort-icon {
  margin-left: 4px;
  color: #3b82f6;
}

.table-body {
  min-height: 400px;
}

.table-row {
  display: grid;
  grid-template-columns: 40px 120px 1fr 150px 120px 40px;
  border-bottom: 1px solid #e5e5e5;
  transition: background-color 0.2s;
  cursor: pointer;
}

.table-row:hover {
  background: #f9f9f9;
}

.table-row:last-child {
  border-bottom: none;
}

.body-cell {
  padding: 12px 16px;
  display: flex;
  align-items: center;
  font-size: 14px;
}

.task-id {
  font-family: 'Monaco', monospace;
  font-size: 13px;
  color: #6b6b6b;
}

.title-cell {
  overflow: hidden;
}

.title-content {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  overflow: hidden;
}

.task-tags {
  flex-shrink: 0;
}

.task-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #1a1a1a;
}

.status-badge,
.priority-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #6b6b6b;
}

.status-icon,
.priority-icon {
  font-size: 16px;
}

.actions-trigger {
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.actions-trigger:hover {
  background: #e5e5e5;
}

.empty-state {
  padding: 60px 20px;
  text-align: center;
  color: #9b9b9b;
}

.pagination-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid #e5e5e5;
}

.pagination-info {
  font-size: 13px;
  color: #6b6b6b;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-size-select {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #6b6b6b;
}

.page-info {
  font-size: 13px;
  color: #6b6b6b;
}

.page-buttons {
  display: flex;
  gap: 4px;
}
</style>
