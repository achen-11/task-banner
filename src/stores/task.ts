import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Task, TaskStatus } from '@/types'

export const useTaskStore = defineStore('task', () => {
  // State
  const tasks = ref<Task[]>([])

  // Getters
  const getTasksByProject = computed(() => {
    return (projectId: string) => {
      return tasks.value
        .filter(t => t.projectId === projectId)
        .sort((a, b) => a.order - b.order)
    }
  })

  const getTasksByStatus = computed(() => {
    return (projectId: string, status: TaskStatus) => {
      return tasks.value
        .filter(t => t.projectId === projectId && t.status === status)
        .sort((a, b) => a.order - b.order)
    }
  })

  const allTasks = computed(() => {
    return tasks.value.sort((a, b) => b.createdAt - a.createdAt)
  })

  // Actions
  function addTask(task: Task) {
    tasks.value.push(task)
  }

  function updateTask(id: string, updates: Partial<Task>) {
    const index = tasks.value.findIndex(t => t.id === id)
    if (index !== -1) {
      const current = tasks.value[index]

      // 深度克隆 changelog 以避免响应式对象问题
      const getClonedChangelog = (changelog: any[]) => {
        return changelog.map(entry => ({
          timestamp: entry.timestamp,
          field: entry.field,
          oldValue: entry.oldValue,
          newValue: entry.newValue,
          action: entry.action
        }))
      }

      const newChangelog = updates.changelog
        ? getClonedChangelog(updates.changelog)
        : (current.changelog ? getClonedChangelog(current.changelog) : [])

      tasks.value[index] = {
        id: current.id,
        projectId: updates.projectId ?? current.projectId,
        title: updates.title ?? current.title,
        description: updates.description ?? current.description,
        status: updates.status ?? current.status,
        priority: updates.priority ?? current.priority,
        tags: updates.tags ? [...updates.tags] : [...current.tags],
        technicalPoints: updates.technicalPoints ? [...updates.technicalPoints] : (current.technicalPoints ? [...current.technicalPoints] : undefined),
        referenceLinks: updates.referenceLinks ? [...updates.referenceLinks] : (current.referenceLinks ? [...current.referenceLinks] : undefined),
        progress: updates.progress !== undefined ? updates.progress : (current.progress ?? 0),
        changelog: newChangelog,
        order: updates.order ?? current.order,
        createdAt: current.createdAt,
        updatedAt: Date.now()
      }
    }
  }

  function deleteTask(id: string) {
    const index = tasks.value.findIndex(t => t.id === id)
    if (index !== -1) {
      tasks.value.splice(index, 1)
    }
  }

  function deleteTasks(ids: string[]) {
    tasks.value = tasks.value.filter(t => !ids.includes(t.id))
  }

  function deleteTasksByProject(projectId: string) {
    tasks.value = tasks.value.filter(t => t.projectId !== projectId)
  }

  function updateTaskStatus(id: string, status: TaskStatus) {
    updateTask(id, { status })
  }

  function updateTaskOrder(id: string, order: number) {
    updateTask(id, { order })
  }

  function getTaskById(id: string) {
    return tasks.value.find(t => t.id === id)
  }

  return {
    tasks,
    allTasks,
    getTasksByProject,
    getTasksByStatus,
    addTask,
    updateTask,
    deleteTask,
    deleteTasks,
    deleteTasksByProject,
    updateTaskStatus,
    updateTaskOrder,
    getTaskById
  }
})
