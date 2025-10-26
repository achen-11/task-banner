# 任务导入导出功能

## ✅ 已完成

- [x] 阅读 task-banner 下的代码, 将最核心的导入导出功能支持到我们这个系统中
- [x] 当有任务打开时, cmd+e 导出当前任务(复制到剪切板)
- [x] cmd+i 导入任务

## 📝 实现细节

### 1. 创建导入导出工具 (frontend/src/utils/export.ts)

**核心功能：**

1. **exportTaskToMarkdown(task, projectName?)** - 导出单个任务为 Markdown 格式
   - 包含 AI 协作指引
   - 包含 task-id 注释（用于回填）
   - 包含任务元数据（状态、优先级、标签、指派人、时间）
   - 适配我们系统的字段（content、tagIds、assigneeId 等）

2. **exportTasksToMarkdown(tasks[], projectName?)** - 批量导出任务
   - 按优先级分组
   - 支持多任务导出

3. **importTasksFromMarkdown(markdown, projectId)** - 从 Markdown 导入任务
   - 基于 task-id 注释分割任务（主要方式）
   - 降级方案：基于标题分割（兼容性）
   - 解析任务属性（状态、优先级、标签、指派人、描述）
   - 返回任务列表供创建

4. **辅助函数：**
   - `copyToClipboard(text)` - 复制到剪贴板
   - `readFromClipboard()` - 从剪贴板读取
   - `downloadAsFile(content, filename)` - 下载为文件

### 2. 在 TaskDetailDrawer 中集成功能

**快捷键：**
- `Cmd+E` / `Ctrl+E` - 导出当前任务到剪贴板
- `Cmd+I` / `Ctrl+I` - 从剪贴板导入任务

**UI 按钮：**
- 查看模式下显示「导出」和「导入」按钮
- 点击导出：复制 Markdown 到剪贴板并提示
- 点击导入：尝试读取剪贴板，失败则弹窗让用户手动粘贴

**导出流程：**
1. 用户按 `Cmd+E` 或点击「导出」按钮
2. 调用 `exportTaskToMarkdown()` 生成 Markdown
3. 调用 `copyToClipboard()` 复制到剪贴板
4. 显示成功提示

**导入流程：**
1. 用户按 `Cmd+I` 或点击「导入」按钮
2. 尝试调用 `readFromClipboard()` 读取剪贴板
3. 如果失败，使用 `prompt()` 让用户手动粘贴
4. 调用 `importTasksFromMarkdown()` 解析任务
5. 批量调用 `createTaskAPI()` 创建任务
6. 显示成功提示并刷新列表

## 🔄 Markdown 格式示例

```markdown
# 项目名 - 任务需求文档

## 🤖 AI 协作指引

### 任务处理流程
1. **阅读任务**：仔细阅读下方的任务需求
2. **实现任务**：根据项目技术栈完成开发
3. **保留元数据**：务必保留 task-id 注释
...

---

## 任务列表

共 1 个任务

### 🟡 中优先级

<!-- task-id: 1234567890-abc123 -->
#### 1. 实现用户登录功能

**状态：** 待办
**优先级：** 中
**标签：** 后端, 安全
**指派人：** 张三
**创建时间：** 2025/10/26 14:00:00
**更新时间：** 2025/10/26 14:00:00

**任务描述：**

实现基于 JWT 的用户登录功能，包括：
- 用户名密码验证
- Token 生成
- Token 验证中间件

---

> 📅 导出时间：2025/10/26 14:30:00
> 🤖 由 Task-Flow 生成
```

## 🎯 使用场景

1. **与 AI 协作**：导出任务到 Claude/ChatGPT，获取实现建议后导入更新
2. **任务备份**：导出重要任务到 Markdown 文件保存
3. **跨项目复制**：从一个项目导出任务，导入到另一个项目
4. **批量创建**：手写 Markdown 格式任务，批量导入

## 📂 修改的文件

- `frontend/src/utils/export.ts` - 新建，导入导出工具函数
- `frontend/src/components/TaskDetailDrawer.vue` - 集成导入导出功能
  - 添加 `handleExportTask()` 函数
  - 添加 `handleImportTask()` 函数
  - 添加 `importTaskFromMarkdown()` 函数
  - 添加 Cmd+E 和 Cmd+I 快捷键
  - 添加导出/导入按钮到工具栏