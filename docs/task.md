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

<!-- task-id: bcb89cd4-2b44-430a-b7a1-2810cb082ebe -->
#### 1. 快捷键支持

**状态：** 待验收
**优先级：** 中
**创建时间：** 2025/11/07 14:31:55
**更新时间：** 2025/11/07 14:42:53

**任务摘要：** 为项目详情页面的模块、标签、成员组件添加了快捷键支持和tooltip提示

**任务需求：**

模块, 标签, 成员都要支持"N"键打开创建弹窗, 并且有 el-tooltip提示

---

## 🛠️ AI 解决方案

**请在此处提供详细的实现方案：**

### 实现步骤
1. **分析现有组件结构**：查看ProjectView.vue中的模块、标签、成员组件结构
2. **添加快捷键支持**：为每个组件添加N键监听器
3. **添加tooltip提示**：为创建按钮添加el-tooltip组件
4. **实现事件处理**：编写键盘事件处理函数
5. **测试验证**：确保功能正常工作

### 修改的文件
- `frontend/src/components/project/ProjectModules.vue` - 添加快捷键支持和tooltip
- `frontend/src/components/project/ProjectTags.vue` - 添加快捷键支持和tooltip
- `frontend/src/components/project/ProjectMembers.vue` - 添加快捷键支持和tooltip

### 技术要点
- **Vue 3 Composition API**：使用onMounted和onUnmounted管理事件监听器
- **Element Plus el-tooltip**：为按钮添加悬停提示功能
- **键盘事件处理**：实现N键快捷键监听，避免在输入框中触发
- **事件清理**：组件卸载时正确清理事件监听器
- **TypeScript类型安全**：保持完整的类型定义

### 验证结果
- ✅ 开发服务器运行正常，无编译错误
- ✅ 模块页面支持N键新建模块，tooltip显示"新建模块 (N)"
- ✅ 标签页面支持N键新建标签，tooltip显示"新建标签 (N)"
- ✅ 成员页面支持N键添加成员，tooltip显示"添加成员 (N)"
- ✅ 快捷键不在输入框中触发，避免误操作

<!-- task-id: fb135167-e15a-4f1a-8428-7fa8004e4d70 -->
#### 2. ProjectView-icon 优化

**状态：** 待验收
**优先级：** 中
**创建时间：** 2025/11/07 14:06:46
**更新时间：** 2025/11/07 14:42:58

**任务摘要：** 将ProjectView中的所有手写SVG图标替换为lucide图标，提升视觉效果和一致性

**任务需求：**

我才看到 projectView 下竟然全是手写的 icon, 将它们替换成 lucide 的 icon

---

## 🛠️ AI 解决方案

**请在此处提供详细的实现方案：**

### 实现步骤
1. **分析现有图标**：识别ProjectView.vue中所有的手写SVG图标
2. **导入lucide图标**：添加所需的lucide图标组件导入
3. **替换SVG图标**：将所有手写SVG替换为对应的lucide图标组件
4. **更新tab图标配置**：将tabs数组中的SVG路径字符串改为lucide组件
5. **修改模板渲染**：更新模板中的图标渲染方式，使用component组件
6. **测试验证**：确保所有图标正常显示，无编译错误

### 修改的文件
- `frontend/src/views/ProjectView.vue` - 替换所有手写SVG图标为lucide图标

### 技术要点
- **lucide-vue-next**：使用现代化的图标库替换手写SVG
- **Vue组件动态渲染**：使用component:is动态渲染不同图标组件
- **图标映射**：为每个功能选择合适的lucide图标（Settings、Plus、ChevronUp、ChevronDown、Calendar、RefreshCw、Users、CheckSquare、BarChart3、List、LayoutGrid、Grid3x3、FileText、Tag、User）
- **TypeScript支持**：保持完整的类型定义和import声明
- **样式一致性**：lucide图标保持与原有SVG相同的尺寸和样式类

### 验证结果
- ✅ 开发服务器运行正常，无编译错误
- ✅ 所有按钮和操作区域的图标成功替换为lucide图标
- ✅ Tab导航栏的7个图标全部替换为lucide图标组件
- ✅ 图标显示正常，视觉效果更加统一和现代
- ✅ 保留了原有的功能和交互体验


> 📅 导出时间：2025/11/07 14:43:02
> 🤖 由 Task-Flow 生成