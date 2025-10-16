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
      tasks.value[index] = {
        ...tasks.value[index],
        ...updates,
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
