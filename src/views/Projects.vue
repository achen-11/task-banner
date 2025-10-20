<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useProjectStore } from '@/stores/project'
import { useTaskStore } from '@/stores/task'
import { useDBStore } from '@/stores/db'
import type { Project } from '@/types'
import ProjectDialog from '@/components/ProjectDialog.vue'

const router = useRouter()
const projectStore = useProjectStore()
const taskStore = useTaskStore()
const dbStore = useDBStore()

const showDialog = ref(false)
const editingProject = ref<Project | null>(null)

const statusLabelMap: Record<string, string> = {
  active: '进行中',
  completed: '已完成',
  paused: '已暂停',
}

const getTaskCount = (projectId: string) => {
  return taskStore.getTasksByProject(projectId).length
}

const openProject = (projectId: string) => {
  projectStore.setCurrentProject(projectId)
  router.push(`/board/${projectId}`)
}

const createProject = () => {
  editingProject.value = null
  showDialog.value = true
}

const editProject = (project: Project, event: Event) => {
  event.stopPropagation()
  editingProject.value = project
  showDialog.value = true
}

const deleteProject = async (project: Project, event: Event) => {
  event.stopPropagation()

  try {
    await ElMessageBox.confirm(
      `确定要删除项目"${project.name}"吗？该操作会同时删除项目下的所有任务。`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    projectStore.deleteProject(project.id)
    taskStore.deleteTasksByProject(project.id)
    await dbStore.removeProject(project.id)
    ElMessage.success('项目删除成功')
  } catch (error) {
    // 用户取消删除
  }
}

const handleDialogSuccess = () => {
  // 对话框成功后的回调
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container mx-auto px-6 py-10">
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">项目列表</h1>
          <p class="text-gray-600 mt-2">共 {{ projectStore.projects.length }} 个项目</p>
        </div>
        <el-button type="primary" size="large" @click="createProject">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
          </svg>
          新建项目
        </el-button>
      </div>

      <div v-if="projectStore.projects.length === 0" class="text-center py-16 bg-white rounded-lg shadow-sm">
        <div class="text-gray-400 mb-4">
          <svg class="icon-large mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
        </div>
        <p class="text-gray-500 text-lg mb-4">还没有项目</p>
        <el-button type="primary" @click="createProject">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
          </svg>
          创建第一个项目
        </el-button>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div
          v-for="project in projectStore.projects"
          :key="project.id"
          class="project-card"
          @click="openProject(project.id)"
        >
          <div class="project-card-header">
            <div class="project-icon">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
              </svg>
            </div>
            <div class="project-actions" @click.stop>
              <el-button
                type="primary"
                text
                size="small"
                @click="editProject(project, $event)"
              >
                编辑
              </el-button>
              <el-button
                type="danger"
                text
                size="small"
                @click="deleteProject(project, $event)"
              >
                删除
              </el-button>
            </div>
          </div>

          <h3 class="project-title">{{ project.name }}</h3>

          <p class="project-description">
            {{ project.description || '暂无描述' }}
          </p>

          <div class="project-tags">
            <el-tag
              v-for="tech in project.techStack"
              :key="tech"
              size="small"
              effect="plain"
            >
              {{ tech }}
            </el-tag>
          </div>

          <div class="project-footer">
            <el-tag
              :type="project.status === 'active' ? 'success' : project.status === 'completed' ? '' : 'warning'"
              size="small"
              effect="dark"
            >
              {{ statusLabelMap[project.status] }}
            </el-tag>
            <div class="task-count">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
              </svg>
              <span>{{ getTaskCount(project.id) }} 个任务</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 项目对话框 -->
      <ProjectDialog
        v-model:visible="showDialog"
        :project="editingProject"
        @success="handleDialogSuccess"
      />
    </div>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.icon-large {
  width: 96px;
  height: 96px;
}

/* 按钮内图标样式 */
.el-button svg {
  display: inline-block;
  vertical-align: middle;
}

.w-5 {
  width: 1.25rem;
}

.h-5 {
  height: 1.25rem;
}

.mr-2 {
  margin-right: 0.5rem;
}

.project-card {
  background: white;
  border-radius: 20px;
  padding: 28px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;
}

.project-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.3s ease;
}

.project-card:hover::before {
  transform: scaleX(1);
}

.project-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.03);
  border-color: #d1d5db;
}

.project-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.project-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 2px 4px rgba(102, 126, 234, 0.2);
}

.project-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.project-card:hover .project-actions {
  opacity: 1;
}

.project-title {
  font-size: 22px;
  font-weight: 700;
  color: #1a202c;
  margin-bottom: 14px;
  line-height: 1.4;
  letter-spacing: -0.02em;
}

.project-description {
  color: #718096;
  font-size: 15px;
  line-height: 1.7;
  margin-bottom: 20px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 48px;
}

.project-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
  min-height: 28px;
}

.project-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}

.task-count {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #718096;
  font-size: 13px;
  font-weight: 500;
}
</style>
