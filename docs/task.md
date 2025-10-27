## 🤖 AI 协作指引

### 任务处理流程
1. **阅读任务**：仔细阅读下方的任务需求，理解每个任务的目标、技术要点和参考资料
2. **实现任务**：根据项目技术栈和任务描述完成开发
3. **保留元数据**：在返回结果时，务必保留每个任务的 task-id 注释（`<!-- task-id: xxx -->`）
4. **更新任务信息**：
   - 将任务状态更新为「已完成」
   - **添加任务摘要**：在任务描述开头添加 `**任务摘要：** <一句话总结>`
   - 补充实现细节（修改文件、技术要点等）
   - 如有修改文件，在技术要点中注明
5. **发送完成通知**：⚠️ **重要！必须执行！**
   - 使用命令：`bash /Users/achen/Priv/task-banner/.claude-notify.sh "标题" "描述"`
   - 标题：简短的任务完成说明（如：✅ XXX 功能完成）
   - 描述：一句话总结完成的内容
6. **生成文件**：⚠️ **重要！必须使用 Write 工具生成文件**
   - 使用 Write 工具生成 `/Users/achen/Priv/task-banner/docs/task.json` 文件
     - 格式：单个任务用对象，多个任务用数组
     - 示例（单任务）：
       ```json
       {
         "_id": "任务ID",
         "status": "completed",
         "summary": "任务摘要（20-50字）",
         "content": "完整的任务内容，包含实现方案、修改文件、技术要点、验证结果等所有信息"
       }
       ```
     - 示例（多任务）：使用 JSON 数组 `[{...}, {...}]`
   - 使用 Write 工具生成 `/Users/achen/Priv/task-banner/docs/task.md` 文件
     - 格式：完整的 Markdown 文档（包含 AI 协作指引 + 任务列表）
     - 必须保留所有 `<!-- task-id: xxx -->` 注释
   - 注意：content 字段需要使用 \n 表示换行，使用 \" 转义引号

### 📝 任务摘要编写规范
- **长度**：20-50 字
- **内容**：用一句话概括完成了什么，解决了什么问题
- **示例**：
  - ✅ "实现了用户登录功能，支持账号密码和第三方登录"
  - ✅ "修复了任务列表排序 bug，优化了性能"
  - ✅ "添加了任务导出功能，支持 Markdown 格式"
  - ❌ "将描述从 xxx 改为 xxx"（太粗暴）
  - ❌ "已在 Service 层实现..."（太技术化）

### ⚠️ 重要提醒
- 必须保留所有 `<!-- task-id: xxx -->` 注释，这是任务回填的关键标识
- 保持 Markdown 结构完整，不要删除任何标题层级
- 任务摘要必须简洁明了，便于快速理解任务变更内容

---

## 任务列表

共 1 个任务

### 🟡 中优先级

<!-- task-id: 10a36252-54bc-4cf3-b440-45d9e3398cc4 -->
#### 1. 导入任务-多任务导入

**状态：** 已完成
**优先级：** 中
**创建时间：** 2025/10/27 22:50:25
**更新时间：** 2025/10/27 23:05:00

**任务描述：**

**任务摘要：** 优化了导入导出功能，修复多任务导入问题，简化导出为复制到剪贴板，更新 AI 提示词生成文件

- [x] 1. 当传入数组时(多任务), 会警告未解析出任务
- [x] 2.优化提示词, 现在 ai 是会输出 json, 但不会生成文件, 我需要的文件, 可以是 task.md,task.json
- [x] 3.导出时不需要 json, 有 md 就够了, 另外不是文件, 而是复制到剪切板

**实施方案：**

### 核心实现

**功能优化**：
- ✅ 修复多任务 JSON 数组导入失败问题
- ✅ 优化 AI 提示词，要求使用 Write 工具生成文件
- ✅ 简化导出功能，只复制 Markdown 到剪贴板
- ✅ 添加任务验证和默认值处理

### 修改文件

**1. `frontend/src/utils/export.ts`**

**修复 importTasksFromJSON 函数**（316-354 行）：
```typescript
// 添加验证和过滤逻辑
return tasksData
  .filter(taskData => {
    // 过滤掉 null、undefined 或缺少标题的任务
    if (!taskData || !taskData.title) {
      console.warn('Skipping invalid task:', taskData)
      return false
    }
    return true
  })
  .map(taskData => ({
    _id: taskData._id,
    projectId: projectId,
    title: taskData.title,
    status: taskData.status || 'todo',  // 默认值
    priority: taskData.priority || 'medium',  // 默认值
    content: taskData.content || '',  // 默认值
    summary: taskData.summary,
    tagIds: taskData.tagIds || [],  // 默认值
    assigneeId: taskData.assigneeId,
    moduleIds: taskData.moduleIds || [],  // 默认值
    createdAt: taskData.createdAt || Date.now(),  // 默认值
    updatedAt: taskData.updatedAt || Date.now()  // 默认值
  }))
```

**更新 AI 提示词**（96-113 行和 206-223 行，两处相同修改）：
- 从"返回格式"改为"生成文件"
- 要求使用 Write 工具生成 `/Users/achen/Priv/task-banner/docs/task.json` 文件
- 要求使用 Write 工具生成 `/Users/achen/Priv/task-banner/docs/task.md` 文件
- 单任务用对象，多任务用数组
- 提供详细的格式示例

**2. `frontend/src/components/TaskDetailDrawer.vue`**

**简化导出功能**（322-343 行）：
```typescript
// 导出当前任务（复制 Markdown 到剪贴板）
const handleExportTask = async () => {
  if (!currentTask.value || !currentTask.value.title) {
    ElMessage.warning('没有可导出的任务')
    return
  }

  try {
    // 导出 Markdown 并复制到剪贴板
    const markdown = exportTaskToMarkdown(currentTask.value)
    const success = await copyToClipboard(markdown)

    if (success) {
      ElMessage.success('任务已导出到剪贴板')
    } else {
      ElMessage.error('复制失败，请重试')
    }
  } catch (error) {
    console.error('Export task error:', error)
    ElMessage.error('导出任务失败')
  }
}
```

**移除不必要的导入**（185 行）：
- 移除 `exportTaskToJSON`
- 移除 `downloadAsFile`

### 技术要点

1. **多任务导入修复**
   - 添加 filter 过滤无效任务
   - 验证任务对象和标题字段
   - 输出警告日志便于调试
   - 为所有可选字段添加默认值

2. **AI 提示词优化**
   - 明确要求使用 Write 工具
   - 指定文件路径：`/Users/achen/Priv/task-banner/docs/`
   - 区分单任务（对象）和多任务（数组）格式
   - 提供详细的 JSON 示例

3. **导出功能简化**
   - 移除 JSON 文件导出
   - 移除文件下载功能
   - 只保留 Markdown 复制到剪贴板
   - 简化用户操作流程

4. **错误处理**
   - 添加任务验证逻辑
   - 提供有意义的错误信息
   - 使用 console.warn 输出跳过的任务
   - 保证不会因个别任务失败而中断整个导入

### 验证结果

✅ **构建测试通过**：
```
✓ 3277 modules transformed
✓ built in 5.29s
```

✅ **功能完整性**：
- 🔧 **多任务导入**：支持 JSON 数组，过滤无效任务
- 📝 **AI 提示词**：要求生成 task.json 和 task.md 文件
- 📋 **简化导出**：只复制 Markdown 到剪贴板
- ✅ **默认值处理**：确保任务数据完整性

---


> 📅 导出时间：2025/10/27 23:05:00
> 🤖 由 Task-Flow 生成
