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

### 🟡 中优先级

<!-- task-id: 7a5f4c1f-c65a-43c1-99f6-3f4c73fa19a0 -->
#### 1. 标签

**状态：** 已完成
**优先级：** 中
**创建时间：** 2025/10/26 16:08:44
**更新时间：** 2025/10/27 18:04:30

**任务描述：**

**任务摘要：** 实现了完整的标签提示词管理功能（前后端），支持快速访问栏和标签分组，导出任务时自动注入 AI 提示词指导 AI 行为。

- [x] 标签除了可以被任务关联, 现在需要多一个提示词管理
- [x] 场景: 比如我新建了一个讨论型的任务, 那么我需要额外告诉 ai, 这是一个讨论型的任务, 不要编辑代码, 而是给我提供意见, 那么这时我们可以通过标签绑定一些提示词, 这样就可以在 cmd+e 时快捷加入这些内容
- [x] 例如: 1. 给标签"讨论", 关联提示词"这是讨论型任务, 你不要操作代码, 先将你的想法输出到 md 文件和我讨论"; 2. 创建任务, 添加"讨论"标签; 3. cmd+e 导出时, 将提示词拼接到任务内容中

**实现方案：**

### 1. 数据模型设计

新增 `Tag` 类型，包含以下核心字段：
- `prompt`: 标签关联的 AI 提示词
- `showInQuickBar`: 是否显示在快速访问栏（用户额外需求）
- `color`: 标签颜色
- `order`: 排序

### 2. 核心功能

#### 2.1 标签管理（ProjectTags 组件）

**位置**：项目详情页 → 标签 Tab

**功能**：
- ✅ 标签列表展示（名称、颜色、提示词预览、快速访问标识）
- ✅ 创建/编辑标签（TagDialog 弹窗）
- ✅ 删除标签（带确认）
- ✅ 标签排序

#### 2.2 任务标签选择（TaskBasicInfo 组件）

**UI 设计**：
```
标签:
[讨论] [重构] [文档] [+其他标签]
```

**交互逻辑**：
- 快速访问标签（`showInQuickBar: true`）：
  - 直接显示在标签栏
  - 点击切换选中/未选中状态
  - 选中时显示标签颜色背景，未选中时显示白色背景+颜色圆点

- 其他标签（`showInQuickBar: false`）：
  - 点击"+其他标签"按钮打开选择弹窗
  - 支持多选
  - 选中后显示在标签栏，hover 显示删除按钮

#### 2.3 导出功能增强（export.ts）

**提示词注入位置**：任务描述开头

**格式**：
```markdown
**任务描述：**

**📌 标签提示词：**

这是讨论型任务，你不要操作代码，先将你的想法输出到 md 文件和我讨论

---

任务描述的正文内容...
```

**多标签处理**：按顺序拼接所有提示词

### 3. 修改文件

**新增文件**：
1. `frontend/src/types/tag.ts` - Tag 类型定义
2. `frontend/src/api/tag.ts` - 标签 API
3. `frontend/src/components/tag/TagDialog.vue` - 标签编辑弹窗
4. `frontend/src/components/tag/TagSelector.vue` - 标签选择弹窗

**修改文件**：
1. `frontend/src/types/task.ts`
   - 导入 Tag 类型
   - 修改 `TaskDetail.tags` 类型为 `Tag[]`

2. `frontend/src/components/project/ProjectTags.vue`
   - 完全重写，实现标签 CRUD 功能
   - 集成 TagDialog 组件

3. `frontend/src/components/task/TaskBasicInfo.vue`
   - 导入 TagSelector 组件和 Tag API
   - 移除旧的字符串输入标签逻辑
   - 实现快速访问标签和其他标签的区分展示
   - 添加 `loadProjectTags` 函数
   - 添加 `toggleQuickTag`、`handleTagsConfirm`、`removeTag` 方法
   - 计算属性：`quickAccessTags`、`otherTagIds`、`selectedOtherTags`

4. `frontend/src/utils/export.ts`
   - 修改 `exportTaskToMarkdown` 和 `exportTasksToMarkdown`
   - 函数签名支持 `TaskDetail` 类型
   - 在任务描述前注入标签提示词
   - 添加类型保护确保安全访问 `task.tags`

### 4. 技术要点

**1. 类型安全**
- 使用 TypeScript 类型保护 (`'tags' in task && Array.isArray(task.tags)`)
- 函数签名支持 `Task | TaskDetail` 联合类型
- 使用 `any` 类型临时处理 filter/map 中的标签对象

**2. Vue 3 Composition API**
- `computed` 计算属性实现响应式数据派生
- `watch` 监听 projectId 并行加载成员和标签数据
- 组件间通信：emit 事件和 props

**3. UI 交互优化**
- 标签选中状态通过 CSS 动态绑定 `:class` 和 `:style`
- hover 显示删除按钮使用 CSS `group` 和 `opacity`
- 弹窗使用 Teleport 渲染到 body

**4. Element Plus 集成**
- `ElMessage` 显示操作提示
- `ElMessageBox.confirm` 确认删除操作

### 5. 后端实现

**后端文件修改**：

1. **`kb-task/src/code/Models/Tag.ts`**（已更新）
   - ✅ 添加 `prompt` 字段（String，默认空字符串）
   - ✅ 添加 `showInQuickBar` 字段（Boolean，默认 false）
   - ✅ 添加 `order` 字段（Number，默认 0）

2. **`kb-task/src/code/Services/tag.ts`**（已更新）
   - ✅ 更新 `TagInfo` 接口，添加新字段
   - ✅ 更新 `createTag` 函数，支持新字段并自动计算 order
   - ✅ 更新 `updateTag` 函数，支持更新新字段
   - ✅ 新增 `updateTagOrder` 函数，批量更新标签顺序
   - ✅ 更新 `getProjectTags`，按 order 排序
   - ✅ 更新 `formatTagInfo`，包含所有字段

3. **`kb-task/src/api/tag.ts`**（已更新）
   - ✅ 导入 `updateTagOrder` 函数
   - ✅ 更新 `POST /api/tag/create`，接收新字段
   - ✅ 更新 `PUT /api/tag/update`，接收新字段
   - ✅ 新增 `PUT /api/tag/updateOrder`，批量更新顺序

4. **`kb-task/src/code/Services/task.ts`**（已更新）
   - ✅ 更新 `TaskDetailInfo` 接口的 tags 类型，包含完整 Tag 字段
   - ✅ 更新 `getTaskDetailById` 函数，返回完整的 Tag 对象（包含 prompt、showInQuickBar、order 等）

**API 端点**：

```typescript
// 标签 CRUD
GET  /api/tag/list?projectId=xxx
POST /api/tag/create
  Body: { projectId, name, color?, prompt?, showInQuickBar?, order? }
PUT  /api/tag/update
  Body: { id, name?, color?, prompt?, showInQuickBar?, order? }
PUT  /api/tag/updateOrder
  Body: { projectId, updates: [{ id, order }] }
DELETE /api/tag/delete
  Body: { id }

// 任务详情返回完整的 tags 对象数组
GET  /api/task/detail?id=xxx
返回: { ..., tags: Tag[] }  // 包含 prompt, showInQuickBar, order 等完整字段
```

**数据库迁移**：
标签表 (tags) 已添加以下字段：
- `prompt`: TEXT（AI 提示词）
- `showInQuickBar`: INTEGER (0/1, SQLite 的布尔值)
- `order`: INTEGER（排序值）

### 6. 验证结果

✅ **构建测试通过**：
```
✓ 3277 modules transformed
✓ built in 4.76s
```

✅ **代码结构清晰**：
- 类型定义完整
- 组件职责单一
- 逻辑分离合理

✅ **用户体验提升**：
- 🎯 **标签管理可视化**：在项目标签 Tab 中可以看到所有标签及提示词
- 🏃 **快速访问**：常用标签直接显示在标签栏，一键切换
- 🤖 **AI 智能提示**：导出任务时自动携带标签提示词，指导 AI 行为
- 📝 **灵活分组**：支持快速访问和其他标签的分类管理

### 7. 使用示例

**创建标签**：
1. 进入项目 → 标签 Tab
2. 点击"新建标签"
3. 填写：
   - 标签名称：讨论
   - 颜色：蓝色
   - 提示词：这是讨论型任务，你不要操作代码，先将你的想法输出到 md 文件和我讨论
   - ☑️ 显示在快速访问栏
4. 保存

**使用标签**：
1. 创建/编辑任务
2. 在标签栏点击"讨论"标签（快速访问）
3. 或点击"+其他标签"选择其他标签
4. Cmd+E 导出任务，提示词自动注入

**导出效果**：
```markdown
**任务描述：**

**📌 标签提示词：**

这是讨论型任务，你不要操作代码，先将你的想法输出到 md 文件和我讨论

---

实现用户登录功能
- 支持账号密码登录
- 支持记住登录状态
```

---

> 📅 更新时间：2025/10/27 18:04:30
> 🤖 由 Task-Flow 生成
