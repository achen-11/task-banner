# Task-FLow - 任务需求文档

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

共 2 个任务

### 🟡 中优先级

<!-- task-id: 1761455447956-lb16l50pt -->
#### 1. 创建任务流程优化

**状态：** 已完成
**优先级：** 中
**创建时间：** 2025/10/26 13:10:47
**更新时间：** 2025/10/26 14:30:00

**任务描述：**

- [x] 现在创建流程会先通过 alert 弹窗, 取消这个流程
- [x] 点击创建时打开抽屉(创建模式)
- [x] 打开时自动聚焦到标题
- [x] 支持"N"快捷键快捷创建
- [x] cmd + s 保存任务
- [x] 保存/未保存状态提示

**实现细节：**

1. **ProjectTaskList.vue 修改**：
   - 添加 `drawerMode` 状态（'view' | 'create'）
   - 重构 `handleCreateTask()` 函数，移除 prompt，直接打开创建模式抽屉
   - 添加 `handleTaskCreated()` 处理任务创建完成事件
   - 实现 N 快捷键监听（避免在输入框中触发）
   - 传递 `mode` 和 `projectId` 给 TaskDetailDrawer

2. **TaskDetailDrawer.vue 重大更新**：
   - 添加 `mode` prop（'view' | 'create'）
   - 添加 `titleInputRef` 标题输入框引用
   - 添加 `newTaskData` 存储创建模式下的任务数据
   - 添加 `isSaved` 和 `isSaving` 状态管理
   - 修改 `currentTask` computed，创建模式返回 newTaskData
   - 实现 `handleSaveTask()` 函数（cmd+s 触发）
   - 修改 `handleTaskUpdate()`，创建模式下只更新本地数据并标记未保存
   - watch 抽屉打开事件，创建模式下自动聚焦标题并重置数据
   - 更新 UI：显示"新建任务"标签、保存状态指示、保存按钮
   - 隐藏创建模式下的任务导航按钮
   - Esc 关闭时检查未保存状态并提示

3. **修改文件**：
   - frontend/src/components/project/ProjectTaskList.vue
   - frontend/src/components/TaskDetailDrawer.vue

---

<!-- task-id: 1761455916589-bgeia70cx -->
#### 2. 日期类型默认值问题

**状态：** 已完成
**优先级：** 中
**创建时间：** 2025/10/26 13:18:36
**更新时间：** 2025/10/26 14:30:00

**任务描述：**

- [x] timestamp 没有值时默认为空就好, 为 0 会导致ksqlite 报错
- [x] 我手动修复了 task 的 dueDate 字段, 你检查其他 model 有没有这个问题

**实现细节：**

1. **检查结果**：
   - 已检查所有 Models 中的 Timestamp 字段
   - Task.dueDate - 已正确修复（无 default 值）
   - TaskHistory.createdAt - 使用 `default: () => Date.now()`（正确）
   - Notification.createdAt - 使用 `default: () => Date.now()`（正确）
   - ProjectMember.joinedAt - 使用 `default: () => Date.now()`（正确）

2. **结论**：
   - 所有 Timestamp 字段都已正确配置
   - 没有使用 `default: 0` 的 Timestamp 字段
   - `default: 0` 只用于 Number 类型字段（如 progress, order）
   - 不需要额外修改

---


> 📅 导出时间：2025/10/26 14:30:00
> 🤖 由 Claude Code 完成