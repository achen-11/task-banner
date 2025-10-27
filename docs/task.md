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

<!-- task-id: a47cd076-99cd-4fb7-bb50-e15a2cb47eeb -->
#### 1. 任务列表-获取数据异常

**状态：** 已完成
**优先级：** 中
**创建时间：** 2025/10/27 23:05:55
**更新时间：** 2025/10/27 23:19:04

**任务描述：**

**任务摘要：** 修复了任务列表数据获取异常问题，移除前端重复排序逻辑，统一使用服务端排序，默认按状态优先、更新时间降序排列

**问题分析：**

由于前后端都存在排序逻辑，且 API handler 强制使用默认排序字段，导致数据获取异常和排序结果不一致。具体问题包括：

1. **双重排序冲突**
   - 后端在 `task.ts:333` 返回排序后的数据
   - 前端在 `ProjectTaskList.vue:318-384` 使用 `sortedTasks` 计算属性再次排序
   - 导致性能浪费和排序结果不可预测

2. **API handler 强制默认排序字段**（根本原因）
   - API handler 在 `src/api/task.ts:41` 使用了 `query.sortField || 'order'`
   - 即使前端不传 sortField，也会被强制设置为 'order'
   - 导致 Service 层的默认排序逻辑永远不会被触发

3. **默认排序不一致**
   - 后端默认：按 `order` 字段升序
   - 前端发送：`updatedAt` 作为默认排序字段
   - 前端计算属性：状态优先，然后按更新时间降序

4. **状态排序顺序不同**
   - 后端：`{ todo: 1, in_progress: 2, review: 3, completed: 4 }`
   - 前端：`{ todo: 0, in_progress: 1, completed: 2, review: 3 }`

**实施方案：**

### 1. 移除前端排序逻辑

**文件：** `frontend/src/components/project/ProjectTaskList.vue`

**变更 1：移除 `sortedTasks` 计算属性**（原 318-384 行）
- 删除了整个 `sortedTasks` computed 函数
- 该函数包含默认排序和自定义排序逻辑
- 前端不再进行任何客户端排序

**变更 2：模板直接使用 `tasks`**（127 行）
```vue
<!-- 之前 -->
<div v-for="task in sortedTasks" :key="task._id">

<!-- 之后 -->
<div v-for="task in tasks" :key="task._id">
```

**变更 3：修改 `toggleSort` 函数**（318-330 行）
```typescript
// 切换排序（重新加载数据）
const toggleSort = (field: string) => {
  if (sortField.value === field) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortDirection.value = 'asc'
  }
  // 重新加载任务以应用新的排序
  loadTasks()
}
```
- 用户点击列标题时，不再只改变本地状态
- 而是重新调用 `loadTasks()` 从服务端获取排序后的数据

**变更 4：修改 `loadTasks` 函数**（353 行）
```typescript
// 之前
sortField: sortField.value || 'updatedAt',

// 之后
sortField: sortField.value || undefined,
```
- 不再发送默认排序字段
- 当 `sortField` 为空时，让后端使用默认排序逻辑

### 2. 配置服务端默认排序

**文件：** `src/code/Services/task.ts`

**变更：重写 `sortTasks` 函数**（339-399 行）
```typescript
function sortTasks(tasks: TaskInfo[], sortField?: string, sortDirection?: string): TaskInfo[] {
  // 默认排序：先按状态，再按更新时间降序
  if (!sortField) {
    return tasks.sort((a, b) => {
      // 状态优先排序 (todo > in_progress > review > completed)
      const statusOrder: Record<string, number> = { todo: 1, in_progress: 2, review: 3, completed: 4 }
      const statusA = statusOrder[a.status] || 99
      const statusB = statusOrder[b.status] || 99

      if (statusA !== statusB) {
        return statusA - statusB
      }

      // 状态相同时，按更新时间降序
      return b.updatedAt - a.updatedAt
    })
  }

  // 其他排序逻辑保持不变
  // ...
}
```

**关键改进：**
- 当没有指定 `sortField` 时，使用新的默认排序
- 优先按状态排序：待办 → 进行中 → 评审 → 已完成
- 状态相同时，按更新时间降序（最新的在前）
- 符合任务管理的常见需求：优先显示待办任务

### 3. 修复 API handler 的默认排序问题（关键修复）

**文件：** `src/api/task.ts`

**变更：移除强制默认值**（41-43 行）
```typescript
// 之前
const sortField = query.sortField || 'order'
const sortDirection = query.sortDirection || 'asc'

// 之后
// 如果 sortField 为空，传递 undefined 让 Service 层使用默认排序
const sortField = query.sortField || undefined
const sortDirection = query.sortDirection
```

**问题根源：**
- API handler 会将空的 sortField 强制转换为 'order'
- 这导致 Service 层的 `sortTasks` 函数永远收不到 undefined
- 因此默认排序逻辑（状态+时间）从未被触发
- 系统一直按 order 字段排序，看起来像是按 ID 升序

**修复效果：**
- 现在 API handler 不再强制设置默认值
- 当前端不传 sortField 时，Service 层会收到 undefined
- 触发默认排序逻辑：状态优先，时间降序

### 技术要点

1. **单一数据源原则**
   - 排序逻辑只在服务端实现
   - 前端完全信任服务端返回的顺序
   - 避免客户端和服务端逻辑不一致

2. **按需加载**
   - 用户点击列标题时才重新请求数据
   - 利用后端排序能力，减少前端计算
   - 支持未来扩展（如数据库级别的排序优化）

3. **TypeScript 类型安全**
   - 修复了 `sortField: null` 与接口 `string | undefined` 不兼容的问题
   - 使用 `|| undefined` 将 `null` 转换为 `undefined`

4. **向后兼容**
   - 保留了用户自定义排序功能（点击列标题）
   - 只改变了默认排序行为
   - API 接口保持不变

5. **问题定位与调试**
   - 用户提供了请求 URL，帮助快速定位问题
   - 发现 API handler 层存在强制默认值的问题
   - 修复后端的三个层次：前端 → API handler → Service 层

### 验证结果

✅ **构建测试通过：**
```
✓ 3277 modules transformed
✓ built in 5.62s
```

✅ **功能完整性：**
- 🗑️ **移除前端排序**：删除 `sortedTasks` 计算属性和相关逻辑
- 🔄 **服务端排序**：`toggleSort` 触发数据重新加载
- 📊 **默认排序**：状态优先（todo → in_progress → review → completed），然后按更新时间降序
- 🎯 **自定义排序**：点击列标题仍可按指定字段排序
- 🔧 **API 修复**：移除 API handler 的强制默认值，确保默认排序逻辑正常触发

✅ **性能优化：**
- 避免了前端对大量数据的重复排序
- 服务端排序可以利用数据库索引
- 减少了客户端计算负担

✅ **问题彻底解决：**
- 修复了 API handler 层的逻辑问题
- 默认排序现在可以正常工作
- 不再显示为 ID 升序排序

---


> 📅 导出时间：2025/10/27 23:32:24
> 🤖 由 Task-Flow 生成
