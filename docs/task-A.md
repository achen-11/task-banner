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

<!-- task-id: 1761440752177-kheijipvd -->
#### 1. task-detail api

**状态：** 已完成
**优先级：** 中
**创建时间：** 2025/10/26 09:05:52
**更新时间：** 2025/10/26 09:05:52

**任务描述：**

- [x] 阅读"kb-task/frontend/src/views/ProjectView.vue"
- [x] 阅读"kb-task/frontend/src/types/project.ts"
- [x] 更新 task detail api, 看起来是新增了一些字段

**实现细节：**

已完成项目详情 API 的更新，添加了统计字段支持：

1. **前端类型定义更新** (`frontend/src/types/project.ts:20-23`)
   - 在 `Project` 接口中添加了可选统计字段：
     - `taskCount?: number` - 总任务数
     - `completedTaskCount?: number` - 已完成任务数
     - `memberCount?: number` - 成员数量
   - 这些字段标记为可选，因为只在详情 API 中返回

2. **后端 Service 层更新** (`kb-task/src/code/Services/project.ts`)
   - 导入 Task 模型 (第 7 行)
   - 添加 `ProjectDetailInfo` 接口扩展 `ProjectInfo` (第 28-32 行)
   - 新增 `getProjectDetailById()` 函数 (第 93-119 行)：
     - 查询项目基础信息
     - 统计项目的所有任务数量
     - 统计已完成任务数量（status === 'completed'）
     - 统计项目成员数量
     - 返回包含统计信息的项目详情

3. **后端 API 层更新** (`kb-task/src/api/project.ts`)
   - 导入 `getProjectDetailById` 函数 (第 8 行)
   - 更新 `/api/project/detail` 接口 (第 77 行)：
     - 将 `getProjectById()` 改为 `getProjectDetailById()`
     - API 现在返回包含统计信息的完整项目详情

**API 返回数据结构：**

```typescript
{
  _id: string
  name: string
  description: string
  color: string
  ownerId: string
  status: 'active' | 'completed' | 'paused'
  icon: string
  order: number
  createdAt: number
  updatedAt: number
  // 新增统计字段
  taskCount: number          // 项目总任务数
  completedTaskCount: number // 已完成任务数
  memberCount: number        // 项目成员数
}
```

**技术要点：**

- 使用 TypeScript 接口扩展（`extends`）保持代码复用
- 统计逻辑在 Service 层实现，保持关注点分离
- API 层只负责调用 Service 函数
- 前端类型定义使用可选字段（`?`），兼容列表和详情两种场景

**相关文件：**

- `frontend/src/types/project.ts` - 前端类型定义
- `kb-task/src/code/Services/project.ts` - 后端服务层
- `kb-task/src/api/project.ts` - 后端 API 层
- `frontend/src/views/ProjectView.vue` - 项目详情页使用统计数据

---


> 📅 导出时间：2025/10/26 09:05:52
> 🤖 由 Task Banner 生成