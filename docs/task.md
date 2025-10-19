# Task-Banner - 任务需求文档

## 🤖 AI 协作指引

### 任务处理流程
1. **阅读任务**：仔细阅读下方的任务需求，理解每个任务的目标、技术要点和参考资料
2. **实现任务**：根据项目技术栈和任务描述完成开发
3. **保留元数据**：在返回结果时，务必保留每个任务的 task-id 注释（`<!-- task-id: xxx -->`）
4. **更新任务信息**：
   - 更新任务描述，补充实现细节
   - 如有修改文件，在技术要点中注明
   - 添加相关的参考链接（如果有）
5. **返回格式**：保持 Markdown 格式不变，返回完整的文档内容

### ⚠️ 重要提醒
- 必须保留所有 `<!-- task-id: xxx -->` 注释，这是任务回填的关键标识
- 保持 Markdown 结构完整，不要删除任何标题层级
- 任务完成后，可以在任务描述末尾添加实现说明

---

## 任务列表

共 3 个任务

### ✅ 已完成

<!-- task-id: 1760772643910-osnbu5p0i -->
#### 1. cmd+i 导入失败

**状态：** 已完成
**优先级：** 中
**创建时间：** 2025/10/18 15:30:43
**更新时间：** 2025/10/18 15:52:00

**任务描述：**

- [x] 修复 cmd+i 导入时的 DataCloneError 错误

**问题分析：**

复制整个 task.md 后执行 cmd+i 时会报错：
```
DataCloneError: Failed to execute 'put' on 'IDBObjectStore': [object Array] could not be cloned.
```

原因是 IndexedDB 无法序列化 Vue Proxy 对象。导入任务时，数组字段（tags、technicalPoints、changelog）仍被 Vue 的响应式 Proxy 包裹。

**实现方案：**

在 `src/views/Board.vue` 的导入逻辑中，对所有数组和对象字段进行深度克隆：

```typescript
// 更新现有任务时
const updatedTask: Task = {
  ...existingTask,
  // 深度克隆数组，避免 Vue Proxy 序列化问题
  tags: taskData.tags ? [...taskData.tags] : [...existingTask.tags],
  technicalPoints: taskData.technicalPoints ? [...taskData.technicalPoints] :
    (existingTask.technicalPoints ? [...existingTask.technicalPoints] : undefined),
  referenceLinks: taskData.referenceLinks ? [...taskData.referenceLinks] :
    (existingTask.referenceLinks ? [...existingTask.referenceLinks] : undefined),
  // 深度克隆 changelog
  changelog: existingTask.changelog ? existingTask.changelog.map(entry => ({
    timestamp: entry.timestamp,
    field: entry.field,
    oldValue: entry.oldValue,
    newValue: entry.newValue,
    action: entry.action
  })) : [],
  updatedAt: Date.now(),
}
```

**修改文件：**
- `src/views/Board.vue:270-340` - 导入逻辑深度克隆优化

---

<!-- task-id: 1760772681446-cpel358wt -->
#### 2. 任务列表-排序优化

**状态：** 已完成
**优先级：** 中
**创建时间：** 2025/10/18 15:31:21
**更新时间：** 2025/10/18 15:52:00

**任务描述：**

- [x] 列表视图默认按 待办任务在前的排序方式

**实现方案：**

在 `src/components/ListView.vue` 中修改默认排序配置：

```typescript
// 默认排序字段改为 status
const sortField = ref<'title' | 'status' | 'priority' | 'createdAt'>('status')
// 默认升序排列（待办任务在前）
const sortOrder = ref<'asc' | 'desc'>('asc')
```

状态排序顺序：待办 → 进行中 → 需优化 → 已发送AI → 已完成

**修改文件：**
- `src/components/ListView.vue:28-29` - 默认排序配置
- `src/components/ListView.vue:75-80` - 状态排序逻辑

---

<!-- task-id: 1760772753443-rkudi52ll -->
#### 3. 创建任务快捷键替换

**状态：** 已完成
**优先级：** 中
**标签：** 优化
**创建时间：** 2025/10/18 15:32:33
**更新时间：** 2025/10/18 15:52:00

**任务描述：**

- [x] 由 Cmd+N 替换为 Option+N（macOS）/ Alt+N（Windows）

**实现方案：**

在 `src/views/Board.vue` 的键盘事件处理中，将创建任务快捷键从 Cmd/Ctrl+N 改为 Option/Alt+N，避免与浏览器默认的"新建窗口"快捷键冲突：

```typescript
function handleKeyDown(event: KeyboardEvent) {
  // 创建任务 - 使用 Alt/Option + N
  if (event.altKey && event.key === 'n') {
    event.preventDefault()
    createTask()
  }
  // ... 其他快捷键
}
```

**修改文件：**
- `src/views/Board.vue:370-373` - 键盘快捷键处理逻辑

---


> 📅 导出时间：2025/10/18 15:52:00
> 🤖 由 Task Banner 生成