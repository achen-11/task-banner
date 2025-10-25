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

<!-- task-id: 1761405234174-rjbix3ibv -->
#### 1. 接入 project api

**状态：** 已完成
**优先级：** 中
**创建时间：** 2025/10/25 23:13:54
**更新时间：** 2025/10/25 23:13:56

**任务描述：**

- [x] 前端接入 project api

**实现说明：**

已完成前端 Project API 的完整接入，包括以下内容：

#### 1. 目录结构

```
frontend/src/
├── api/
│   ├── project.ts          # 项目 API 调用封装
│   └── README.md           # API 使用文档
├── types/
│   └── project.ts          # 项目相关类型定义
└── stores/
    └── project.ts          # 项目状态管理（Pinia）
```

#### 2. 类型定义 (`types/project.ts`)

定义了完整的 TypeScript 类型：
- `Project` - 项目信息接口
- `ProjectMember` - 项目成员接口
- `CreateProjectParams` - 创建项目参数
- `UpdateProjectParams` - 更新项目参数
- `AddMemberParams` - 添加成员参数
- `RemoveMemberParams` - 移除成员参数
- `ProjectListResponse` - 项目列表响应
- `MemberListResponse` - 成员列表响应

#### 3. API 调用封装 (`api/project.ts`)

实现了 8 个 API 方法：

**项目管理：**
- `getProjectList(page, size)` - 获取项目列表（分页）
- `getProjectDetail(id)` - 获取项目详情
- `createProject(data)` - 创建新项目
- `updateProject(data)` - 更新项目信息
- `deleteProject(id)` - 删除项目

**成员管理：**
- `getProjectMembers(projectId)` - 获取项目成员列表
- `addProjectMember(data)` - 添加项目成员
- `removeProjectMember(data)` - 移除项目成员

#### 4. 状态管理 (`stores/project.ts`)

使用 Pinia 实现完整的状态管理：

**状态：**
- `projects` - 项目列表
- `currentProject` - 当前选中的项目
- `loading` - 加载状态
- `total` - 项目总数

**计算属性：**
- `activeProjects` - 活跃项目列表
- `completedProjects` - 已完成项目列表
- `pausedProjects` - 暂停的项目列表

**方法：**
- `fetchProjects()` - 获取项目列表
- `fetchProjectDetail()` - 获取项目详情
- `createProject()` - 创建项目
- `updateProject()` - 更新项目
- `deleteProject()` - 删除项目
- `findProjectById()` - 根据 ID 查找项目
- `setCurrentProject()` - 设置当前项目
- `reset()` - 清空状态

#### 5. 技术要点

- ✅ 使用现有的 `utils/request.ts` 进行 HTTP 请求
- ✅ 响应拦截器自动处理 code 200 并返回 data.data
- ✅ 所有 ID 字段类型为 `string`（与后端 Kooboo _id 保持一致）
- ✅ 时间字段为毫秒级时间戳（number 类型）
- ✅ 完整的 TypeScript 类型支持
- ✅ 错误处理和日志记录
- ✅ Pinia 响应式状态管理

#### 6. 使用方式

**方式一：直接调用 API（一次性操作）**
```typescript
import { createProject } from '@/api/project'
const project = await createProject({ name: '新项目' })
```

**方式二：使用 Pinia Store（组件中推荐）**
```vue
<script setup lang="ts">
import { useProjectStore } from '@/stores/project'
const projectStore = useProjectStore()
await projectStore.fetchProjects()
</script>
```

#### 7. 文档

创建了详细的使用文档 `frontend/src/api/README.md`，包含：
- API 方法列表和参数说明
- 完整的使用示例
- 错误处理指南
- 注意事项和最佳实践

---


> 📅 导出时间：2025/10/25 23:13:58
> 🤖 由 Task Banner 生成