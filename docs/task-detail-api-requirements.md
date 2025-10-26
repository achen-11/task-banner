# 任务详情页 API 需求文档

## 一、概述

本文档定义了任务详情页所需的所有 API 接口，遵循项目的后端开发规范（`docs/Backend-Development-Guide.md`）。

### 技术规范
- **路由方式**: 使用 `@k-url /api/{resource}/{action}` 格式
- **参数传递**: ID 通过 query 或 body 传递，避免路径参数
- **响应格式**: 统一使用 `success()` 和 `error()` 工具函数
- **认证**: 所有接口需要检查 `k.account.isLogin`
- **权限**: 根据操作类型检查项目成员权限

---

## 二、任务基本操作 API

### 1. 获取任务列表

**接口**: `GET /api/task/list`

**用途**: 获取项目下的任务列表，支持分页和筛选

**Query 参数**:
```typescript
{
  projectId: string       // 必填，项目 ID
  moduleId?: string       // 可选，模块 ID（0 表示未分类）
  status?: string         // 可选，任务状态
  priority?: string       // 可选，优先级
  assigneeId?: string     // 可选，负责人 ID
  page?: number           // 可选，页码，默认 1
  size?: number           // 可选，每页数量，默认 20
}
```

**响应数据**:
```typescript
{
  success: true,
  message: 'Success',
  data: {
    items: Task[],        // 任务列表
    total: number,        // 总数
    page: number,         // 当前页码
    size: number          // 每页数量
  }
}
```

**Task 数据结构**:
```typescript
{
  _id: string             // Kooboo 自动生成的主键
  taskId: string          // UUID 任务标识
  projectId: string       // 项目 ID
  moduleId: string        // 模块 ID
  title: string           // 任务标题
  content: string         // 任务内容（Quill Delta JSON）
  status: string          // 状态: todo, in_progress, completed, sent_to_ai, needs_optimization
  priority: string        // 优先级: low, medium, high, urgent
  assigneeId: string      // 负责人 ID
  assigneeName?: string   // 负责人名称（JOIN 查询）
  creatorId: string       // 创建人 ID
  creatorName?: string    // 创建人名称（JOIN 查询）
  dueDate: number         // 截止日期（UNIX 时间戳，0 表示无）
  progress: number        // 进度 0-100
  order: number           // 排序字段
  createdAt: number       // 创建时间
  updatedAt: number       // 更新时间
  tags?: Tag[]            // 标签列表（可选）
  commentCount?: number   // 评论数量（可选）
}
```

---

### 2. 获取任务详情

**接口**: `GET /api/task/detail`

**用途**: 获取单个任务的完整信息

**Query 参数**:
```typescript
{
  id: string              // 必填，任务的 _id
}
```

**响应数据**:
```typescript
{
  success: true,
  message: 'Success',
  data: {
    _id: string
    taskId: string
    projectId: string
    moduleId: string
    moduleName?: string   // 模块名称（JOIN 查询）
    title: string
    content: string
    status: string
    priority: string
    assigneeId: string
    assigneeName?: string
    assigneeAvatar?: string
    creatorId: string
    creatorName?: string
    creatorAvatar?: string
    dueDate: number
    progress: number
    order: number
    createdAt: number
    updatedAt: number
    tags: Tag[]           // 任务标签列表
    commentCount: number  // 评论数量
  }
}
```

**权限检查**: 需要是项目成员（member 及以上权限）

---

### 3. 创建任务

**接口**: `POST /api/task/create`

**用途**: 在项目中创建新任务

**Body 参数**:
```typescript
{
  projectId: string       // 必填，项目 ID
  moduleId?: string       // 可选，模块 ID
  title: string           // 必填，任务标题
  content?: string        // 可选，任务内容
  status?: string         // 可选，默认 'todo'
  priority?: string       // 可选，默认 'medium'
  assigneeId?: string     // 可选，负责人 ID
  dueDate?: number        // 可选，截止日期
  progress?: number       // 可选，默认 0
  tags?: string[]         // 可选，标签 ID 数组
}
```

**响应数据**:
```typescript
{
  success: true,
  message: 'Task created successfully',
  data: Task              // 创建的任务详情
}
```

**业务逻辑**:
1. 自动设置 `creatorId` 为当前用户
2. 生成唯一的 `taskId`（UUID）
3. 设置 `order` 为当前最大值 + 1
4. 如果提供了 `tags`，创建任务标签关联

**权限检查**: 需要是项目成员（member 及以上权限）

---

### 4. 更新任务

**接口**: `PUT /api/task/update`

**用途**: 更新任务信息

**Body 参数**:
```typescript
{
  id: string              // 必填，任务的 _id
  title?: string
  content?: string
  status?: string
  priority?: string
  assigneeId?: string
  moduleId?: string
  dueDate?: number
  progress?: number
  tags?: string[]         // 标签 ID 数组（会完全替换现有标签）
}
```

**响应数据**:
```typescript
{
  success: true,
  message: 'Task updated successfully',
  data: Task              // 更新后的任务详情
}
```

**业务逻辑**:
1. 更新 `updatedAt` 时间戳
2. 记录变更历史到 `TaskHistory` 表
3. 如果修改了 `assigneeId`，创建通知
4. 如果提供了 `tags`，更新任务标签关联

**权限检查**: 需要是项目成员（member 及以上权限）

---

### 5. 删除任务

**接口**: `DELETE /api/task/delete`

**用途**: 删除任务

**Body 参数**:
```typescript
{
  id: string              // 必填，任务的 _id
}
```

**响应数据**:
```typescript
{
  success: true,
  message: 'Task deleted successfully',
  data: null
}
```

**业务逻辑**:
- 级联删除任务的评论、标签关联、历史记录

**权限检查**: 需要是项目管理员（admin 及以上权限）或任务创建者

---

### 6. 批量更新任务顺序

**接口**: `PUT /api/task/updateOrder`

**用途**: 拖拽排序时批量更新任务顺序

**Body 参数**:
```typescript
{
  tasks: Array<{
    id: string            // 任务 _id
    order: number         // 新的排序值
    status?: string       // 可选，跨列拖拽时更新状态
  }>
}
```

**响应数据**:
```typescript
{
  success: true,
  message: 'Task order updated successfully',
  data: null
}
```

**权限检查**: 需要是项目成员（member 及以上权限）

---

## 三、标签管理 API

### 7. 获取项目标签列表

**接口**: `GET /api/tag/list`

**用途**: 获取项目下的所有标签

**Query 参数**:
```typescript
{
  projectId: string       // 必填，项目 ID
}
```

**响应数据**:
```typescript
{
  success: true,
  message: 'Success',
  data: {
    items: Tag[],
    total: number
  }
}
```

**Tag 数据结构**:
```typescript
{
  _id: string
  projectId: string
  name: string            // 标签名称
  color: string           // 标签颜色（HEX）
  createdAt: number
  taskCount?: number      // 该标签下的任务数量（可选）
}
```

**权限检查**: 需要是项目成员（member 及以上权限）

---

### 8. 创建标签

**接口**: `POST /api/tag/create`

**用途**: 为项目创建新标签

**Body 参数**:
```typescript
{
  projectId: string       // 必填，项目 ID
  name: string            // 必填，标签名称
  color?: string          // 可选，标签颜色，默认随机生成
}
```

**响应数据**:
```typescript
{
  success: true,
  message: 'Tag created successfully',
  data: Tag
}
```

**业务逻辑**:
- 检查同一项目下标签名称是否重复

**权限检查**: 需要是项目成员（member 及以上权限）

---

### 9. 删除标签

**接口**: `DELETE /api/tag/delete`

**用途**: 删除标签

**Body 参数**:
```typescript
{
  id: string              // 必填，标签 _id
}
```

**响应数据**:
```typescript
{
  success: true,
  message: 'Tag deleted successfully',
  data: null
}
```

**业务逻辑**:
- 级联删除任务标签关联

**权限检查**: 需要是项目管理员（admin 及以上权限）

---

## 四、评论功能 API

### 10. 获取任务评论列表

**接口**: `GET /api/comment/list`

**用途**: 获取任务的所有评论

**Query 参数**:
```typescript
{
  taskId: string          // 必填，任务 _id
  page?: number           // 可选，页码
  size?: number           // 可选，每页数量
}
```

**响应数据**:
```typescript
{
  success: true,
  message: 'Success',
  data: {
    items: Comment[],
    total: number,
    page: number,
    size: number
  }
}
```

**Comment 数据结构**:
```typescript
{
  _id: string
  taskId: string
  userId: string
  userName: string        // 评论用户名称（JOIN 查询）
  userAvatar: string      // 评论用户头像（JOIN 查询）
  content: string         // 评论内容
  mentionedUsers: string  // @提醒的用户 ID 列表（JSON 数组字符串）
  createdAt: number
  updatedAt: number
}
```

**权限检查**: 需要是项目成员（member 及以上权限）

---

### 11. 创建评论

**接口**: `POST /api/comment/create`

**用途**: 为任务添加评论

**Body 参数**:
```typescript
{
  taskId: string          // 必填，任务 _id
  content: string         // 必填，评论内容
  mentionedUsers?: string[] // 可选，@提醒的用户 ID 数组
}
```

**响应数据**:
```typescript
{
  success: true,
  message: 'Comment created successfully',
  data: Comment
}
```

**业务逻辑**:
1. 自动设置 `userId` 为当前用户
2. 如果有 `mentionedUsers`，创建通知

**权限检查**: 需要是项目成员（member 及以上权限）

---

### 12. 更新评论

**接口**: `PUT /api/comment/update`

**用途**: 编辑评论内容

**Body 参数**:
```typescript
{
  id: string              // 必填，评论 _id
  content: string         // 必填，新的评论内容
}
```

**响应数据**:
```typescript
{
  success: true,
  message: 'Comment updated successfully',
  data: Comment
}
```

**权限检查**: 只能编辑自己的评论

---

### 13. 删除评论

**接口**: `DELETE /api/comment/delete`

**用途**: 删除评论

**Body 参数**:
```typescript
{
  id: string              // 必填，评论 _id
}
```

**响应数据**:
```typescript
{
  success: true,
  message: 'Comment deleted successfully',
  data: null
}
```

**权限检查**: 只能删除自己的评论，或项目管理员可删除任何评论

---

## 五、任务历史 API

### 14. 获取任务历史记录

**接口**: `GET /api/task/history`

**用途**: 获取任务的变更历史

**Query 参数**:
```typescript
{
  taskId: string          // 必填，任务 _id
  page?: number           // 可选，页码
  size?: number           // 可选，每页数量
}
```

**响应数据**:
```typescript
{
  success: true,
  message: 'Success',
  data: {
    items: TaskHistory[],
    total: number,
    page: number,
    size: number
  }
}
```

**TaskHistory 数据结构**:
```typescript
{
  _id: string
  taskId: string
  userId: string
  userName: string        // 操作用户名称（JOIN 查询）
  userAvatar: string      // 操作用户头像（JOIN 查询）
  field: string           // 变更字段名
  oldValue: string        // 旧值（JSON）
  newValue: string        // 新值（JSON）
  action: string          // 操作类型: create, update, delete
  createdAt: number
}
```

**权限检查**: 需要是项目成员（member 及以上权限）

---

## 六、模块管理 API

### 15. 获取项目模块列表

**接口**: `GET /api/module/list`

**用途**: 获取项目的所有模块（用于任务归属选择）

**Query 参数**:
```typescript
{
  projectId: string       // 必填，项目 ID
}
```

**响应数据**:
```typescript
{
  success: true,
  message: 'Success',
  data: {
    items: Module[],
    total: number
  }
}
```

**Module 数据结构**:
```typescript
{
  _id: string
  projectId: string
  name: string            // 模块名称
  color: string           // 模块颜色
  parentId: string        // 父模块 ID（'0' 表示根模块）
  order: number           // 排序字段
  createdAt: number
  updatedAt: number
  taskCount?: number      // 该模块下的任务数量（可选）
}
```

**权限检查**: 需要是项目成员（member 及以上权限）

---

### 16. 创建模块

**接口**: `POST /api/module/create`

**用途**: 为项目创建新模块

**Body 参数**:
```typescript
{
  projectId: string       // 必填，项目 ID
  name: string            // 必填，模块名称
  color?: string          // 可选，模块颜色
  parentId?: string       // 可选，父模块 ID，默认 '0'
}
```

**响应数据**:
```typescript
{
  success: true,
  message: 'Module created successfully',
  data: Module
}
```

**权限检查**: 需要是项目管理员（admin 及以上权限）

---

## 七、实现优先级

根据任务详情页的核心功能，建议按以下优先级实现：

### 高优先级（MVP 必需）
1. ✅ 任务基本操作
   - `GET /api/task/list` - 获取任务列表
   - `GET /api/task/detail` - 获取任务详情
   - `POST /api/task/create` - 创建任务
   - `PUT /api/task/update` - 更新任务
   - `DELETE /api/task/delete` - 删除任务

2. ✅ 标签管理（基础）
   - `GET /api/tag/list` - 获取标签列表
   - `POST /api/tag/create` - 创建标签

### 中优先级（增强功能）
3. 评论功能
   - `GET /api/comment/list` - 获取评论列表
   - `POST /api/comment/create` - 创建评论
   - `DELETE /api/comment/delete` - 删除评论

4. 模块管理
   - `GET /api/module/list` - 获取模块列表
   - `POST /api/module/create` - 创建模块

### 低优先级（可延后）
5. 高级功能
   - `PUT /api/task/updateOrder` - 批量更新任务顺序
   - `GET /api/task/history` - 获取任务历史
   - `PUT /api/comment/update` - 更新评论
   - `DELETE /api/tag/delete` - 删除标签

---

## 八、注意事项

### 1. 主键字段规范
- ⚠️ Kooboo ORM 自动生成 `_id` 字段（string 类型）作为主键
- 所有外键引用必须指向 `_id` 字段
- 任务表额外维护 `taskId`（UUID）用于前端兼容

### 2. 数据字段对齐
- 前端使用驼峰命名（camelCase）
- 数据库使用蛇形命名（snake_case）
- 在 SQL SELECT 中使用 `as` 做字段转换：
  ```sql
  SELECT
    _id,
    task_id as taskId,
    created_at as createdAt,
    updated_at as updatedAt
  FROM tasks
  ```

### 3. 关联查询优化
- 使用 LEFT JOIN 获取关联数据（用户名、模块名等）
- 避免 N+1 查询问题
- 示例：
  ```sql
  SELECT
    t.*,
    u1.display_name as assigneeName,
    u2.display_name as creatorName,
    m.name as moduleName
  FROM tasks t
  LEFT JOIN users u1 ON t.assignee_id = u1._id
  LEFT JOIN users u2 ON t.creator_id = u2._id
  LEFT JOIN modules m ON t.module_id = m._id
  WHERE t._id = @id
  ```

### 4. 统计数据
- 评论数量、标签数量等使用 COUNT 聚合
- 可以在列表接口中添加，也可以单独查询

### 5. 时间戳处理
- 所有时间字段使用 UNIX 时间戳（整数）
- JavaScript: `Date.now()`
- 返回给前端时保持整数格式，由前端格式化

---

## 九、API 文件组织

按照后端开发规范，建议创建以下 API 文件：

```
kb-task/src/api/
├── project.ts           # ✅ 已存在
├── task.ts              # 🆕 需要创建 - 任务基本操作
├── tag.ts               # 🆕 需要创建 - 标签管理
├── comment.ts           # 🆕 需要创建 - 评论功能
└── module.ts            # 🆕 需要创建 - 模块管理
```

每个文件使用 `@k-url /api/{resource}/{action}` 格式定义路由。

---

**文档版本**: v1.0
**创建日期**: 2025-10-26
**最后更新**: 2025-10-26
