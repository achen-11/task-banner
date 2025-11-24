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

<!-- task-id: 4870e5a5-7ed0-4d78-a3d4-05cb55039dbf -->
#### 1. 消息通知

**状态：** 待验收
**优先级：** 中
**创建时间：** 2025/10/27 18:25:22
**更新时间：** 2025/11/21 15:50:00

**任务摘要：** 实现了完整的消息通知系统，包括任务指派和内容更新通知的自动触发、消息列表展示、未读数量显示和"我的消息"页面功能。

**任务需求：**

1. 任务指派通知
2. 任务内容更新通知
3. 实现"我的消息"页面

---

<!-- task-id: 32ded61b-7735-4562-b8e3-c0fc6c852712 -->
#### 2. 漫游式引导

**状态：** 待验收
**优先级：** 中
**创建时间：** 2025/10/30 11:08:35
**更新时间：** 2025/11/21 16:40:00

**任务摘要：** 实现了基于 Element Plus Tour 组件的漫游式引导功能，帮助新用户快速了解任务管理系统的核心功能和操作流程。

**任务需求：**

指导站点的新用户熟悉系统功能

---

## 🛠️ AI 解决方案

### 实现步骤

1. **引导状态管理**
   - 创建 `frontend/src/stores/tour.ts` Pinia store
   - 实现 `hasCompletedTour` - 是否已完成引导
   - 实现 `isTourActive` - 是否正在引导中
   - 实现 `currentStep` - 当前引导步骤
   - 使用 localStorage 持久化完成状态（`tour_completed`）
   - 实现 `startTour()`, `stopTour()`, `markTourCompleted()`, `resetTour()` 方法

2. **引导 Composable**
   - 创建 `frontend/src/composables/useTour.ts`
   - 封装 Element Plus Tour 组件的使用
   - 定义引导步骤配置（5个核心步骤）：
     - 首页入口介绍
     - 我的任务功能
     - 消息通知功能
     - 项目管理入口
     - 创建项目按钮
   - 实现 `startTour()` - 开始引导，确保侧边栏展开
   - 实现 `stopTour()` - 停止引导
   - 实现 `checkAndStartTour()` - 检查并自动开始引导（首次访问）
   - 实现 `triggerTour()` - 手动触发引导

3. **MainLayout 集成**
   - 在 `frontend/src/layouts/MainLayout.vue` 中集成 `el-tour` 组件
   - 配置 Tour 属性：`v-model`, `steps`, `current`, `show-close`, `show-arrow`
   - 实现事件处理：`@finish`, `@close`, `@change`
   - 监听 `tourStore.isTourActive` 状态变化，同步 Tour 显示
   - 在 `onMounted` 中调用 `checkAndStartTour()` 检查首次访问
   - 监听 `start-tour` 自定义事件，支持手动重新开始引导

4. **Sidebar 用户菜单**
   - 在 `frontend/src/components/Sidebar.vue` 用户下拉菜单中添加"重新开始引导"选项
   - 实现 `handleRestartTour()` 方法
   - 调用 `tourStore.resetTour()` 重置引导状态
   - 触发 `start-tour` 自定义事件通知 MainLayout 启动引导
   - 为 Projects 按钮和创建项目按钮添加 `tour-projects-button` 和 `tour-create-project-button` class，便于 Tour 定位

### 修改的文件

**前端文件：**
- `frontend/src/stores/tour.ts` - 新建，引导状态管理 store
- `frontend/src/composables/useTour.ts` - 新建，引导功能 composable
- `frontend/src/layouts/MainLayout.vue` - 更新，集成 Element Plus Tour 组件
- `frontend/src/components/Sidebar.vue` - 更新，添加重新开始引导选项和 Tour 定位 class

### 技术要点

1. **Element Plus Tour 组件**
   - 使用 Element Plus 内置的 `el-tour` 和 `el-tour-step` 组件
   - 通过 `steps` 配置引导步骤，每个步骤包含 `target`, `title`, `description`, `placement`
   - `target` 支持字符串选择器、HTMLElement 或函数返回元素
   - 使用 `v-model` 控制 Tour 显示/隐藏
   - 使用 `current` 控制当前步骤索引

2. **引导步骤设计**
   - 5个核心步骤，聚焦侧边栏主要功能
   - 步骤顺序：首页 → 我的任务 → 消息 → 项目管理 → 创建项目
   - 所有步骤 `placement` 设置为 `right` 或 `bottom`，适配侧边栏布局
   - 使用 CSS class 选择器精确定位目标元素

3. **首次访问检测**
   - 使用 localStorage 存储 `tour_completed` 标记
   - `checkAndStartTour()` 在页面加载后延迟 1.5 秒检查
   - 如果未完成引导，自动调用 `startTour()`
   - 引导完成后设置 localStorage 标记，避免重复触发

4. **侧边栏状态管理**
   - 启动引导前检查侧边栏是否收起
   - 如果收起，先调用 `uiStore.setSidebarCollapsed(false)` 展开
   - 等待 300ms 确保动画完成后再开始引导
   - 确保引导步骤的目标元素可见

5. **手动重新开始引导**
   - 在用户菜单中添加"重新开始引导"选项
   - 点击后调用 `tourStore.resetTour()` 清除 localStorage 标记
   - 通过自定义事件 `start-tour` 通知 MainLayout
   - MainLayout 监听事件，调用 `triggerTour()` 启动引导

6. **状态同步**
   - 使用 `watch` 监听 `tourStore.isTourActive` 同步到 `tourVisible`
   - 监听 `tourVisible` 变化，关闭时同步停止 store 状态
   - `handleTourChange` 更新 `tourCurrent` 和 store 的 `currentStep`
   - `handleTourFinish` 和 `handleTourClose` 正确更新状态

### 验证结果

1. **引导状态管理**
   - ✅ `tourStore` 正确管理引导状态
   - ✅ localStorage 持久化完成状态
   - ✅ `resetTour()` 正确清除状态
   - ✅ `startTour()` 和 `stopTour()` 正确更新状态

2. **首次访问自动触发**
   - ✅ 首次访问（无 localStorage 标记）时自动开始引导
   - ✅ 引导完成后设置标记，不再自动触发
   - ✅ 延迟 1.5 秒确保页面完全加载

3. **引导步骤显示**
   - ✅ 5个引导步骤正确显示
   - ✅ 目标元素正确高亮
   - ✅ 步骤标题和描述正确显示
   - ✅ 支持上一步/下一步导航
   - ✅ 显示关闭按钮和进度指示

4. **侧边栏展开**
   - ✅ 引导开始前自动展开侧边栏
   - ✅ 等待动画完成后再显示引导
   - ✅ 所有目标元素可见

5. **手动重新开始**
   - ✅ 用户菜单中显示"重新开始引导"选项
   - ✅ 点击后正确重置状态
   - ✅ 通过自定义事件触发引导
   - ✅ 引导正常启动和显示

6. **引导完成和关闭**
   - ✅ 点击完成按钮正确标记为已完成
   - ✅ 点击关闭按钮正确停止引导
   - ✅ 状态正确同步到 store 和 localStorage
