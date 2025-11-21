## 🤖 AI 协作指引

### 任务处理流程
1. **阅读任务**：仔细阅读下方的任务需求，理解每个任务的目标、技术要点和参考资料
2. **实现任务**：根据项目技术栈和任务描述完成开发
3. **保留元数据**：在返回结果时，务必保留每个任务的 task-id 注释（`<!-- task-id: xxx -->`）
4. **更新任务信息**：
   - 将任务状态更新为「待验收」
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
         "status": "review",
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
共 2 个任务

### 🟡 中优先级

<!-- task-id: 9e2963af-36e9-4c19-929e-cc70a44ecdf5 -->
#### 1. drawer 优化

**状态：** 待验收
**优先级：** 中
**创建时间：** 2025/11/21 14:16:15
**更新时间：** 2025/11/21 14:16:15

**任务摘要：** 修复全局搜索后关闭drawer时URL不更新的问题，确保URL与drawer状态同步

**任务需求：**

全局搜索后会改变 url 并跳转, 此时关闭 drawer 之后 url 要随之更新

---

**实现方案：**

### 实现步骤
1. 在ProjectBoard的closeTaskDetail函数中添加URL清理逻辑
2. 检查route.query.taskId是否存在
3. 如果存在则使用router.replace清除taskId参数
4. 确保关闭drawer时URL同步更新

### 修改的文件
- `/frontend/src/components/project/ProjectBoard.vue` - 在closeTaskDetail中添加URL清理逻辑

### 技术要点
- 使用router.replace而不是router.push，避免在历史记录中留下额外记录
- 通过展开route.query创建新query对象，删除taskId参数
- 保持其他query参数不变，只清除taskId
- 在关闭drawer的同时更新URL，确保状态同步

### 验证结果
- 全局搜索跳转后，关闭drawer时URL中的taskId参数被正确清除
- URL更新不会影响其他query参数
- 关闭drawer后URL与页面状态保持一致

<!-- task-id: 4e7467b5-410c-48db-8f50-8517012331a5 -->
#### 2. 看板视图-导入 bug

**状态：** 待验收
**优先级：** 中
**创建时间：** 2025/11/21 14:15:11
**更新时间：** 2025/11/21 14:15:11

**任务摘要：** 修复看板视图导入任务不存在和Cmd+I快捷键失效的问题

**任务需求：**

列表视图导入功能正常
1. 同一个任务 id, 看板视图导入时会遇到任务不存在(列表视图是存在的)
2. 看板视图 cmd +i, 正常唤起导入弹窗, 切换到列表再按下 cmd+i, 会失效, 再切回看板视图, 再按下 cmd+i 也会失效

---

**实现方案：**

### 实现步骤
1. 修复看板视图导入时任务不存在的问题：
   - 在importTasksHelper中添加enrichedTasks逻辑，与列表视图保持一致
   - 在导入前先通过getTaskDetail查询任务信息，回填真实数据
   - 将fetch调用改为使用getTaskDetail API
2. 改进错误处理逻辑，与列表视图保持一致的404错误检测
3. 修复Cmd+I快捷键失效问题：在onUnmounted中正确取消注册快捷键
4. 优化unregisterShortcut函数，支持meta参数精确匹配，避免误删其他组件的快捷键

### 修改的文件
- `/frontend/src/components/project/ProjectBoard.vue` - 修复导入逻辑和快捷键注册
- `/frontend/src/composables/useKeyboard.ts` - 优化unregisterShortcut支持精确匹配
- `/frontend/src/components/project/ProjectTaskList.vue` - 更新unregisterShortcut调用

### 技术要点
- 看板视图importTasksHelper中添加enrichedTasks逻辑，在导入前先查询任务信息
- 使用Promise.all并行查询所有任务的详细信息，回填existingInfo
- 看板视图导入改用getTaskDetail API替代fetch，确保错误处理一致
- 404错误检测与列表视图保持一致：检查error.response.status和error.message
- unregisterShortcut增加meta参数，支持按key+meta精确匹配
- 在onUnmounted中取消注册所有快捷键，避免组件切换时快捷键冲突
- 使用createTask API创建新任务，确保任务创建逻辑一致

### 验证结果
- 看板视图导入时在importTasksHelper阶段先查询任务信息，能正确检测任务是否存在
- 看板视图和列表视图使用相同的enrichedTasks逻辑，行为完全一致
- 看板视图Cmd+I快捷键正常工作，切换视图后仍能正常使用
- 组件卸载时正确清理快捷键，避免快捷键冲突


> 📅 导出时间：2025/11/21 14:16:18
> 🤖 由 Task-Flow 生成