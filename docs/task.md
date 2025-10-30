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
共 1 个任务

### 🟡 中优先级

<!-- task-id: fa5d1b56-9ce6-4c84-959e-fcf080c5bfba -->
#### 1. 导入优化

**状态：** 待验收
**优先级：** 中
**创建时间：** 2025/10/30 09:46:44
**更新时间：** 2025/10/30 09:53:45

**任务摘要：** 修复了JSON导入换行符处理问题，并重构导入代码为统一的ImportService，提升了可维护性

**任务需求：**

1. 现在通过 json 导入时换行符不会进行处理, 导致内容可读性很差
2. 导入方法的代码过于分散, 应该适当抽离, 统一管理维护

**实现方案：**

### 实现步骤
1. **分析JSON导入问题**：发现换行符被转义为`\n`但没有正确转换
2. **创建内容标准化函数**：`normalizeContent`处理转义字符和格式问题
3. **设计统一导入服务**：创建`ImportService`类抽离共同逻辑
4. **重构现有导入代码**：更新两个组件使用新的ImportService

### 修改的文件
- `kb-task/frontend/src/utils/export.ts` - 添加normalizeContent函数和ImportService类
- `kb-task/frontend/src/components/TaskDetailDrawer.vue` - 使用ImportService重构导入逻辑
- `kb-task/frontend/src/components/project/ProjectTaskList.vue` - 使用ImportService重构导入逻辑

### 技术要点
- **内容标准化**：处理转义的换行符、制表符、引号等特殊字符
- **统一导入服务**：ImportService类提供autoImport、validateTasks、getSuccessMessage等方法
- **代码复用**：消除重复的try-catch和验证逻辑
- **错误处理**：统一的错误消息和异常处理机制

### 验证结果
- ✅ JSON导入时换行符正确转换为实际换行，内容可读性显著提升
- ✅ 导入代码成功重构，消除了TaskDetailDrawer和ProjectTaskList中的重复逻辑
- ✅ ImportService提供统一的API，便于后续维护和扩展
- ✅ 错误处理更加一致，用户体验得到改善


> 📅 导出时间：2025/10/30 09:46:50
> 🤖 由 Task-Flow 生成