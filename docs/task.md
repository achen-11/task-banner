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

### 🟡 中优先级

<!-- task-id: 366901e7-b116-4a8a-afca-5c9566b4844f -->
#### 1. 任务活动历史

**状态：** 已完成
**优先级：** 中
**创建时间：** 2025/10/26 15:16:17
**更新时间：** 2025/10/26 16:30:00

**任务描述：**

- [x] 完成活动历史的api, 然后接入到前端

**实现细节：**
- 后端添加了 `/api/task/activities` 和 `/api/task/comment` API
- 整合了 TaskComment 和 TaskHistory 模型数据
- 前端 TaskActivity 组件集成了真实 API，替换了 mock 数据
- 支持查看评论和字段变更历史
- 支持添加新评论

**修改文件：**
- backend/src/api/task.ts: 添加 activities 和 comment 接口
- frontend/src/api/task.ts: 添加 getTaskActivities 和 addTaskComment 函数
- frontend/src/components/task/TaskActivity.vue: 集成 API 调用

---

<!-- task-id: 61b9f6c8-e260-4474-9028-3049c6366c43 -->
#### 2. 未保存任务 bug

**状态：** 已完成
**优先级：** 中
**创建时间：** 2025/10/26 15:24:42
**更新时间：** 2025/10/26 16:15:00

**任务描述：**

- [x] 任务未保存时, 按下 esc, 会通过 alert 询问是否保存, 然后会被认为一直按住 esc, 导致触发浏览器的长按 esc 行为(退出全屏), 这是不对的
- [x] 取消 alert, 使用 elmentplus 的二次确认组件

**实现细节：**
- 导入 ElMessageBox 替代原生 confirm() 和 alert()
- ESC 键处理中使用异步确认对话框，避免浏览器误判长按 ESC
- 同时优化了删除任务的确认对话框

**修改文件：**
- frontend/src/components/TaskDetailDrawer.vue: 使用 ElMessageBox 替代 confirm
- frontend/src/components/task/TaskBasicInfo.vue: 使用 ElMessage 替代 alert

---

<!-- task-id: bbf0d796-7969-49c8-bd8c-4e7863d259eb -->
#### 3. 任务列表优化

**状态：** 已完成
**优先级：** 中
**创建时间：** 2025/10/26 15:26:21
**更新时间：** 2025/10/26 16:20:00

**任务描述：**

- [x] 支持点击表头根据字段排序
- [x] 添加默认排序: 待办任务在前, 然后根据最后更新时间降序

**实现细节：**
- 添加了排序状态管理（sortField 和 sortDirection）
- 实现了 sortedTasks 计算属性，支持多字段排序
- 表头添加点击事件和排序方向指示器（上下箭头）
- 默认排序：待办 > 进行中 > 已完成，同状态按更新时间降序
- 支持按 ID、标题、指派人、优先级、更新时间、状态排序

**修改文件：**
- frontend/src/components/project/ProjectTaskList.vue: 添加排序功能

---


> 📅 导出时间：2025/10/26 15:58:57
> 🤖 由 Task-Flow 生成