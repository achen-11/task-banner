import { defineStore } from 'pinia'
import { db, initializeDB, exportAllData, importAllData } from '@/db'
import { useProjectStore } from './project'
import { useTaskStore } from './task'

export const useDBStore = defineStore('db', () => {
  // 初始化数据库
  async function initialize() {
    await initializeDB()
    await loadAllData()
  }

  // 从数据库加载所有数据到 store
  async function loadAllData() {
    try {
      const projectStore = useProjectStore()
      const taskStore = useTaskStore()

      // 加载项目
      const projects = await db.projects.toArray()
      projects.forEach(project => {
        projectStore.addProject(project)
      })

      // 加载任务
      const tasks = await db.tasks.toArray()
      tasks.forEach(task => {
        taskStore.addTask(task)
      })

      console.log('Data loaded from database')
    } catch (error) {
      console.error('Failed to load data:', error)
    }
  }

  // 保存项目到数据库
  async function saveProject(project: any) {
    try {
      await db.projects.put(project)
    } catch (error) {
      console.error('Failed to save project:', error)
      throw error
    }
  }

  // 删除项目从数据库
  async function removeProject(id: string) {
    try {
      await db.projects.delete(id)
      // 同时删除该项目的所有任务
      await db.tasks.where('projectId').equals(id).delete()
    } catch (error) {
      console.error('Failed to remove project:', error)
      throw error
    }
  }

  // 保存任务到数据库
  async function saveTask(task: any) {
    try {
      await db.tasks.put(task)
    } catch (error) {
      console.error('Failed to save task:', error)
      throw error
    }
  }

  // 删除任务从数据库
  async function removeTask(id: string) {
    try {
      await db.tasks.delete(id)
    } catch (error) {
      console.error('Failed to remove task:', error)
      throw error
    }
  }

  // 批量删除任务
  async function removeTasks(ids: string[]) {
    try {
      await db.tasks.bulkDelete(ids)
    } catch (error) {
      console.error('Failed to remove tasks:', error)
      throw error
    }
  }

  // 导出数据
  async function exportData() {
    try {
      const data = await exportAllData()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `task-banner-backup-${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
      return true
    } catch (error) {
      console.error('Failed to export data:', error)
      return false
    }
  }

  // 导入数据
  async function importData(file: File) {
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      await importAllData(data)

      // 重新加载数据
      await loadAllData()
      return true
    } catch (error) {
      console.error('Failed to import data:', error)
      return false
    }
  }

  return {
    initialize,
    loadAllData,
    saveProject,
    removeProject,
    saveTask,
    removeTask,
    removeTasks,
    exportData,
    importData
  }
})
