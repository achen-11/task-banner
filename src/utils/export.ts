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
        lines.push(`#### ${index + 1}. ${task.title}\n`)

        // 任务基本信息
        lines.push(`**状态：** ${getStatusLabel(task.status)}`)
        if (task.estimatedEffort) {
          lines.push(`**预计工作量：** ${task.estimatedEffort}`)
        }
        if (task.dueDate) {
          const dueDate = new Date(task.dueDate).toLocaleDateString('zh-CN')
          lines.push(`**截止日期：** ${dueDate}`)
        }
        if (task.tags.length > 0) {
          lines.push(`**标签：** ${task.tags.join(', ')}`)
        }
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
