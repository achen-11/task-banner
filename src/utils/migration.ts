import type { Task } from '@/types'
import { useTaskStore } from '@/stores/task'
import { useDBStore } from '@/stores/db'

/**
 * 迁移现有任务数据，添加新字段
 */
export async function migrateTasksToLatestVersion() {
  const taskStore = useTaskStore()
  const dbStore = useDBStore()

  let migratedCount = 0

  for (const task of taskStore.tasks) {
    let needsMigration = false

    // 检查是否需要迁移
    const needsProgress = task.progress === undefined
    const needsChangelog = !Array.isArray(task.changelog)

    if (needsProgress || needsChangelog) {
      needsMigration = true
    }

    // 如果需要迁移，保存任务
    if (needsMigration) {
      // 创建纯对象用于保存 - 避免克隆响应式对象
      const taskToSave: Task = {
        id: task.id,
        projectId: task.projectId,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        tags: Array.isArray(task.tags) ? [...task.tags] : [],
        technicalPoints: task.technicalPoints ? [...task.technicalPoints] : undefined,
        referenceLinks: task.referenceLinks ? [...task.referenceLinks] : undefined,
        progress: needsProgress ? 0 : task.progress,
        changelog: needsChangelog ? [{
          timestamp: Date.now(),
          field: '系统',
          oldValue: '',
          newValue: '数据迁移',
          action: '任务数据已迁移到最新版本'
        }] : [...task.changelog],
        order: task.order,
        createdAt: task.createdAt,
        updatedAt: Date.now(),
      }

      // 不使用 taskStore.updateTask，直接更新以避免循环
      const index = taskStore.tasks.findIndex(t => t.id === task.id)
      if (index !== -1) {
        taskStore.tasks[index] = taskToSave
      }

      await dbStore.saveTask(taskToSave)
      migratedCount++
    }
  }

  return migratedCount
}
