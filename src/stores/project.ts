import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Project } from '@/types'

export const useProjectStore = defineStore('project', () => {
  // State
  const projects = ref<Project[]>([])
  const currentProjectId = ref<string | null>(null)

  // Getters
  const currentProject = computed(() => {
    if (!currentProjectId.value) return null
    return projects.value.find(p => p.id === currentProjectId.value) || null
  })

  const activeProjects = computed(() => {
    return projects.value.filter(p => p.status === 'active')
  })

  // Actions
  function addProject(project: Project) {
    projects.value.push(project)
  }

  function updateProject(id: string, updates: Partial<Project>) {
    const index = projects.value.findIndex(p => p.id === id)
    if (index !== -1) {
      projects.value[index] = {
        ...projects.value[index],
        ...updates,
        updatedAt: Date.now()
      }
    }
  }

  function deleteProject(id: string) {
    const index = projects.value.findIndex(p => p.id === id)
    if (index !== -1) {
      projects.value.splice(index, 1)
      if (currentProjectId.value === id) {
        currentProjectId.value = null
      }
    }
  }

  function setCurrentProject(id: string | null) {
    currentProjectId.value = id
  }

  function getProjectById(id: string) {
    return projects.value.find(p => p.id === id)
  }

  return {
    projects,
    currentProjectId,
    currentProject,
    activeProjects,
    addProject,
    updateProject,
    deleteProject,
    setCurrentProject,
    getProjectById
  }
})
