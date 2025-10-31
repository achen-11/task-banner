import type { Task, TaskDetail } from '@/types/task'

/**
 * 标准化内容格式，处理换行符和其他格式问题
 * @param content 原始内容
 * @returns 标准化后的内容
 */
function normalizeContent(content?: string): string | undefined {
  if (!content) return content

  return content
    // 处理转义的换行符 \n -> 实际换行符
    .replace(/\\n/g, '\n')
    // 处理转义的制表符 \t -> 实际制表符
    .replace(/\\t/g, '\t')
    // 处理转义的引号 \" -> 实际引号
    .replace(/\\"/g, '"')
    // 处理转义的斜杠 \\ -> 实际斜杠
    .replace(/\\\\/g, '\\')
    // 清理多余的空白行（连续超过2个换行符替换为2个）
    .replace(/\n{3,}/g, '\n\n')
    // 移除首尾空白
    .trim()
}

/**
 * 任务导出 JSON 数据结构
 */
export interface TaskExportData {
  // 核心字段
  _id: string
  projectId: string
  title: string
  status: 'todo' | 'in_progress' | 'completed' | 'review'
  // 注意：AI完成任务时应将状态设置为 'review'（待验收）而不是 'completed'（已完成）
  priority: 'low' | 'medium' | 'high'
  content: string  // 包含所有详细信息（实现方案、修改文件、技术要点等）

  // 可选字段
  summary?: string
  tagIds?: string[]
  assigneeId?: string
  moduleIds?: string[]

  // 时间戳
  createdAt: number
  updatedAt: number
}

/**
 * 导出任务为 JSON 格式
 */
export function exportTaskToJSON(task: Task | TaskDetail): string {
  const taskData: TaskExportData = {
    _id: task._id,
    projectId: task.projectId,
    title: task.title,
    status: task.status,
    priority: task.priority,
    content: task.content || '',
    summary: ('summary' in task) ? task.summary : undefined,
    tagIds: task.tagIds,
    assigneeId: task.assigneeId,
    moduleIds: task.moduleIds,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt
  }

  return JSON.stringify(taskData, null, 2)
}

/**
 * 导出多个任务为 JSON 格式
 */
export function exportTasksToJSON(tasks: (Task | TaskDetail)[]): string {
  const tasksData: TaskExportData[] = tasks.map(task => ({
    _id: task._id,
    projectId: task.projectId,
    title: task.title,
    status: task.status,
    priority: task.priority,
    content: task.content || '',
    summary: ('summary' in task) ? task.summary : undefined,
    tagIds: task.tagIds,
    assigneeId: task.assigneeId,
    moduleIds: task.moduleIds,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt
  }))

  return JSON.stringify(tasksData, null, 2)
}

/**
 * 生成AI协作指引内容
 */
export function generateAIGuidelines(): string[] {
  return [
    `## 🤖 AI 协作指引\n`,
    `### 任务处理流程`,
    `1. **阅读任务**：仔细阅读下方的任务需求，理解每个任务的目标、技术要点和参考资料`,
    `2. **实现任务**：根据项目技术栈和任务描述完成开发`,
    `3. **保留元数据**：在返回结果时，务必保留每个任务的 task-id 注释（\`<!-- task-id: xxx -->\`）`,
    `4. **更新任务信息**：`,
    `   - 将任务状态更新为「待验收」`,
    `   - **添加任务摘要**：在任务描述开头添加 \`**任务摘要：** <一句话总结>\``,
    `   - 补充实现细节（修改文件、技术要点等）`,
    `   - 如有修改文件，在技术要点中注明`,
    `5. **发送完成通知**：⚠️ **重要！必须执行！**`,
    `   - 使用命令：\`bash /Users/achen/Priv/task-banner/.claude-notify.sh "标题" "描述"\``,
    `   - 标题：简短的任务完成说明（如：✅ XXX 功能完成）`,
    `   - 描述：一句话总结完成的内容`,
    `6. **生成文件**：⚠️ **重要！必须使用 Write 工具生成文件**`,
    `   - 使用 Write 工具生成 \`/Users/achen/Priv/task-banner/docs/task.json\` 文件`,
    `     - 格式：单个任务用对象，多个任务用数组`,
    `     - 示例（单任务）：`,
    `       \`\`\`json`,
    `       {`,
    `         "_id": "任务ID",`,
    `         "status": "review",`,
    `         "summary": "任务摘要（20-50字）",`,
    `         "content": "完整的任务内容，包含实现方案、修改文件、技术要点、验证结果等所有信息"`,
    `       }`,
    `       \`\`\``,
    `     - 示例（多任务）：使用 JSON 数组 \`[{...}, {...}]\``,
    `   - 使用 Write 工具生成 \`/Users/achen/Priv/task-banner/docs/task.md\` 文件`,
    `     - 格式：完整的 Markdown 文档（包含 AI 协作指引 + 任务列表）`,
    `     - 必须保留所有 \`<!-- task-id: xxx -->\` 注释`,
    `   - 注意：content 字段需要使用 \\n 表示换行，使用 \\" 转义引号\n`,
    `### 📝 任务摘要编写规范`,
    `- **长度**：20-50 字`,
    `- **内容**：用一句话概括完成了什么，解决了什么问题`,
    `- **示例**：`,
    `  - ✅ "实现了用户登录功能，支持账号密码和第三方登录"`,
    `  - ✅ "修复了任务列表排序 bug，优化了性能"`,
    `  - ✅ "添加了任务导出功能，支持 Markdown 格式"`,
    `  - ❌ "将描述从 xxx 改为 xxx"（太粗暴）`,
    `  - ❌ "已在 Service 层实现..."（太技术化）\n`,
    `### ⚠️ 重要提醒`,
    `- 必须保留所有 \`<!-- task-id: xxx -->\` 注释，这是任务回填的关键标识`,
    `- 保持 Markdown 结构完整，不要删除任何标题层级`,
    `- 任务摘要必须简洁明了，便于快速理解任务变更内容\n`,
    `---\n`
  ]
}

/**
 * 生成AI解决方案模板内容
 */
export function generateAISolutionTemplate(): string[] {
  return [
    `---\n`,
    `## 🛠️ AI 解决方案`,
    ``,
    `**请在此处提供详细的实现方案：**`,
    ``,
    `### 实现步骤`,
    `1. 分析任务需求`,
    `2. 设计技术方案`,
    `3. 具体实现步骤`,
    `4. 验证和测试`,
    ``,
    `### 修改的文件`,
    `- 文件路径1`,
    `- 文件路径2`,
    ``,
    `### 技术要点`,
    `- 关键技术1`,
    `- 关键技术2`,
    ``,
    `### 验证结果`,
    `- 测试结果1`,
    `- 测试结果2`,
    ``,
    `**任务摘要：** <请在此处填写20-50字的任务摘要>`,
    ``
  ]
}

/**
 * 导出任务为 Markdown 格式
 */
export function exportTaskToMarkdown(task: Task | TaskDetail, projectName?: string, options?: { includeComments?: boolean, comments?: any[] }): string {
  const { includeComments = false, comments = [] } = options || {}
  const lines: string[] = []

  // 添加项目信息（如果有）
  if (projectName) {
    lines.push(`# ${projectName} - 任务需求文档\n`)
  }

  // 添加AI指令
  lines.push(...generateAIGuidelines())

  lines.push(`## 任务列表\n`)
  lines.push(`共 1 个任务\n`)

  // 优先级标签
  const priorityLabel = getPriorityLabel(task.priority)
  lines.push(`### ${priorityLabel}\n`)

  // 添加任务 ID 作为隐藏元数据 (HTML 注释)
  lines.push(`<!-- task-id: ${task._id} -->`)
  lines.push(`#### 1. ${task.title}\n`)

  // 任务基本信息
  lines.push(`**状态：** ${getStatusLabel(task.status)}`)
  lines.push(`**优先级：** ${getPriorityText(task.priority)}`)
  if (task.tagIds && task.tagIds.length > 0) {
    lines.push(`**标签：** ${task.tagIds.join(', ')}`)
  }
  if (task.assigneeId) {
    lines.push(`**指派人：** ${task.assigneeId}`)
  }
  lines.push(`**创建时间：** ${formatDate(task.createdAt)}`)
  lines.push(`**更新时间：** ${formatDate(task.updatedAt)}`)
  lines.push('')

  // 任务需求
  lines.push(`**任务需求：**\n`)

  // 注入标签提示词（如果有）
  let taskContent = task.content || '暂无描述'

  if ('tags' in task && Array.isArray(task.tags) && task.tags.length > 0) {
    const tagPrompts = task.tags
      .filter((tag: any) => tag.prompt && tag.prompt.trim())
      .map((tag: any) => tag.prompt)

    if (tagPrompts.length > 0) {
      const promptSection = `**📌 标签提示词：**\n\n${tagPrompts.join('\n\n')}\n\n---\n\n`
      taskContent = promptSection + taskContent
    }
  }

  lines.push(taskContent)
  lines.push('')

  // 添加解决方案区域
  lines.push(...generateAISolutionTemplate())

  // 添加评论历史（如果选择了包含评论）
  if (includeComments && comments && comments.length > 0) {
    lines.push('---\n')
    lines.push('## 📝 评论历史\n')

    // 按类型分组评论
    const aiComments = comments.filter(c => c.type === 'ai_completion' || c.type === 'ai_revision')
    const userComments = comments.filter(c => c.type === 'user')
    const systemComments = comments.filter(c => c.type === 'system')

    // AI 完成记录
    if (aiComments.length > 0) {
      lines.push('### 🤖 AI 完成记录\n')
      aiComments.forEach((comment, index) => {
        lines.push(`#### AI 完成 ${index + 1} (${formatDate(comment.timestamp)})\n`)
        lines.push(`**摘要**: ${comment.summary || '无摘要'}\n`)
        lines.push(`**内容**: ${comment.content.length > 200 ? comment.content.substring(0, 200) + '...' : comment.content}\n`)
        lines.push(`**完整内容**: [查看完整内容](#ai-full-${index})\n`)
        lines.push('---\n')
      })
    }

    // 用户评论
    if (userComments.length > 0) {
      lines.push('### 👥 用户评论\n')
      userComments.forEach((comment, index) => {
        lines.push(`#### ${comment.user?.displayName || comment.user?.username || '未知用户'} (${formatDate(comment.timestamp)})\n`)
        lines.push(`${comment.content}\n`)
        lines.push('---\n')
      })
    }

    // 系统消息
    if (systemComments.length > 0) {
      lines.push('### 🔔 系统消息\n')
      systemComments.forEach(comment => {
        lines.push(`**${formatDate(comment.timestamp)}**: ${comment.content}\n`)
      })
      lines.push('---\n')
    }

    // AI 完整内容附录
    if (aiComments.length > 0) {
      lines.push('## 📎 附录：AI 完成完整内容\n')
      aiComments.forEach((comment, index) => {
        lines.push(`<a id="ai-full-${index}"></a>`)
        lines.push(`### AI 完成 ${index + 1} - 完整内容\n`)
        lines.push(`${comment.content}\n`)
        lines.push('---\n')
      })
    }
  }

  lines.push('---\n')

  // 添加页脚
  lines.push(`\n> 📅 导出时间：${formatDate(Date.now())}`)
  lines.push(`> 🤖 由 Task-Flow 生成`)
  if (includeComments && comments && comments.length > 0) {
    lines.push(`> 📝 包含 ${comments.length} 条评论`)
  }

  return lines.join('\n')
}

/**
 * 导出多个任务为 Markdown 格式
 */
export function exportTasksToMarkdown(tasks: (Task | TaskDetail)[], projectName?: string): string {
  if (tasks.length === 0) {
    return '# 暂无任务'
  }

  const lines: string[] = []

  // 添加项目信息
  if (projectName) {
    lines.push(`# ${projectName} - 任务需求文档\n`)
  }

  // 添加AI指令
  lines.push(...generateAIGuidelines())

  lines.push(`## 任务列表`)
  lines.push(`共 ${tasks.length} 个任务\n`)

  // 按优先级分组
  const tasksByPriority = {
    high: tasks.filter(task => task.priority === 'high'),
    medium: tasks.filter(task => task.priority === 'medium'),
    low: tasks.filter(task => task.priority === 'low')
  }

  // 生成任务列表
  Object.entries(tasksByPriority).forEach(([priority, priorityTasks]) => {
    if (priorityTasks.length === 0) return

    const priorityLabel = getPriorityLabel(priority)
    lines.push(`### ${priorityLabel}\n`)

    priorityTasks.forEach((task, index) => {
      // 添加任务 ID 作为隐藏元数据 (HTML 注释)
      lines.push(`<!-- task-id: ${task._id} -->`)
      lines.push(`#### ${index + 1}. ${task.title}\n`)

      // 任务基本信息
      lines.push(`**状态：** ${getStatusLabel(task.status)}`)
      lines.push(`**优先级：** ${getPriorityText(task.priority)}`)
      if (task.tagIds && task.tagIds.length > 0) {
        lines.push(`**标签：** ${task.tagIds.join(', ')}`)
      }
      if (task.assigneeId) {
        lines.push(`**指派人：** ${task.assigneeId}`)
      }
      lines.push(`**创建时间：** ${formatDate(task.createdAt)}`)
      lines.push(`**更新时间：** ${formatDate(task.updatedAt)}`)
      lines.push('')

      // 任务描述
      lines.push(`**任务需求：**\n`)

      // 注入标签提示词（如果有）
      let taskContent = task.content || '暂无描述'

      if ('tags' in task && Array.isArray(task.tags) && task.tags.length > 0) {
        const tagPrompts = task.tags
          .filter((tag: any) => tag.prompt && tag.prompt.trim())
          .map((tag: any) => tag.prompt)

        if (tagPrompts.length > 0) {
          const promptSection = `**📌 标签提示词：**\n\n${tagPrompts.join('\n\n')}\n\n---\n\n`
          taskContent = promptSection + taskContent
        }
      }

      lines.push(taskContent)
      lines.push('')

      // 添加解决方案区域
      lines.push(...generateAISolutionTemplate())
    })
  })

  // 添加页脚
  lines.push(`\n> 📅 导出时间：${formatDate(Date.now())}`)
  lines.push(`> 🤖 由 Task-Flow 生成`)

  return lines.join('\n')
}

/**
 * 统一的导入服务类
 */
class ImportService {
  /**
   * 自动识别并导入任务（JSON 或 Markdown）
   * @param content 导入内容
   * @param projectId 目标项目 ID
   * @returns 解析出的任务列表和导入格式
   */
  static autoImport(
    content: string,
    projectId: string
  ): { tasks: Array<Partial<Task>>; format: 'json' | 'markdown' } {
    // 先尝试解析为 JSON
    try {
      const tasks = importTasksFromJSON(content, projectId)
      return { tasks, format: 'json' }
    } catch (jsonError) {
      // JSON 解析失败，尝试 Markdown 解析
      try {
        const tasks = importTasksFromMarkdown(content, projectId)
        return { tasks, format: 'markdown' }
      } catch (mdError) {
        console.error('Both JSON and Markdown import failed:', { jsonError, mdError })
        throw new Error('导入失败：内容格式不正确（请使用 JSON 或 Markdown 格式）')
      }
    }
  }

  /**
   * 验证导入的任务数据
   * @param tasks 任务列表
   */
  static validateTasks(tasks: Array<Partial<Task>>): void {
    if (tasks.length === 0) {
      throw new Error('未能解析出任务，请检查格式')
    }
  }

  /**
   * 获取导入成功消息
   * @param format 导入格式
   * @param count 任务数量
   */
  static getSuccessMessage(format: 'json' | 'markdown', count: number): string {
    return `从 ${format.toUpperCase()} 导入 ${count} 个任务成功`
  }
}

/**
 * 从 JSON 导入任务
 * @param json JSON 文本（单个任务或任务数组）
 * @param projectId 目标项目 ID
 * @returns 解析出的任务列表
 */
export function importTasksFromJSON(
  json: string,
  projectId: string
): Array<Partial<Task>> {
  try {
    const parsed = JSON.parse(json)

    // 判断是单个任务还是任务数组
    const tasksData: TaskExportData[] = Array.isArray(parsed) ? parsed : [parsed]

    // 转换为 Task 对象，使用目标项目 ID，并过滤掉无效任务
    return tasksData
      .filter(taskData => {
        // 过滤掉 null、undefined
        if (!taskData) {
          console.warn('Skipping null/undefined task:', taskData)
          return false
        }
        // 如果有 _id，说明是更新现有任务，不需要 title
        // 如果没有 _id，说明是新建任务，必须有 title
        if (!taskData._id && !taskData.title) {
          console.warn('Skipping task without _id and title:', taskData)
          return false
        }
        return true
      })
      .map(taskData => ({
        _id: taskData._id,
        projectId: projectId, // 使用目标项目 ID
        title: taskData.title, // 可能为空（更新任务时）
        status: taskData.status,
        priority: taskData.priority,
        content: normalizeContent(taskData.content), // 处理换行符
        summary: normalizeContent(taskData.summary), // 处理换行符
        tagIds: taskData.tagIds,
        assigneeId: taskData.assigneeId,
        moduleIds: taskData.moduleIds,
        createdAt: taskData.createdAt,
        updatedAt: taskData.updatedAt
      }))
  } catch (error) {
    console.error('Failed to parse JSON:', error)
    throw new Error('JSON 格式错误，请检查数据格式')
  }
}

/**
 * 从 Markdown 导入任务
 * @param markdown Markdown 文本
 * @param projectId 目标项目 ID
 * @returns 解析出的任务列表
 */
export function importTasksFromMarkdown(
  markdown: string,
  projectId: string
): Array<Partial<Task>> {
  const tasks: Array<Partial<Task>> = []

  // 首先尝试基于 task-id 注释分割文本
  const taskIdRegex = /(?:^|\n)(?:#\s*)?<!--\s*task-id:\s*(\S+)\s*-->/g

  // 找到所有 task-id 及其位置
  const taskIdMatches: Array<{ id: string; index: number }> = []
  let match
  while ((match = taskIdRegex.exec(markdown)) !== null) {
    if (match[1]) {
      taskIdMatches.push({
        id: match[1],
        index: match.index
      })
    }
  }

  // 如果没有找到任何 task-id，使用标题分割方式
  if (taskIdMatches.length === 0) {
    return importTasksFromMarkdownLegacy(markdown, projectId)
  }

  // 按 task-id 分割并解析每个任务
  for (let i = 0; i < taskIdMatches.length; i++) {
    const currentMatch = taskIdMatches[i]
    const nextMatch = taskIdMatches[i + 1]

    if (!currentMatch) continue

    // 提取当前任务的内容（从当前 task-id 到下一个 task-id 或文本结尾）
    const taskContent = markdown.substring(
      currentMatch.index,
      nextMatch ? nextMatch.index : markdown.length
    )

    // 解析单个任务
    const task = parseSingleTask(taskContent, projectId, currentMatch.id)
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
  taskId: string
): Pick<Task, 'projectId' | 'title' | 'content' | 'status' | 'priority'> & Partial<Task> | null {
  const lines = content.split('\n')

  const task: Pick<Task, 'projectId' | 'title' | 'content' | 'status' | 'priority'> & Partial<Task> = {
    // 保存 task-id 用于更新已存在的任务
    _id: taskId,
    projectId,
    title: '',
    content: '',
    status: 'todo',
    priority: 'medium',
    tagIds: [],
    summary: '', // 任务摘要
  }

  let currentSection: 'description' | null = null

  for (const line of lines) {
    const trimmedLine = line.trim()

    // 跳过 task-id 注释行
    if (trimmedLine.includes('<!-- task-id:')) {
      continue
    }

    // 提取任务标题 (支持 #### N. 标题 或 #### 标题)
    const titleMatch = trimmedLine.match(/^####\s*(?:\d+\.\s*)?(.+)$/)
    if (titleMatch && titleMatch[1] && !task.title) {
      task.title = titleMatch[1].trim()
      continue
    }

    // 先检查是否是任务摘要（摘要可能在任务描述之前或之后）
    const summaryMatch = trimmedLine.match(/^\*\*任务摘要：?\*\*\s*(.+)$/)
    if (summaryMatch && summaryMatch[1]) {
      task.summary = summaryMatch[1].trim()
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
      task.tagIds = tagsText.split(',').map(t => t.trim()).filter(t => t)
    } else if (trimmedLine.startsWith('**指派人：**')) {
      const assigneeText = trimmedLine.replace('**指派人：**', '').trim()
      task.assigneeId = assigneeText
    } else if (trimmedLine.startsWith('**任务描述：**')) {
      currentSection = 'description'
    } else if (trimmedLine === '---' || trimmedLine.startsWith('###') || trimmedLine.startsWith('>')) {
      // 任务结束或新的小节开始
      currentSection = null
    } else if (currentSection === 'description' && trimmedLine && !trimmedLine.startsWith('**')) {
      // 在任务描述部分，添加非属性行到描述
      task.content += (task.content ? '\n' : '') + trimmedLine
    }
  }

  return task
}

/**
 * 从 Markdown 中解析 AI 解决方案内容
 */
export function parseAISolution(markdown: string): { summary: string, content: string } | null {
  const lines = markdown.split('\n')

  // 查找 AI 解决方案部分
  let solutionStart = -1
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line && line.match && line.match(/^## 🛠️ AI 解决方案/)) {
      solutionStart = i + 1
      break
    }
  }

  if (solutionStart === -1) {
    return null
  }

  // 收集解决方案内容
  const solutionLines: string[] = []
  let summary = ''

  for (let i = solutionStart; i < lines.length; i++) {
    const line = lines[i]
    if (!line) continue

    // 停止条件：遇到下一个主要标题
    if (line.match(/^## /) && !line.match(/^## 🛠️ AI 解决方案/)) {
      break
    }

    // 查找任务摘要
    const summaryMatch = line.match(/\*\*任务摘要：\*\*\s*(.+)$/)
    if (summaryMatch && summaryMatch[1]) {
      summary = summaryMatch[1].trim()
      continue
    }

    solutionLines.push(line)
  }

  if (solutionLines.length === 0) {
    return null
  }

  // 清理内容：移除模板占位符
  let content = solutionLines.join('\n')
    .replace(/请在此处提供详细的实现方案：\s*\n/g, '')
    .replace(/### 实现步骤\s*\n1\. 分析任务需求\s*\n2\. 设计技术方案\s*\n3\. 具体实现步骤\s*\n4\. 验证和测试\s*\n/g, '')
    .replace(/### 修改的文件\s*\n- 文件路径1\s*\n- 文件路径2\s*\n/g, '')
    .replace(/### 技术要点\s*\n- 关键技术1\s*\n- 关键技术2\s*\n/g, '')
    .replace(/### 验证结果\s*\n- 测试结果1\s*\n- 测试结果2\s*\n/g, '')
    .replace(/<请在此处填写20-50字的任务摘要>/g, '')
    .trim()

  return {
    summary: summary || generateSummary(content),
    content
  }
}

/**
 * 生成内容摘要
 */
function generateSummary(content: string): string {
  if (!content) return ''

  // 简单的摘要生成逻辑
  const sentences = content.split(/[。！？.!?]/).filter(s => s && s.trim().length > 0)
  if (sentences.length === 0) {
    return content.substring(0, 50) + (content.length > 50 ? '...' : '')
  }

  // 取第一句话，如果太长则截取
  const firstSentence = sentences[0]
  if (!firstSentence) {
    return content.substring(0, 50) + (content.length > 50 ? '...' : '')
  }

  let summary = firstSentence.trim()
  if (summary.length > 50) {
    summary = summary.substring(0, 47) + '...'
  }

  return summary
}

/**
 * 旧版导入方法（基于标题分割）- 作为降级方案
 */
function importTasksFromMarkdownLegacy(
  markdown: string,
  projectId: string
): Array<Partial<Task>> {
  const tasks: Array<Partial<Task>> = []
  const lines = markdown.split('\n')

  let currentTask: Partial<Task> | null = null
  let currentSection: 'description' | null = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!line) continue
    const trimmedLine = line.trim()

    // 检测任务标题 (#### 1. 标题 或 #### 标题)
    const titleMatch = trimmedLine.match(/^####\s*(?:\d+\.\s*)?(.+)$/)
    if (titleMatch && titleMatch[1]) {
      // 保存上一个任务
      if (currentTask && currentTask.title) {
        tasks.push(currentTask)
      }

      // 创建新任务
      currentTask = {
        projectId,
        title: titleMatch[1].trim(),
        content: '',
        status: 'todo',
        priority: 'medium',
        tagIds: [],
      }
      currentSection = null
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
      currentTask.tagIds = tagsText.split(',').map(t => t.trim()).filter(t => t)
    } else if (line.startsWith('**指派人：**')) {
      const assigneeText = line.replace('**指派人：**', '').trim()
      currentTask.assigneeId = assigneeText
    } else if (line.startsWith('**任务描述：**')) {
      currentSection = 'description'
    } else if (line === '---' || line.startsWith('###') || line.startsWith('>')) {
      // 任务结束标记
      currentSection = null
    } else if (currentSection === 'description' && line && !line.startsWith('**')) {
      // 添加内容到描述
      currentTask.content += (currentTask.content ? '\n' : '') + line
    }
  }

  // 保存最后一个任务
  if (currentTask && currentTask.title) {
    tasks.push(currentTask)
  }

  return tasks
}

/**
 * 获取状态标签
 */
function getStatusLabel(status: string): string {
  const statusLabels: Record<string, string> = {
    todo: '待办',
    in_progress: '进行中',
    review: '待验收',
    completed: '已完成',
  }
  return statusLabels[status] || status
}

/**
 * 获取优先级文本
 */
function getPriorityText(priority: string): string {
  const priorityLabels: Record<string, string> = {
    low: '低',
    medium: '中',
    high: '高',
  }
  return priorityLabels[priority] || priority
}

/**
 * 获取优先级标签（带emoji）
 */
function getPriorityLabel(priority: string): string {
  const priorityLabels: Record<string, string> = {
    high: '🟠 高优先级',
    medium: '🟡 中优先级',
    low: '🟢 低优先级',
  }
  return priorityLabels[priority] || '🟡 中优先级'
}

/**
 * 从状态标签解析状态值
 */
function parseStatusFromLabel(label: string): Task['status'] {
  const statusMap: Record<string, Task['status']> = {
    '待办': 'todo',
    '进行中': 'in_progress',
    '待验收': 'review',
    '已完成': 'completed',
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
  }
  return priorityMap[label] || 'medium'
}

/**
 * 格式化日期
 */
export function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
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
 * 从剪贴板读取文本
 */
export async function readFromClipboard(): Promise<string | null> {
  try {
    // 尝试使用现代 Clipboard API
    if (navigator.clipboard && navigator.clipboard.readText) {
      return await navigator.clipboard.readText()
    }

    // 降级方案：需要用户手动粘贴
    return null
  } catch (error) {
    console.error('Failed to read from clipboard:', error)
    return null
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

// 导出ImportService类
export { ImportService }
