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

共 1 个任务

### 🟡 中优先级

<!-- task-id: 1761389495429-msftdn8ny -->
#### 1. 基础布局构建

**状态：** 已完成
**优先级：** 中
**创建时间：** 2025/10/25 18:51:35
**更新时间：** 2025/10/25 19:40:00

**任务描述：**

- [x] 你这版太丑了, 需要优化
- [x] 你阅读"kb-task/src/view/components/app-sidebar.html","kb-task/src/view/components/app-header.html","kb-task/src/layout/main.html", "docs/Images/kb-task/整体布局.png", 实在不行你就一模一样的就好了, 但代码不能一样啊, 这是 kooboo 环境的代码, 你要适配成正常 vue 环境的代码

**优化内容：**

1. **新增 AppHeader 组件**（`components/AppHeader.vue`）
   - 左侧：收起侧边栏按钮 + 面包屑导航
   - 右侧：搜索框
   - 白色背景，底部带边框阴影
   - 高度紧凑，与参考设计一致

2. **优化 Sidebar 组件**（`components/Sidebar.vue`）
   - 支持收起/展开（w-64 ↔ w-14）
   - 菜单项更紧凑（padding: 0.5rem, margin-bottom: 4px）
   - Logo 区域：蓝色方形图标 + 标题
   - 项目列表：使用彩色方形小图标，显示项目首字母
   - 用户信息区域：底部固定，方形头像，带下拉菜单
   - hover 效果：`bg-gray-200 (rgb(228 228 231))`
   - 激活状态：`bg-zinc-200`

3. **优化 MainLayout 布局**（`layouts/MainLayout.vue`）
   - 添加 Header 组件
   - 支持侧边栏收起/展开状态管理
   - 主内容区域结构：Header + 可滚动内容区
   - 移除不必要的内边距

**技术细节：**

- 侧边栏收起时宽度 56px (w-14)，展开时 256px (w-64)
- 使用 `transition-all duration-300` 实现平滑过渡
- 项目图标使用圆角矩形（rounded-md）显示首字母
- 用户下拉菜单点击外部自动关闭
- 面包屑导航根据路由自动生成

**修改文件：**

- `frontend/src/components/AppHeader.vue` - 新建 Header 组件
- `frontend/src/components/Sidebar.vue` - 完全重写，更紧凑的设计
- `frontend/src/layouts/MainLayout.vue` - 添加 Header，支持侧边栏收起

---


> 📅 导出时间：2025/10/25 19:26:38
> 🤖 由 Task Banner 生成