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
6. **返回格式**：保持 Markdown 格式不变，返回完整的文档内容

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

### 🟠 高优先级

<!-- task-id: 0141518d-0b26-4c55-be3d-03d4c47c9972 -->
#### 1. 导入任务-信息缺失

**状态：** 已完成
**优先级：** 高
**创建时间：** 2025/10/27 18:30:18
**更新时间：** 2025/10/27 22:21:33

**任务描述：**

**任务摘要：** 实现了 JSON + Markdown 分离导出方案，导出两个文件，导入时优先从剪贴板读取 JSON，确保完整信息不丢失。

现在导入任务只会有原来的信息, 诸如实现方案, 等其他信息会被忽略掉
- [x] 考虑是否在任务完成后要求 ai 输出更加标准的数据(如 json), 这样比较不容易因为提示词改动而丢失信息
- [x] 如果同意上方的方案, 我们的 json 需要哪些数据

---

## 💬 讨论结果（已实施）

### 问题根源分析

**当前导入解析器**（`export.ts:269-337`）：
- ✅ 能解析：_id, title, status, priority, tagIds, assigneeId, summary
- ❌ 丢失信息：AI 添加的"实现方案"、"修改文件"、"技术要点"、"验证结果"等章节

**原因**：
1. 解析器只识别 `**字段名：**` 格式的固定字段
2. 自由格式的章节标题（`### 修改文件`）没有结构化解析
3. 遇到 `---` 分隔符后的内容被截断

### 方案对比

#### 方案 A：增强 Markdown 解析 ⭐⭐⭐

**思路**：改进解析器，识别约定的章节格式（如 `### 修改文件`）

**优点**：兼容现有格式，无需大改
**缺点**：依赖严格约定，提示词改动易导致解析失败，扩展性差

**评估**：短期可行但不稳定

---

#### 方案 B：JSON + Markdown 混合 ⭐⭐⭐⭐⭐（推荐）

**思路**：使用 HTML 注释存储 JSON 结构化数据，同时保留 Markdown 可读性

**格式示例**：
```markdown
<!-- task-id: xxx -->
<!-- task-data: {"_id":"xxx","status":"completed","summary":"任务摘要","implementation":{"modifiedFiles":[...],"techPoints":[...]}} -->
#### 1. 任务标题

[人类可读的详细说明]
```

**优点**：
- ✅ 结构化数据，解析稳定可靠
- ✅ 不受提示词变化影响
- ✅ 易于扩展新字段
- ✅ 保留 Markdown 优势（可读性、Git diff）
- ✅ 向后兼容（可降级到 Markdown 解析）

**缺点**：
- ⚠️ 需要修改导入导出逻辑
- ⚠️ 需要更新 AI 提示词

**JSON 数据结构**：
```typescript
interface TaskExportData {
  // 核心字段
  _id: string
  projectId: string
  title: string
  status: 'todo' | 'in_progress' | 'completed' | 'review'
  priority: 'low' | 'medium' | 'high'
  content: string

  // 可选字段
  summary?: string
  tagIds?: string[]
  assigneeId?: string
  moduleIds?: string[]

  // 完成信息（AI 填充）
  implementation?: {
    modifiedFiles?: Array<{
      path: string        // 文件路径
      changes: string     // 修改说明
    }>
    techPoints?: string[] // 技术要点
    testResult?: string   // 测试结果
  }

  // 时间戳
  createdAt: number
  updatedAt: number
}
```

**实施步骤**：
1. Phase 1（1-2天）：定义接口，修改导入导出函数
2. Phase 2（1天）：更新 AI 提示词，添加 JSON 输出要求
3. Phase 3（1-2天）：测试和优化，处理特殊字符转义

---

#### 方案 C：纯 JSON 导出 ⭐⭐

**思路**：完全放弃 Markdown，使用 JSON 文件

**优点**：100% 可靠，易于扩展
**缺点**：失去可读性，Git diff 不友好，AI 无法理解上下文

**评估**：不推荐

---

### 推荐方案：方案 B

**理由**：
- 兼顾结构化数据和可读性
- 解析稳定，不受提示词影响
- 保留 Markdown 优势
- 向后兼容

**核心设计**：
- **JSON 注释**：程序导入使用，包含所有结构化数据
- **Markdown 文本**：人类阅读和 AI 理解，保留详细说明

**潜在问题和解决方案**：

1. **JSON 特殊字符**：使用 `JSON.stringify` 自动转义，`JSON.parse` 自动还原
2. **AI 生成错误**：提供详细示例，实现降级机制（JSON 失败 → Markdown 解析）
3. **JSON 过长**：只存储必要字段，长文本仍放在 Markdown 中

**实施成本**：约 3-5 天，风险可控

---

### 📄 详细分析文档

完整的方案对比、实施步骤、代码示例请查看：
`/private/tmp/task-flow-temp/task-import-export-discussion.md`

### 🤔 待决策

- [x] 是否采用 JSON + Markdown 混合方案？
  - [x] 采纳, 但我们不混合在一起, 而是分开存储, 导出时保持 md, 提示词中提示 ai 分别生成 json 和 md,
  - [x] md 供 review 和阅读, json 则用于导入
- [x] JSON 结构是否需要调整？
  - [x] 需要的, 很多额外的信息其实都是存在 content 中的 (你举的例子中的implementation其实也是在 content 中的)
- [x] 何时开始实施？
  - [x] 立即实施

---

## ✅ 实施结果

### 核心实现

**方案**：JSON + Markdown 分离导出，不混合在一起

**特点**：
- ✅ 导出时生成两个独立文件（JSON 和 Markdown）
- ✅ JSON 用于程序导入，确保数据完整
- ✅ Markdown 供人类阅读和 review
- ✅ 导入时智能识别格式（优先 JSON，降级到 Markdown）

### 修改文件

**1. `frontend/src/utils/export.ts`**

**新增接口和函数**：
```typescript
// TaskExportData 接口（简化版）
interface TaskExportData {
  _id: string
  projectId: string
  title: string
  status: 'todo' | 'in_progress' | 'completed' | 'review'
  priority: 'low' | 'medium' | 'high'
  content: string  // 包含所有详细信息
  summary?: string
  tagIds?: string[]
  assigneeId?: string
  moduleIds?: string[]
  createdAt: number
  updatedAt: number
}

// JSON 导出
exportTaskToJSON(task): string
exportTasksToJSON(tasks): string

// JSON 导入
importTasksFromJSON(json, projectId): Task[]
```

**AI 提示词更新**（第 6 步）：
```markdown
6. **返回格式**：⚠️ **重要！必须同时输出 JSON 和 Markdown**
   - 第一部分：生成 JSON 数据块（用于程序导入）
   - 第二部分：返回完整的 Markdown 文档（供人类阅读）
   - 注意：content 字段需要使用 \n 表示换行，使用 \" 转义引号
```

**2. `frontend/src/components/TaskDetailDrawer.vue`**

**导出逻辑**（`handleExportTask`）：
- 清理文件名非法字符
- 导出 JSON 文件：`task-标题-日期.json`
- 导出 Markdown 文件：`task-标题-日期.md`
- 使用 `downloadAsFile` 函数下载

**导入逻辑**（`handleImportTask` + `importTask`）：
- 从剪贴板读取内容
- 优先尝试解析 JSON
- JSON 失败则降级到 Markdown 解析
- 自动识别格式，用户无需选择

**新增函数**：
```typescript
// 自动识别并导入（JSON 或 Markdown）
importTask(content: string)

// 统一的任务处理逻辑
processImportedTasks(tasks: Task[])
```

### 技术要点

1. **JSON 结构简化**
   - 所有详细信息都放在 `content` 字段
   - 不使用嵌套的 `implementation` 对象
   - 结构扁平，易于序列化

2. **文件命名规范**
   - 格式：`task-{清理后的标题}-{日期}.{扩展名}`
   - 清理非法字符：`/\:*?"<>|` → `-`
   - 日期格式：YYYY-MM-DD

3. **智能导入识别**
   - Try-Catch 机制：先 JSON，失败则 Markdown
   - 无需用户手动选择格式
   - 两种格式都支持，确保向后兼容

4. **错误处理**
   - JSON 解析失败提示明确错误
   - 降级机制确保最大兼容性
   - 清晰的用户提示信息

### 验证结果

✅ **构建测试通过**：
```
✓ 3277 modules transformed
✓ built in 5.08s
```

✅ **功能完整性**：
- 🔄 **导出**：Cmd+E 生成两个文件
- 📥 **导入**：Cmd+I 从剪贴板读取 JSON
- 🔀 **兼容性**：支持 JSON 和 Markdown 两种格式
- 🤖 **AI 引导**：提示词要求输出结构化 JSON

### 使用示例

**导出**：
1. 打开任务详情
2. 按 Cmd+E 或点击导出按钮
3. 浏览器下载两个文件：
   - `task-标签功能-2025-10-27.json`
   - `task-标签功能-2025-10-27.md`

**导入**：
1. 复制 JSON 文件内容到剪贴板
2. 打开项目
3. 按 Cmd+I 或点击导入按钮
4. 自动识别格式并导入

**AI 完成任务后的输出格式**：
```markdown
## 任务更新

### JSON 数据（用于导入）
```json
{
  "_id": "xxx",
  "status": "completed",
  "summary": "实现了 XXX 功能",
  "content": "**实现方案：**\n\n### 修改文件\n1. src/xxx.vue\n..."
}
```

### Markdown 文档（供阅读）
#### 1. 任务标题
**任务摘要：** 实现了 XXX 功能
...
```

### 后续优化建议

1. **JSON Schema 验证**：添加 JSON 格式验证，提前检测错误
2. **批量导入**：支持导入多个任务的 JSON 数组
3. **导出选项**：允许用户选择只导出 JSON 或只导出 Markdown
4. **预览功能**：导入前预览将要创建/更新的任务

---


> 📅 更新时间：2025/10/27 22:21:33
> 🤖 由 Task-Flow 生成