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

  // 添加AI指令
  lines.push(`## 🤖 AI 协作指引\n`)
  lines.push(`### 任务处理流程`)
  lines.push(`1. **阅读任务**：仔细阅读下方的任务需求，理解每个任务的目标、技术要点和参考资料`)
  lines.push(`2. **实现任务**：根据项目技术栈和任务描述完成开发`)
  lines.push(`3. **保留元数据**：在返回结果时，务必保留每个任务的 task-id 注释（\`<!-- task-id: xxx -->\`）`)
  lines.push(`4. **更新任务信息**：`)
  lines.push(`   - 更新任务描述，补充实现细节`)
  lines.push(`   - 如有修改文件，在技术要点中注明`)
  lines.push(`   - 添加相关的参考链接（如果有）`)
  lines.push(`5. **返回格式**：保持 Markdown 格式不变，返回完整的文档内容\n`)
  lines.push(`### ⚠️ 重要提醒`)
  lines.push(`- 必须保留所有 \`<!-- task-id: xxx -->\` 注释，这是任务回填的关键标识`)
  lines.push(`- 保持 Markdown 结构完整，不要删除任何标题层级`)
  lines.push(`- 任务完成后，可以在任务描述末尾添加实现说明\n`)

  lines.push(`---\n`)
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
        lines.push(`**优先级：** ${getPriorityLabel(task.priority)}`)
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
 * 获取优先级标签
 */
function getPriorityLabel(priority: string): string {
  const priorityLabels: Record<string, string> = {
    low: '低',
    medium: '中',
    high: '高',
    urgent: '紧急',
  }
  return priorityLabels[priority] || priority
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

  // 首先尝试基于 task-id 注释分割文本
  // 匹配 <!-- task-id: xxx --> (可能前面有 # 或其他字符)
  const taskIdRegex = /(?:^|\n)(?:#\s*)?<!--\s*task-id:\s*(\S+)\s*-->/g

  // 找到所有 task-id 及其位置
  const taskIdMatches: Array<{ id: string; index: number }> = []
  let match
  while ((match = taskIdRegex.exec(markdown)) !== null) {
    taskIdMatches.push({
      id: match[1],
      index: match.index
    })
  }

  // 如果没有找到任何 task-id，使用旧的序号分割方式
  if (taskIdMatches.length === 0) {
    return importTasksFromMarkdownLegacy(markdown, projectId, existingTaskIds)
  }

  // 按 task-id 分割并解析每个任务
  for (let i = 0; i < taskIdMatches.length; i++) {
    const currentMatch = taskIdMatches[i]
    const nextMatch = taskIdMatches[i + 1]

    // 提取当前任务的内容（从当前 task-id 到下一个 task-id 或文本结尾）
    const taskContent = markdown.substring(
      currentMatch.index,
      nextMatch ? nextMatch.index : markdown.length
    )

    // 解析单个任务
    const task = parseSingleTask(taskContent, projectId, currentMatch.id, existingTaskIds, tasks.length)
    if (task && task.title) {
      tasks.push(task)
    }
  }

  return tasks
}

/**
 * 解析单个任务内容
 */
function parseSingleTask(
  content: string,
  projectId: string,
  taskId: string,
  existingTaskIds: string[],
  order: number
): Partial<Task> | null {
  const lines = content.split('\n')

  // 如果 task-id 已存在，保留原 ID（用于更新）
  const finalTaskId = taskId

  const task: Partial<Task> = {
    id: finalTaskId,
    projectId,
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    tags: [],
    technicalPoints: [],
    referenceLinks: [],
    progress: 0,
    changelog: [],
    order,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  let currentSection: 'description' | 'technicalPoints' | 'referenceLinks' | null = null

  for (const line of lines) {
    const trimmedLine = line.trim()

    // 跳过 task-id 注释行
    if (trimmedLine.includes('<!-- task-id:')) {
      continue
    }

    // 提取任务标题 (支持 #### N. 标题 或 #### 标题)
    const titleMatch = trimmedLine.match(/^####\s*(?:\d+\.\s*)?(.+)$/)
    if (titleMatch && !task.title) {
      task.title = titleMatch[1].trim()
      continue
    }

    // 解析任务属性
    if (trimmedLine.startsWith('**状态：**')) {
      const statusText = trimmedLine.replace('**状态：**', '').trim()
      task.status = parseStatusFromLabel(statusText)
    } else if (trimmedLine.startsWith('**优先级：**')) {
      const priorityText = trimmedLine.replace('**优先级：**', '').trim()
      task.priority = parsePriorityFromLabel(priorityText)
    } else if (trimmedLine.startsWith('**标签：**')) {
      const tagsText = trimmedLine.replace('**标签：**', '').trim()
      task.tags = tagsText.split(',').map(t => t.trim()).filter(t => t)
    } else if (trimmedLine.startsWith('**任务描述：**')) {
      currentSection = 'description'
    } else if (trimmedLine.startsWith('**技术要点：**')) {
      currentSection = 'technicalPoints'
    } else if (trimmedLine.startsWith('**参考资料：**') || trimmedLine.startsWith('**参考链接：**')) {
      currentSection = 'referenceLinks'
    } else if (trimmedLine === '---' || trimmedLine.startsWith('###') || trimmedLine.startsWith('**✅')) {
      // 任务结束或新的小节开始
      currentSection = null
    } else if (currentSection && trimmedLine) {
      // 添加内容到当前章节
      if (currentSection === 'description') {
        task.description += (task.description ? '\n' : '') + trimmedLine
      } else if (currentSection === 'technicalPoints') {
        const pointMatch = trimmedLine.match(/^\d+\.\s*(.+)$/)
        if (pointMatch && task.technicalPoints) {
          task.technicalPoints.push(pointMatch[1].trim())
        }
      } else if (currentSection === 'referenceLinks') {
        const linkMatch = trimmedLine.match(/^\d+\.\s*(.+)$/)
        if (linkMatch && task.referenceLinks) {
          task.referenceLinks.push(linkMatch[1].trim())
        }
      }
    }
  }

  return task
}

/**
 * 旧版导入方法（基于序号分割）- 作为降级方案
 */
function importTasksFromMarkdownLegacy(
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
    } else if (line.startsWith('**优先级：**')) {
      const priorityText = line.replace('**优先级：**', '').trim()
      currentTask.priority = parsePriorityFromLabel(priorityText)
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

/**
 * 从优先级标签解析优先级值
 */
function parsePriorityFromLabel(label: string): Task['priority'] {
  const priorityMap: Record<string, Task['priority']> = {
    '低': 'low',
    '中': 'medium',
    '高': 'high',
    '紧急': 'urgent',
  }
  return priorityMap[label] || 'medium'
}
