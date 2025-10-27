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
**更新时间：** 2025/10/27 23:24:07

**任务描述：**

**任务摘要：** 修复了多任务导入解析失败问题，实现了基于 _id 的智能更新/创建逻辑，支持只包含部分字段的任务更新

- [x] 1. 我发现导入竟然是新建..., 你要根据 _id 先判断呀
- [x] 2.阅读"docs/multiple-task.json", 检查为什么这个多任务导入会解析失败

**问题分析：**

用户反馈了两个关键问题：

1. **多任务导入解析失败**
   - 问题描述：导入 docs/multiple-task.json 时提示"未能解析出任务"
   - 根本原因：JSON 文件中的任务对象没有 title 字段
   - 旧逻辑：importTasksFromJSON 函数强制要求所有任务必须有 title (export.ts:330)
   - 导致结果：所有任务都被过滤掉，无法导入

2. **导入总是新建而非更新**
   - 问题描述：即使任务有 _id，导入时仍会创建新任务
   - 根本原因：只检查当前页面加载的任务列表 (ProjectTaskList.vue:525)
   - 局限性：tasks.value 只包含当前分页的任务（最多 20 个）
   - 导致结果：数据库中存在但未加载到当前页面的任务会被重复创建

**实施方案：**

### 1. 修复 JSON 解析逻辑

**文件：** `frontend/src/utils/export.ts`

**变更：优化任务验证逻辑**（328-355 行）
```typescript
// 之前：所有任务都必须有 title
if (!taskData || !taskData.title) {
  console.warn('Skipping invalid task:', taskData)
  return false
}

// 之后：区分新建和更新
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
```

**变更：移除默认值**（342-354 行）
```typescript
// 之前：强制添加默认值
status: taskData.status || 'todo',
priority: taskData.priority || 'medium',
content: taskData.content || '',

// 之后：保持原值（可能为 undefined）
status: taskData.status,
priority: taskData.priority,
content: taskData.content,
```

**设计理念：**
- 有 _id：更新任务，只修改提供的字段
- 无 _id：新建任务，title 必填，其他可选
- 支持部分更新：只传入需要修改的字段

### 2. 实现智能更新/创建逻辑

**文件：** `frontend/src/components/project/ProjectTaskList.vue`

**变更 1：添加 getTaskDetail 导入**（269 行）
```typescript
import {
  getTaskList,
  getTaskDetail,  // 新增
  createTask as createTaskAPI,
  updateTask as updateTaskAPI,
  deleteTask as deleteTaskAPI
} from '@/api/task'
```

**变更 2：重构 confirmImportTasks 函数**（510-601 行）
```typescript
const confirmImportTasks = async () => {
  // 处理每个任务，返回操作类型和结果
  const promises = finalTasks.map(async task => {
    // 如果有 _id，先检查任务是否存在
    if (task._id) {
      try {
        // 尝试获取任务详情，检查是否存在
        const existingTask = await getTaskDetail(task._id)

        // 任务存在，更新它
        const result = await updateTaskAPI({
          id: task._id!,
          title: task.title || existingTask.title,
          content: task.content !== undefined ? task.content : existingTask.content,
          status: task.status || existingTask.status,
          // ... 其他字段，保持现有值或使用新值
        })
        return { type: 'updated' as const, result }
      } catch (error: any) {
        // 任务不存在（404错误），创建新任务
        if (error?.response?.status === 404 || error?.message?.includes('not found')) {
          const result = await createTaskAPI({ /* ... */ })
          return { type: 'created' as const, result }
        }
        throw error
      }
    } else {
      // 没有 _id，直接创建新任务
      const result = await createTaskAPI({ /* ... */ })
      return { type: 'created' as const, result }
    }
  })

  const results = await Promise.all(promises)

  // 统计创建和更新的数量
  const createdCount = results.filter(r => r.type === 'created').length
  const updatedCount = results.filter(r => r.type === 'updated').length
}
```

**核心改进：**
1. **通过 API 验证**：调用 getTaskDetail 检查任务是否存在
2. **智能判断**：
   - 任务存在 → 更新
   - 任务不存在（404）→ 创建
   - 无 _id → 创建
3. **准确计数**：返回操作类型，最后统计创建/更新数量
4. **错误处理**：只捕获 404 错误，其他错误继续抛出

### 技术要点

1. **部分更新支持**
   - 移除 importTasksFromJSON 中的默认值
   - 保持字段原始值（undefined 表示不更新）
   - 在 confirmImportTasks 中使用 || 运算符合并值

2. **API 验证机制**
   - 使用 getTaskDetail 而不是本地列表
   - 可以检测所有数据库中的任务
   - 不受分页限制

3. **错误分类处理**
   - 404 错误：任务不存在，创建新任务
   - 其他错误：权限、网络等问题，抛出错误
   - 提供详细的日志输出

4. **并发安全**
   - 使用 Promise.all 并发执行
   - 返回结果包含操作类型
   - 避免竞态条件导致的计数错误

5. **用户体验**
   - 明确提示创建/更新的数量
   - 支持批量导入
   - 导入后自动刷新列表

### 验证结果

✅ **构建测试通过：**
```
✓ 3277 modules transformed
✓ built in 5.17s
```

✅ **功能完整性：**
- 🔍 **解析优化**：有 _id 的任务不需要 title 字段
- 🆔 **智能判断**：通过 API 检查任务是否存在
- ✏️ **智能更新**：存在则更新，不存在则创建
- 📊 **准确统计**：正确显示创建/更新数量
- 🔄 **部分更新**：支持只修改部分字段

✅ **multiple-task.json 测试：**
- ✅ 可以成功解析（不要求 title）
- ✅ 根据 _id 检测任务是否存在
- ✅ 存在的任务会被更新
- ✅ 不存在的任务会被创建

### 使用场景

**场景 1：批量更新任务状态**
```json
[
  {"_id": "task-1", "status": "completed"},
  {"_id": "task-2", "status": "in_progress"}
]
```
只更新状态，其他字段保持不变。

**场景 2：创建新任务**
```json
[
  {"title": "新任务 1", "priority": "high"},
  {"title": "新任务 2", "status": "todo"}
]
```
没有 _id，会创建新任务。

**场景 3：混合导入**
```json
[
  {"_id": "task-1", "status": "completed"},
  {"title": "新任务", "priority": "high"}
]
```
第一个更新，第二个创建。

---


> 📅 导出时间：2025/10/27 23:40:47
> 🤖 由 Task-Flow 生成
