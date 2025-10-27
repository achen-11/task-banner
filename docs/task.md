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
5. **返回格式**：保持 Markdown 格式不变，返回完整的文档内容

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

共 2 个任务

### 🟡 中优先级

<!-- task-id: ebc745a8-9ed6-4ff2-8a0c-51a51473cbf6 -->
#### 1. 新增状态

**任务摘要：** 为任务新增 review（待验收）状态，用于 AI 完成任务后等待测试验收，并完整适配前后端所有相关位置

**状态：** 已完成
**优先级：** 中
**指派人：** 311caa24-691f-4c5b-b5c4-60390dd0c360
**创建时间：** 2025/10/27 10:14:40
**更新时间：** 2025/10/27 10:14:40

**任务描述：**

- [x] 任务新增一个 review 状态, 用于表示 ai 完成任务后等待测试验收
- [x] 任务列表, 任务详情都需要做适配, 你自己注意要修改的地方, 不要有的地方支持, 有的地方不支持

**实现细节：**
- 修改文件：
  - 前端类型：`frontend/src/types/task.ts`（Task、CreateTaskParams、UpdateTaskParams 接口）
  - 前端组件：`frontend/src/components/task/TaskBasicInfo.vue`（状态选择器）
  - 导出工具：`frontend/src/utils/export.ts`（getStatusLabel、parseStatusFromLabel）
  - 后端服务：`kb-task/src/code/Services/task.ts`（状态排序逻辑）
- 技术要点：
  - 状态值：'review'，显示标签：'待验收'
  - 状态排序顺序：todo(1) > in_progress(2) > review(3) > completed(4)
  - 所有涉及状态类型定义、选择器、显示、导出、排序的位置都已适配

---

<!-- task-id: 5f42188b-e92b-40f6-b356-8b61bd8cb21c -->
#### 2. 列表视图优化

**任务摘要：** 重构用户信息返回结构为嵌套对象，将 assignee 和 creator 信息封装为独立的 JSON 对象，提供 displayName、username、email 字段

**状态：** 已完成
**优先级：** 中
**指派人：** 311caa24-691f-4c5b-b5c4-60390dd0c360
**创建时间：** 2025/10/27 09:33:42
**更新时间：** 2025/10/27 10:15:08

**任务描述：**

- [x] 我看到你完成了一些修改, 但基本没有实现我想要的效果
- [x] 1. 我要的是指派人的用户信息, 而不是 creator, 当然, 获取了 creator 的信息也没关系
- [x] 2.creator 和指派人的信息都要再一层 json 包裹, 比如 items: [{title: xxx, creator: {displayName: xxx}}]这样子

**实现细节：**
- 修改文件：
  - 后端服务：`kb-task/src/code/Services/task.ts`（TaskInfo 接口、getProjectTasks 函数）
  - 前端类型：`frontend/src/types/task.ts`（Task 接口）
  - 前端组件：`frontend/src/components/project/ProjectTaskList.vue`、`frontend/src/views/MyTasks.vue`
  - 导出工具：`frontend/src/utils/export.ts`
- 结构变更：
  - 之前：`assigneeDisplayName`, `assigneeUsername`, `assigneeEmail` 等扁平字段
  - 现在：`assignee: { displayName, username, email }`，`creator: { displayName, username, email }`
- 技术要点：
  - 后端在 getProjectTasks 中使用 getUserById 填充嵌套的用户信息对象
  - 前端使用可选链访问：`task.assignee?.displayName || task.assignee?.username || task.assignee?.email`
  - 保持向后兼容，同时支持 assigneeId 字段

---


> 📅 导出时间：2025/10/27 10:15:20
> 🤖 由 Task-Flow 生成