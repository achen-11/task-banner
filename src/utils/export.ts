import type { Task, Project } from '@/types'

/**
 * 导出任务为 Markdown 格式
 */
export function exportTasksToMarkdown(tasks: Task[], project: Project): string {
  if (tasks.length === 0) {
    return '# 暂无任务'
  }

  const lines: string[] = []

  // 添加项目信息
  lines.push(`# ${project.name} - 任务需求文档\n`)

  if (project.description) {
    lines.push(`## 项目描述`)
    lines.push(`${project.description}\n`)
  }

  if (project.techStack.length > 0) {
    lines.push(`## 技术栈`)
    lines.push(project.techStack.map(tech => `- ${tech}`).join('\n'))
    lines.push('')
  }

  lines.push(`## 任务列表\n`)
  lines.push(`共 ${tasks.length} 个任务\n`)

  // 按优先级分组任务
  const priorityOrder = ['urgent', 'high', 'medium', 'low']
  const priorityLabels: Record<string, string> = {
    urgent: '🔴 紧急',
    high: '🟠 高优先级',
    medium: '🟡 中优先级',
    low: '🟢 低优先级',
  }

  priorityOrder.forEach(priority => {
    const priorityTasks = tasks.filter(t => t.priority === priority)

    if (priorityTasks.length > 0) {
      lines.push(`### ${priorityLabels[priority]}\n`)

      priorityTasks.forEach((task, index) => {
        // 添加任务 ID 作为隐藏元数据 (HTML 注释)
        lines.push(`<!-- task-id: ${task.id} -->`)
        lines.push(`#### ${index + 1}. ${task.title}\n`)

        // 任务基本信息
        lines.push(`**状态：** ${getStatusLabel(task.status)}`)
        lines.push(`**进度：** ${task.progress}%`)
        if (task.tags.length > 0) {
          lines.push(`**标签：** ${task.tags.join(', ')}`)
        }
        lines.push(`**创建时间：** ${new Date(task.createdAt).toLocaleString('zh-CN')}`)
        lines.push(`**更新时间：** ${new Date(task.updatedAt).toLocaleString('zh-CN')}`)
        lines.push('')

        // 任务描述
        lines.push(`**任务描述：**\n`)
        lines.push(task.description)
        lines.push('')

        // 技术要点
        if (task.technicalPoints && task.technicalPoints.length > 0) {
          lines.push(`**技术要点：**\n`)
          task.technicalPoints.forEach((point, i) => {
            lines.push(`${i + 1}. ${point}`)
          })
          lines.push('')
        }

        // 参考链接
        if (task.referenceLinks && task.referenceLinks.length > 0) {
          lines.push(`**参考资料：**\n`)
          task.referenceLinks.forEach((link, i) => {
            lines.push(`${i + 1}. ${link}`)
          })
          lines.push('')
        }

        lines.push('---\n')
      })
    }
  })

  // 添加页脚
  lines.push(`\n> 📅 导出时间：${new Date().toLocaleString('zh-CN')}`)
  lines.push(`> 🤖 由 Task Banner 生成`)

  return lines.join('\n')
}

/**
 * 获取状态标签
 */
function getStatusLabel(status: string): string {
  const statusLabels: Record<string, string> = {
    todo: '待办',
    in_progress: '进行中',
    completed: '已完成',
    sent_to_ai: '已发送AI',
    needs_optimization: '需优化',
  }
  return statusLabels[status] || status
}

/**
 * 复制文本到剪贴板
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    // 尝试使用现代 Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }

    // 降级方案：使用 textarea
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()

    const success = document.execCommand('copy')
    document.body.removeChild(textarea)

    return success
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    return false
  }
}

/**
 * 下载文本为文件
 */
export function downloadAsFile(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

/**
 * 从 Markdown 导入任务
 * @param markdown Markdown 文本
 * @param projectId 目标项目 ID
 * @param existingTaskIds 已存在的任务 ID 列表（用于检测冲突）
 * @returns 解析出的任务列表
 */
export function importTasksFromMarkdown(
  markdown: string,
  projectId: string,
  existingTaskIds: string[] = []
): Partial<Task>[] {
  const tasks: Partial<Task>[] = []
  const lines = markdown.split('\n')

  let currentTask: Partial<Task> | null = null
  let currentSection: 'description' | 'technicalPoints' | 'referenceLinks' | null = null
  let lastTaskId: string | null = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // 提取任务 ID (从 HTML 注释)
    const taskIdMatch = line.match(/<!--\s*task-id:\s*(\S+)\s*-->/)
    if (taskIdMatch) {
      lastTaskId = taskIdMatch[1]
      // 如果 ID 已存在，生成新 ID
      if (existingTaskIds.includes(lastTaskId)) {
        lastTaskId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }
      continue
    }

    // 检测任务标题 (#### 1. 标题)
    const titleMatch = line.match(/^####\s*\d+\.\s*(.+)$/)
    if (titleMatch) {
      // 保存上一个任务
      if (currentTask && currentTask.title) {
        tasks.push(currentTask)
      }

      // 创建新任务
      currentTask = {
        id: lastTaskId || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        projectId,
        title: titleMatch[1].trim(),
        description: '',
        status: 'todo',
        priority: 'medium',
        tags: [],
        technicalPoints: [],
        referenceLinks: [],
        progress: 0,
        changelog: [],
        order: tasks.length,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      currentSection = null
      lastTaskId = null
      continue
    }

    // 如果没有当前任务，跳过
    if (!currentTask) continue

    // 解析任务属性
    if (line.startsWith('**状态：**')) {
      const statusText = line.replace('**状态：**', '').trim()
      currentTask.status = parseStatusFromLabel(statusText)
    } else if (line.startsWith('**进度：**')) {
      const progressMatch = line.match(/(\d+)%/)
      if (progressMatch) {
        currentTask.progress = parseInt(progressMatch[1])
      }
    } else if (line.startsWith('**标签：**')) {
      const tagsText = line.replace('**标签：**', '').trim()
      currentTask.tags = tagsText.split(',').map(t => t.trim()).filter(t => t)
    } else if (line.startsWith('**任务描述：**')) {
      currentSection = 'description'
    } else if (line.startsWith('**技术要点：**')) {
      currentSection = 'technicalPoints'
    } else if (line.startsWith('**参考资料：**')) {
      currentSection = 'referenceLinks'
    } else if (line === '---' || line.startsWith('###')) {
      // 任务结束标记
      currentSection = null
    } else if (currentSection && line) {
      // 添加内容到当前章节
      if (currentSection === 'description') {
        currentTask.description += (currentTask.description ? '\n' : '') + line
      } else if (currentSection === 'technicalPoints') {
        const pointMatch = line.match(/^\d+\.\s*(.+)$/)
        if (pointMatch && currentTask.technicalPoints) {
          currentTask.technicalPoints.push(pointMatch[1].trim())
        }
      } else if (currentSection === 'referenceLinks') {
        const linkMatch = line.match(/^\d+\.\s*(.+)$/)
        if (linkMatch && currentTask.referenceLinks) {
          currentTask.referenceLinks.push(linkMatch[1].trim())
        }
      }
    }
  }

  // 保存最后一个任务
  if (currentTask && currentTask.title) {
    tasks.push(currentTask)
  }

  return tasks
}

/**
 * 从状态标签解析状态值
 */
function parseStatusFromLabel(label: string): Task['status'] {
  const statusMap: Record<string, Task['status']> = {
    '待办': 'todo',
    '进行中': 'in_progress',
    '已完成': 'completed',
    '已发送AI': 'sent_to_ai',
    '需优化': 'needs_optimization',
  }
  return statusMap[label] || 'todo'
}
