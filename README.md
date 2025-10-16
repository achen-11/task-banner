# Task Banner - 任务看板系统

一个现代化的任务管理看板应用，专为优化 AI 辅助开发工作流而设计。

## 项目简介

Task Banner 是一个基于 Web 的任务管理系统，帮助开发者高效管理多个项目的任务，并能将任务快速导出为 Markdown 格式供 AI（如 Claude）执行。特别适合拥有 AI 订阅但工作时间段使用率较低的场景，通过提前准备好结构化需求，充分利用 AI Token 配额。

## 核心特性

- **项目管理**
  - 创建、编辑、删除项目
  - 项目分组和状态管理
  - 技术栈标签管理

- **任务看板**
  - 看板视图（Kanban）
  - 5 种任务状态：待办、进行中、已完成、已发送AI、需优化
  - 拖拽排序和状态切换
  - 优先级管理（低/中/高/紧急）
  - 支持标签、技术要点、参考链接等丰富信息

- **Markdown 导出** ⭐️
  - 批量导出任务为结构化 Markdown
  - 按优先级自动分组
  - 一键复制到剪贴板
  - 下载为 .md 文件
  - 包含项目上下文和技术信息

- **数据持久化**
  - IndexedDB 本地存储
  - 数据导入/导出（JSON）
  - 完全离线可用

## 技术栈

### 前端框架
- **Vue 3** - Composition API + TypeScript
- **Vite** - 快速开发构建工具
- **Vue Router** - 路由管理

### UI 框架
- **TailwindCSS** - 原子化 CSS
- **ElementPlus** - Vue 3 组件库

### 状态管理
- **Pinia** - Vue 3 官方推荐状态管理

### 数据存储
- **Dexie.js** - IndexedDB 封装库

### 其他
- **VueDraggable** - 拖拽功能
- **TypeScript** - 类型安全

## 快速开始

### 环境要求

- Node.js >= 16
- npm >= 7

### 安装

```bash
# 克隆仓库
git clone <repository-url>
cd task-banner

# 安装依赖
npm install
```

### 开发

```bash
# 启动开发服务器
npm run dev

# 访问 http://localhost:3000
```

### 构建

```bash
# 生产构建
npm run build

# 预览构建结果
npm run preview
```

## 使用指南

### 1. 创建项目

1. 访问首页，点击"查看项目"
2. 点击"新建项目"按钮
3. 填写项目信息：
   - 项目名称（必填）
   - 项目描述
   - 项目状态
   - 技术栈标签

### 2. 管理任务

1. 进入项目看板
2. 点击"新建任务"创建任务
3. 填写任务详情：
   - 标题、描述（支持 Markdown）
   - 状态、优先级
   - 标签、技术要点、参考链接
   - 预计工作量、截止日期

4. 通过拖拽在不同状态列之间移动任务

### 3. 导出任务

1. 在看板中勾选需要导出的任务
2. 点击"导出选中"按钮
3. 预览生成的 Markdown 内容
4. 选择操作：
   - 复制到剪贴板
   - 下载为 .md 文件

### 4. 使用导出的需求

将导出的 Markdown 内容粘贴给 AI（如 Claude），AI 会根据结构化的需求执行任务。

## 项目结构

```
task-banner/
├── docs/                 # 文档
│   ├── requirements.md   # 完整需求文档
│   └── ...
├── src/
│   ├── components/       # Vue 组件
│   │   ├── ProjectDialog.vue
│   │   ├── TaskDialog.vue
│   │   └── ExportDialog.vue
│   ├── views/            # 页面组件
│   │   ├── Home.vue
│   │   ├── Projects.vue
│   │   └── Board.vue
│   ├── stores/           # Pinia 状态管理
│   │   ├── project.ts
│   │   ├── task.ts
│   │   └── db.ts
│   ├── db/               # 数据库配置
│   │   └── index.ts
│   ├── types/            # TypeScript 类型定义
│   │   └── index.ts
│   ├── utils/            # 工具函数
│   │   ├── index.ts
│   │   └── export.ts
│   ├── router/           # 路由配置
│   │   └── index.ts
│   ├── App.vue
│   ├── main.ts
│   └── style.css
├── public/
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## 数据模型

### Project（项目）
```typescript
interface Project {
  id: string
  name: string
  description?: string
  status: 'active' | 'completed' | 'paused'
  techStack: string[]
  createdAt: number
  updatedAt: number
}
```

### Task（任务）
```typescript
interface Task {
  id: string
  projectId: string
  title: string
  description: string
  status: 'todo' | 'in_progress' | 'completed' | 'sent_to_ai' | 'needs_optimization'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  tags: string[]
  estimatedEffort?: string
  dueDate?: number
  technicalPoints?: string[]
  referenceLinks?: string[]
  order: number
  createdAt: number
  updatedAt: number
}
```

## 功能路线图

### ✅ MVP（已完成）
- 项目管理 CRUD
- 任务管理 CRUD
- 看板视图和拖拽
- Markdown 导出
- 剪贴板复制
- 数据持久化

### 🚀 未来计划（v1.1+）
- [ ] 数据备份和恢复
- [ ] 任务搜索和高级筛选
- [ ] 任务模板功能
- [ ] 自定义导出模板
- [ ] 统计面板和数据可视化
- [ ] 快捷键支持
- [ ] 列表视图
- [ ] 深色模式
- [ ] PWA 支持
- [ ] 移动端适配

## 常见问题

### Q: 数据存储在哪里？
A: 所有数据存储在浏览器的 IndexedDB 中，完全本地化，不依赖服务器。

### Q: 如何备份数据？
A: 目前可以通过设置页面的导入/导出功能手动备份（功能开发中）。

### Q: 支持多人协作吗？
A: MVP 版本仅支持单人使用，后续版本会考虑云同步和多人协作。

### Q: 导出的 Markdown 格式可以自定义吗？
A: MVP 版本使用固定模板，后续版本会支持自定义模板。

## 贡献

欢迎提交 Issue 和 Pull Request！

## 开发计划

详细的需求规格和开发计划请参考 [docs/requirements.md](./docs/requirements.md)

## 许可证

MIT License

## 致谢

- Vue.js
- ElementPlus
- TailwindCSS
- Dexie.js

---

**Made with ❤️ for AI-powered development**
