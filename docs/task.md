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

<!-- task-id: a18ae62e-604e-4149-bbbf-b68a82ddd248 -->
#### 1. 全局搜索(Cmd+K)

**状态：** 待验收
**优先级：** 中
**创建时间：** 2025/10/27 18:25:38
**更新时间：** 2025/11/21 14:00:02

**任务需求：**

- [ ] 支持快捷键 cmd + K 全局搜索任务
- [ ] 搜索范围包含任务描述, 任务名称, 任务评论, 项目文档
- [ ] 匹配到的关键字需要高亮
- [ ] 需要做内容截断, 如: ...dasasd-keyword-adadas....

---


---

## 📝 选中评论

> 共 1 条评论

### 评论 1

**作者:** wanggaojiachen
**时间:** 2025/11/21 14:01:51

**内容:**

1. 跳转后的链接无法有效打开任务 drawer, url 有变化
2. 搜索结果的项目 tag, 背景色和字体颜色要有对比度, 现在这样看起来会很丑
3. 要有一个 checkbox, 用来选择是否包含已归档的项目和任务

---

**实现方案：**

### 实现步骤
1. 修复跳转后无法打开任务drawer的问题：优化ProjectBoard的路由监听逻辑，确保URL变化时能正确打开任务详情
2. 优化项目tag的对比度：实现getProjectTagStyle函数，根据背景色亮度自动选择文字颜色
3. 添加"包含已归档项目"checkbox：在搜索框中添加选项，支持搜索已归档的项目和任务

### 修改的文件
- `/frontend/src/components/common/GlobalSearchModal.vue` - 添加checkbox选项，优化项目tag样式
- `/frontend/src/components/project/ProjectBoard.vue` - 修复路由监听逻辑，确保任务drawer正确打开
- `/frontend/src/types/search.ts` - 添加includeArchived参数
- `/frontend/src/api/search.ts` - 更新API调用支持includeArchived参数
- `/src/api/search.ts` - 后端API支持includeArchived参数过滤

### 技术要点
- 修复任务drawer打开问题：监听route.query.taskId和props.project变化，使用setTimeout确保路由切换完成后再打开drawer
- 项目tag对比度优化：使用WCAG标准计算颜色亮度，根据亮度自动选择深色(#1f2937)或白色(#ffffff)文字
- 支持搜索已归档项目：添加includeArchived参数，后端根据参数决定是否过滤已归档项目
- 使用nextTick和setTimeout确保组件渲染完成后再打开drawer

### 验证结果
- 跳转后URL变化时能正确打开任务drawer
- 项目tag的背景色和文字颜色有良好对比度，视觉效果更佳
- checkbox可以控制是否包含已归档的项目和任务
- 切换checkbox时自动重新搜索
- 关闭搜索对话框时重置includeArchived状态

**任务摘要：** 修复全局搜索的验收反馈：优化任务drawer打开逻辑、项目tag对比度和添加归档项目搜索选项

---


> 📅 导出时间：2025/11/21 14:03:32
> 🤖 由 Task-Flow 生成