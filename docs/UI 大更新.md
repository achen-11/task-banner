1. 阅读 kb-task 的项目代码(这是一个我以前做的半成品kooboo项目), 不过里面的 ui 和页面样式很符合我的审美
2. 现在我需要你阅读后将 src 下的 ui 参照着完成
3. kb特殊项目语法说明: (kb-task/src)
   1. 前端主要看 layout, page, view, js 文件夹即可
   2. `<view id="xxx">`表示引用id 为"xxx"的 view 下的 html 文件

---

## UI 大更新任务清单

### 核心设计特点分析（基于 kb-task）

1. **颜色方案**
   - 主背景：`bg-zinc-50` (侧边栏), `bg-gray-50` (主内容区)
   - 边框：`border-gray-200`
   - 悬停效果：`hover:bg-gray-200`
   - 激活状态：`bg-zinc-200`
   - 次级背景：`bg-gray-50` (表头等)

2. **交互效果**
   - 悬停状态有明显的背景色变化
   - 激活菜单项有独特的背景色
   - 过渡动画流畅 (`transition-colors duration-200`)

3. **布局设计**
   - 统一的圆角：`rounded-md`
   - 清晰的边框线条：`border-gray-200`
   - 合理的间距和留白

4. **任务列表特点**
   - Grid 表格式布局（12列网格）
   - 带表头显示列名
   - 支持拖拽排序
   - 悬停效果明显

### 详细更新任务

- [x] 1. 研究并理解 kb-task 项目的整体 UI 设计风格和颜色方案
- [ ] 2. 更新侧边栏组件 (Sidebar.vue)
  - 背景色改为 `bg-zinc-50`
  - 边框改为 `border-gray-200`
  - 优化菜单项样式
- [ ] 3. 优化侧边栏菜单项的交互效果
  - 悬停效果：`hover:bg-gray-200`
  - 激活状态：`bg-zinc-200`
  - 确保过渡动画流畅
- [ ] 4. 更新侧边栏边框和视觉层次
  - 边框颜色统一为 `border-gray-200`
  - 优化分隔线样式
  - 调整内边距和外边距
- [ ] 5. 优化主布局 (MainLayout.vue)
  - 主内容区背景色改为 `bg-gray-50`
  - 调整间距和布局
  - 确保与侧边栏协调
- [ ] 6. 更新任务列表视图 (ListView.vue)
  - 参考 `kb-task/src/view/components/task-list.html`
  - 使用 Grid 12列布局：任务(5列) + 负责人(2列) + 截止日期(2列) + 优先级(1列) + 状态(2列)
  - 添加拖拽排序功能
- [ ] 7. 优化任务列表表头样式
  - 添加 `bg-gray-50` 背景
  - 添加 `border-gray-200` 边框
  - 文字样式：`text-xs font-medium text-gray-500`
- [ ] 8. 优化任务项样式
  - 添加悬停效果：`hover:bg-gray-50`
  - 边框：`border-b border-gray-100`
  - 过渡动画：`transition-colors duration-200`
  - 优化内边距和间距
- [ ] 9. 更新看板视图 (Board.vue)
  - 优化看板列的背景和边框
  - 使用统一的圆角样式
  - 调整卡片样式与整体风格一致
- [ ] 10. 优化任务对话框 (TaskDialog.vue)
  - 参考 `kb-task/src/view/components/quick-create-task.html`
  - 参考 `kb-task/src/view/components/task-detail-drawer.html`
  - 优化表单样式和布局
- [ ] 11. 统一所有组件的样式规范
  - 圆角统一使用 `rounded-md`
  - 边框统一使用 `border-gray-200`
  - 阴影效果统一
- [ ] 12. 优化其他辅助组件样式
  - ExportDialog
  - ImportDialog
  - ProjectDialog
  - KeyboardShortcutsPanel
  - GlobalSearch
- [ ] 13. 全局样式检查和优化
  - 确保所有悬停状态使用统一配色
  - 确保所有激活状态使用统一配色
  - 检查按钮、输入框等基础组件样式
- [ ] 14. 测试所有页面和组件
  - 主页功能测试
  - 项目列表功能测试
  - 看板视图功能测试
  - 列表视图功能测试
  - 数据管理功能测试
  - 各种对话框和弹窗测试

### 关键文件映射

| 功能 | kb-task 参考文件 | task-banner 目标文件 |
|------|------------------|---------------------|
| 侧边栏 | `kb-task/src/view/components/app-sidebar.html` | `src/components/Sidebar.vue` |
| 主布局 | `kb-task/src/layout/main.html` | `src/layouts/MainLayout.vue` |
| 任务列表 | `kb-task/src/view/components/task-list.html` | `src/components/ListView.vue` |
| 任务区段列表 | `kb-task/src/view/page/task-lists.html` | `src/views/Board.vue` |
| 快速创建任务 | `kb-task/src/view/components/quick-create-task.html` | `src/components/TaskDialog.vue` |
| 任务详情 | `kb-task/src/view/components/task-detail-drawer.html` | `src/components/TaskDialog.vue` |

### 颜色方案速查表

```
背景色：
- 侧边栏：bg-zinc-50
- 主内容：bg-gray-50
- 表头：bg-gray-50
- 卡片/面板：bg-white

边框：
- 主边框：border-gray-200
- 次级边框：border-gray-100

交互状态：
- 悬停：hover:bg-gray-200 (侧边栏菜单)
- 悬停：hover:bg-gray-50 (任务列表)
- 激活：bg-zinc-200
- 选中：bg-gray-100

文字：
- 主文字：text-gray-900
- 次要文字：text-gray-500
- 禁用文字：text-gray-400
```

---feedback---

1. 你更多的是替换样式, 而我想要是包括功能的参考, 我粗略的描述我想要的内容, 你来完善和补充(有疑问提出疑问)
2. kb-task 指的是 kb-task 文件夹下的下面, task-banner 指的是我们当前的项目
3. 我觉得可以新建一个vue 项目来完成本次的任务, 以保证task-banner 可以正常运行, 因为合并后是带有协作的, 单纯的前端项目不能满足(需要有 api)
# 1. 整体布局
1. 整体布局以 kb-task 为主, 包括样式 (见docs/Images/kb-task/整体布局.png), 直接抄过来也行, 但要保证能用
   1. 左侧菜单栏
      1. icon + 站点标题
      2. 首页 / 我的任务 / 消息
      3. Projects + 新建项目按钮
      4. 项目列表 (溢出滚动)
   2. 头部 nav
      1. 展开收起按钮 / 页面标题 
      2. 右侧(任务搜索框)
2. 首页()
3. 我的任务
4. 消息
5. 不用项目列表页了
6. 菜单 -> xxx 项目 -> 进入项目首页 (以 kb-task 为主)
   1. 头部 (支持收起, 以便有更多空间)
      1. 项目信息 
      2. 项目设置
   2. tab 栏(概览/列表/看板/ 成员)
7. 任务详情 (以 task-banner 为主, 保留 task-banner 的抽屉和迭代历史)
   1. 但任务内容改为使用 quill.js
   2. 保留任务导入导出的功能
8. 保留 task-banner 的所有快捷键
9. 不使用 kb-task 的区段概念, 改为 task-banner 的模块概念(其实还没做..), 两者概念差不多, 只是叫法不一样
