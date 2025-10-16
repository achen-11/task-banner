import Dexie, { type Table } from 'dexie'
import type { Project, Task, ExportTemplate, ExportHistory } from '@/types'

class TaskBannerDatabase extends Dexie {
  projects!: Table<Project, string>
  tasks!: Table<Task, string>
  exportTemplates!: Table<ExportTemplate, string>
  exportHistory!: Table<ExportHistory, string>

  constructor() {
    super('TaskBannerDB')

    this.version(1).stores({
      projects: 'id, name, status, createdAt, updatedAt',
      tasks: 'id, projectId, status, priority, order, createdAt, updatedAt',
      exportTemplates: 'id, name, isDefault, createdAt',
      exportHistory: 'id, exportedAt'
    })
  }
}

export const db = new TaskBannerDatabase()

// 数据库初始化
export async function initializeDB() {
  try {
    await db.open()
    console.log('Database initialized successfully')

    // 检查是否需要添加默认数据
    const templateCount = await db.exportTemplates.count()
    if (templateCount === 0) {
      await addDefaultTemplates()
    }
  } catch (error) {
    console.error('Failed to initialize database:', error)
  }
}

// 添加默认导出模板
async function addDefaultTemplates() {
  const defaultTemplate: ExportTemplate = {
    id: 'default-template',
    name: '标准需求模板',
    content: `# 任务需求：{{title}}

## 项目信息
- 项目名称：{{projectName}}
- 技术栈：{{techStack}}

## 任务描述
{{description}}

{{#technicalPoints}}
## 技术要点
{{technicalPoints}}
{{/technicalPoints}}

{{#referenceLinks}}
## 参考资料
{{referenceLinks}}
{{/referenceLinks}}

## 优先级
{{priority}}
`,
    isDefault: true,
    createdAt: Date.now()
  }

  try {
    await db.exportTemplates.add(defaultTemplate)
    console.log('Default template added')
  } catch (error) {
    console.error('Failed to add default template:', error)
  }
}

// 导出所有数据（备份）
export async function exportAllData() {
  try {
    const projects = await db.projects.toArray()
    const tasks = await db.tasks.toArray()
    const exportTemplates = await db.exportTemplates.toArray()
    const exportHistory = await db.exportHistory.toArray()

    return {
      version: 1,
      timestamp: Date.now(),
      data: {
        projects,
        tasks,
        exportTemplates,
        exportHistory
      }
    }
  } catch (error) {
    console.error('Failed to export data:', error)
    throw error
  }
}

// 导入数据（恢复）
export async function importAllData(data: any) {
  try {
    await db.transaction('rw', db.projects, db.tasks, db.exportTemplates, db.exportHistory, async () => {
      // 清空现有数据
      await db.projects.clear()
      await db.tasks.clear()
      await db.exportTemplates.clear()
      await db.exportHistory.clear()

      // 导入新数据
      if (data.data.projects?.length > 0) {
        await db.projects.bulkAdd(data.data.projects)
      }
      if (data.data.tasks?.length > 0) {
        await db.tasks.bulkAdd(data.data.tasks)
      }
      if (data.data.exportTemplates?.length > 0) {
        await db.exportTemplates.bulkAdd(data.data.exportTemplates)
      }
      if (data.data.exportHistory?.length > 0) {
        await db.exportHistory.bulkAdd(data.data.exportHistory)
      }
    })

    console.log('Data imported successfully')
  } catch (error) {
    console.error('Failed to import data:', error)
    throw error
  }
}
