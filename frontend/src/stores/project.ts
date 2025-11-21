/**
 * 项目状态管理
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Project, CreateProjectParams, UpdateProjectParams } from '@/types/project'
import * as projectApi from '@/api/project'

export const useProjectStore = defineStore('project', () => {
  // 状态
  const projects = ref<Project[]>([])
  const currentProject = ref<Project | null>(null)
  const loading = ref(false)
  const total = ref(0)

  // 计算属性
  const activeProjects = computed(() =>
    projects.value.filter(p => p.status === 'active')
  )

  const completedProjects = computed(() =>
    projects.value.filter(p => p.status === 'completed')
  )

  const pausedProjects = computed(() =>
    projects.value.filter(p => p.status === 'paused')
  )

  const archivedProjects = computed(() =>
    projects.value.filter(p => p.status === 'archived')
  )

  // 方法
  /**
   * 获取项目列表
   */
  async function fetchProjects(page = 1, size = 20) {
    loading.value = true
    try {
      const data = await projectApi.getProjectList(page, size)
      projects.value = data.items
      total.value = data.total
      return data
    } catch (error) {
      console.error('Failed to fetch projects:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取项目详情
   */
  async function fetchProjectDetail(id: string) {
    loading.value = true
    try {
      const project = await projectApi.getProjectDetail(id)
      currentProject.value = project
      return project
    } catch (error) {
      console.error('Failed to fetch project detail:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 创建项目
   */
  async function createProject(data: CreateProjectParams) {
    loading.value = true
    try {
      const project = await projectApi.createProject(data)
      projects.value.unshift(project)
      total.value++
      return project
    } catch (error) {
      console.error('Failed to create project:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 更新项目
   */
  async function updateProject(data: UpdateProjectParams) {
    loading.value = true
    try {
      const project = await projectApi.updateProject(data)

      // 更新列表中的项目
      const index = projects.value.findIndex(p => p._id === data.id)
      if (index !== -1) {
        projects.value[index] = project
      }

      // 更新当前项目
      if (currentProject.value?._id === data.id) {
        currentProject.value = project
      }

      return project
    } catch (error) {
      console.error('Failed to update project:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 删除项目
   */
  async function deleteProject(id: string) {
    loading.value = true
    try {
      await projectApi.deleteProject(id)

      // 从列表中移除
      projects.value = projects.value.filter(p => p._id !== id)
      total.value--

      // 清除当前项目
      if (currentProject.value?._id === id) {
        currentProject.value = null
      }
    } catch (error) {
      console.error('Failed to delete project:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 根据 ID 查找项目
   */
  function findProjectById(id: string) {
    return projects.value.find(p => p._id === id)
  }

  /**
   * 设置当前项目
   */
  function setCurrentProject(project: Project | null) {
    currentProject.value = project
  }

  /**
   * 清空状态
   */
  function reset() {
    projects.value = []
    currentProject.value = null
    loading.value = false
    total.value = 0
  }

  return {
    // 状态
    projects,
    currentProject,
    loading,
    total,

    // 计算属性
    activeProjects,
    completedProjects,
    pausedProjects,
    archivedProjects,

    // 方法
    fetchProjects,
    fetchProjectDetail,
    createProject,
    updateProject,
    deleteProject,
    findProjectById,
    setCurrentProject,
    reset
  }
})
