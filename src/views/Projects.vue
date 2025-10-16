<script setup lang="ts">
import { ref, computed } from 'vue'
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
  return taskStore.getTasksByProject.value(projectId).length
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
    <div class="container mx-auto px-4 py-8">
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">项目列表</h1>
          <p class="text-gray-600 mt-2">共 {{ projectStore.projects.length }} 个项目</p>
        </div>
        <el-button type="primary" size="large" @click="createProject">
          新建项目
        </el-button>
      </div>

      <div v-if="projectStore.projects.length === 0" class="text-center py-16 bg-white rounded-lg shadow-sm">
        <div class="text-gray-400 mb-4">
          <svg class="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
        </div>
        <p class="text-gray-500 text-lg mb-4">还没有项目</p>
        <el-button type="primary" @click="createProject">
          创建第一个项目
        </el-button>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="project in projectStore.projects"
          :key="project.id"
          class="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-all cursor-pointer border-2 border-transparent hover:border-blue-200"
          @click="openProject(project.id)"
        >
          <div class="flex justify-between items-start mb-3">
            <h3 class="text-xl font-semibold text-gray-900 flex-1">{{ project.name }}</h3>
            <div class="flex gap-1" @click.stop>
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

          <p class="text-gray-600 text-sm mb-4 line-clamp-2">
            {{ project.description || '暂无描述' }}
          </p>

          <div class="flex flex-wrap gap-2 mb-4 min-h-[28px]">
            <el-tag
              v-for="tech in project.techStack"
              :key="tech"
              size="small"
              type="info"
            >
              {{ tech }}
            </el-tag>
          </div>

          <div class="flex justify-between items-center text-sm pt-4 border-t border-gray-100">
            <el-tag :type="project.status === 'active' ? 'success' : project.status === 'completed' ? '' : 'warning'" size="small">
              {{ statusLabelMap[project.status] }}
            </el-tag>
            <span class="text-gray-500">任务: {{ getTaskCount(project.id) }}</span>
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
</style>
