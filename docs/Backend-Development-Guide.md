# TaskFlow 服务端开发规范

## 1. 技术栈

- **语言:** TypeScript (Kooboo 运行时)
- **数据库:** SQLite
- **ORM:** K_SQLITE_ORM (封装 k.DB.sqlite)
- **API:** k.api (Kooboo API 框架)

---

## 2. API 开发规范

### 2.1 文件位置和路由声明

所有 API 文件必须放在 `kb-task/src/api/` 目录下，使用 `@k-url` 声明路由。

**核心原则：**
- ✅ 在 `@k-url` 中使用 `{action}` 定义动态路由
- ✅ 避免在路径中使用 `{id}`，改用 query 或 body 传递
- ✅ 一个文件对应一组相关的 API 端点

### 2.2 路由定义方式

#### 方式一：使用 {action} 动态路由（推荐）

```typescript
// 文件: kb-task/src/api/project.ts
// @k-url /api/project/{action}

import { success, error } from 'code/Utils/response'
import { getUserInfo } from 'code/Services/user'

// GET /api/project/list?page=1&size=20
k.api.get("list", () => {
  if (!k.account.isLogin) {
    return error('Unauthorized', 401)
  }

  const currentUser = getUserInfo(k.account.user.current.userName)
  const query = k.request.queryString
  const page = parseInt(query?.page) || 1
  const size = parseInt(query?.size) || 20

  const projects = getUserProjects(currentUser.id)

  return success({
    items: projects,
    total: projects.length,
    page,
    size
  })
})

// GET /api/project/detail?id=1
k.api.get("detail", () => {
  if (!k.account.isLogin) {
    return error('Unauthorized', 401)
  }

  const currentUser = getUserInfo(k.account.user.current.userName)
  const query = k.request.queryString
  const projectId = parseInt(query?.id)

  if (!projectId || isNaN(projectId)) {
    return error('Invalid project ID', 400)
  }

  // 权限检查
  if (!checkProjectPermission(projectId, currentUser.id, 'member')) {
    return error('Forbidden', 403)
  }

  try {
    const project = getProjectById(projectId)

    if (!project) {
      return error('Project not found', 404)
    }

    return success(project)

  } catch (err) {
    return error('Failed to get project', 500, err)
  }
})

// POST /api/project/create
k.api.post("create", (body: any) => {
  if (!k.account.isLogin) {
    return error('Unauthorized', 401)
  }

  const currentUser = getUserInfo(k.account.user.current.userName)
  const { name, description, color } = body

  if (!name || name.trim() === '') {
    return error('Project name is required', 400)
  }

  try {
    const projectId = createProject(
      { name: name.trim(), description, color },
      currentUser.id
    )

    const project = getProjectById(projectId)
    return success(project, 'Project created successfully')

  } catch (err) {
    return error('Failed to create project', 500, err)
  }
})

// PUT /api/project/update
k.api.put("update", (body: any) => {
  if (!k.account.isLogin) {
    return error('Unauthorized', 401)
  }

  const currentUser = getUserInfo(k.account.user.current.userName)
  const { id, name, description, color } = body

  if (!id || isNaN(parseInt(id))) {
    return error('Invalid project ID', 400)
  }

  const projectId = parseInt(id)

  // 权限检查
  if (!checkProjectPermission(projectId, currentUser.id, 'admin')) {
    return error('Forbidden', 403)
  }

  try {
    const success = updateProject(projectId, {
      name: name?.trim(),
      description,
      color
    })

    if (!success) {
      return error('Failed to update project', 500)
    }

    const project = getProjectById(projectId)
    return success(project, 'Project updated successfully')

  } catch (err) {
    return error('Failed to update project', 500, err)
  }
})

// DELETE /api/project/delete
k.api.delete("delete", (body: any) => {
  if (!k.account.isLogin) {
    return error('Unauthorized', 401)
  }

  const currentUser = getUserInfo(k.account.user.current.userName)
  const { id } = body

  if (!id || isNaN(parseInt(id))) {
    return error('Invalid project ID', 400)
  }

  const projectId = parseInt(id)

  // 权限检查（需要 owner 权限）
  if (!checkProjectPermission(projectId, currentUser.id, 'owner')) {
    return error('Only project owner can delete the project', 403)
  }

  try {
    const deleted = deleteProject(projectId)

    if (!deleted) {
      return error('Failed to delete project', 500)
    }

    return success(null, 'Project deleted successfully')

  } catch (err) {
    return error('Failed to delete project', 500, err)
  }
})

// GET /api/project/members?projectId=1
k.api.get("members", () => {
  if (!k.account.isLogin) {
    return error('Unauthorized', 401)
  }

  const currentUser = getUserInfo(k.account.user.current.userName)
  const query = k.request.queryString
  const projectId = parseInt(query?.projectId)

  if (!projectId || isNaN(projectId)) {
    return error('Invalid project ID', 400)
  }

  // 权限检查
  if (!checkProjectPermission(projectId, currentUser.id, 'member')) {
    return error('Forbidden', 403)
  }

  try {
    const members = getProjectMembers(projectId)
    return success(members)

  } catch (err) {
    return error('Failed to get members', 500, err)
  }
})
```

#### 方式二：简单路由（无动态部分）

```typescript
// 文件: kb-task/src/api/auth.ts
// @k-url /api/auth

// POST /api/auth/login
k.api.post("login", (body: any) => {
  const { username, password } = body
  // 登录逻辑...
})

// POST /api/auth/logout
k.api.post("logout", () => {
  // 登出逻辑...
})
```

### 2.3 参数传递规范

| 参数类型 | 传递方式 | 使用场景 | 获取方式 |
|---------|---------|---------|---------|
| ID、过滤条件 | Query 参数 | GET 请求 | `k.request.queryString.id` |
| 创建/更新数据 | Body | POST/PUT/DELETE | 函数参数 `body` |
| 分页参数 | Query 参数 | GET 列表请求 | `k.request.queryString` |
| 认证 token | Header | 所有请求 | `k.request.headers.get('Authorization')` |

**示例：**

```typescript
// ✅ 推荐：ID 通过 query 传递
// GET /api/project/detail?id=1
k.api.get("detail", () => {
  const projectId = parseInt(k.request.queryString?.id)
})

// ✅ 推荐：ID 通过 body 传递（更新/删除操作）
// POST /api/project/update
k.api.post("update", (body: any) => {
  const { id, name } = body
})

// ❌ 避免：路径中的 {id}
// GET /api/project/{id}  // 不推荐
```

---

## 3. 统一响应格式

### 3.1 响应工具类

只提供两个核心函数：`success` 和 `error`

**文件：** `kb-task/src/code/Utils/response.ts`

```typescript
/**
 * 成功响应
 * @param data 返回的数据（可以是对象、数组等任何类型）
 * @param message 成功消息，默认 'Success'
 */
export function success<T = any>(data: T, message: string = 'Success') {
  k.response.json({
    code: 200,
    message,
    data
  })
  return k.api.ok()
}

/**
 * 错误响应
 * @param message 错误消息
 * @param code HTTP 状态码，默认 400
 * @param error 错误对象（可选），用于记录日志
 */
export function error(message: string, code: number = 400, err?: any) {
  // 记录错误日志（仅 500 级别错误）
  if (code >= 500 && err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    k.logger.error('ServerError', errorMessage)
  }

  k.response.json({
    code,
    message,
    data: null
  })
  return k.api.httpCode(code)
}
```

### 3.2 响应格式

所有 API 返回统一格式：

```typescript
{
  code: number,    // 状态码：200 成功，400+ 错误
  message: string, // 响应消息
  data: any        // 响应数据，成功时返回数据，失败时返回 null
}
```

### 3.3 使用示例

```typescript
// 单个对象
return success({ id: 1, name: 'John' })

// 列表数据（带分页信息）
return success({
  items: [...],
  total: 100,
  page: 1,
  pageSize: 20
})

// 常见错误状态码
return error('Invalid parameters', 400)        // 参数错误
return error('Unauthorized', 401)              // 未授权
return error('Forbidden', 403)                 // 禁止访问
return error('Not found', 404)                 // 未找到
return error('Internal server error', 500, err) // 服务器错误
```

---

## 4. 数据库操作规范

### 4.1 使用 K_SQLITE_ORM

**优先使用 ORM 方式**操作数据库，避免手写 SQL：

```typescript
import { Project } from 'code/Models/project'

// ✅ 推荐：使用 ORM
const project = Project.findById(projectId)
const projects = Project.findAll({ userId })
const newId = Project.create({ name, description })
Project.updateById(projectId, { name: newName })
Project.removeById(projectId) // 软删除
```

### 4.2 模型定义规范

#### ⚠️ 重要：Kooboo 主键规范

**Kooboo 的 ORM 会自动为每个表生成 `_id` 字段作为主键**，因此：

- ❌ **禁止**手动定义 `id` 字段并设置 `primaryKey: true`
- ❌ **禁止**使用 `autoincrement: true`
- ✅ **允许**定义自定义 ID 字段（如 `taskId`），但不要设为主键
- ✅ 使用 ORM 自动生成的 `_id` 作为主键
- ⚠️ **注意**：`_id` 字段类型是 **string（字符串）**，不是 number

**错误示例（会导致"more than one primary key"错误）：**

```typescript
// ❌ 错误：与自动生成的 _id 冲突
export const Project = ksql.define('projects', {
  id: {
    type: DataTypes.Number,
    primaryKey: true,       // ❌ 禁止
    autoincrement: true     // ❌ 禁止
  },
  name: { type: DataTypes.String, required: true }
})
```

**正确示例：**

```typescript
// 文件: kb-task/src/code/Models/project.ts
import { ksql, DataTypes } from 'module/k_sqlite'

// ✅ 正确：不定义 id 字段，使用自动生成的 _id
export const Project = ksql.define(
  'projects',
  {
    name: {
      type: DataTypes.String,
      required: true,
      index: true
    },
    description: {
      type: DataTypes.String,
      default: ''
    },
    color: {
      type: DataTypes.String,
      default: '#6366f1'
    },
    ownerId: {
      type: DataTypes.Number,
      required: true,
      index: true
    }
  },
  {
    timestamps: true,      // 自动添加 createdAt, updatedAt
    softDelete: false      // 项目不使用软删除
  }
)
```

**如果需要自定义 ID 字段（例如任务的 taskId）：**

```typescript
// ✅ 正确：定义自定义 ID 字段，但不设为主键
export const Task = ksql.define('tasks', {
  taskId: {
    type: DataTypes.String,
    required: true,
    unique: true,        // 可以设为唯一
    index: true,         // 可以建索引
    default: () => `task_${Date.now()}`
    // 注意：不设置 primaryKey: true
  },
  title: { type: DataTypes.String, required: true }
})
```

**外键引用规范：**

所有外键引用必须指向 `_id` 字段（字符串类型）：

```typescript
export const ProjectMember = ksql.define('project_members', {
  projectId: {
    type: DataTypes.String,  // ⚠️ 外键类型必须是 String，因为 _id 是字符串
    required: true,
    ref: {
      tableName: 'projects',
      fieldName: '_id',      // ✅ 引用 _id，不是 id
      onDelete: 'CASCADE'
    }
  }
})
```

**重要提示：_id 字段类型**

```typescript
// ✅ 正确：Service 层接口定义
export interface ProjectInfo {
  _id: string              // ⚠️ 必须是 string，不是 number
  name: string
  description: string
  ownerId: number
}

// ✅ 正确：Service 函数签名
export function getProjectById(projectId: string): ProjectInfo | null {
  return Project.findById(projectId)  // projectId 是字符串
}

// ✅ 正确：API 层参数验证
const { id } = body
if (!id || typeof id !== 'string' || id.trim() === '') {
  return error('Invalid project ID', 400)
}
// ❌ 错误：不要使用 parseInt(id)
```

### 4.3 Service 层规范

创建 Service 层处理复杂业务逻辑：

```typescript
// 文件: kb-task/src/code/Services/project.ts
import { Project } from 'code/Models/project'
import { ProjectMember } from 'code/Models/projectMember'

/**
 * 创建项目
 */
export function createProject(
  data: { name: string; description?: string; color?: string },
  creatorId: number
): number {
  // 1. 创建项目
  const projectId = Project.create({
    name: data.name,
    description: data.description || '',
    color: data.color || '#6366f1',
    ownerId: creatorId
  })

  // 2. 添加创建者为项目所有者
  ProjectMember.create({
    projectId,
    userId: creatorId,
    role: 'owner'
  })

  return projectId
}

/**
 * 获取项目详情
 */
export function getProjectById(projectId: number) {
  return Project.findById(projectId)
}

/**
 * 检查项目权限
 */
export function checkProjectPermission(
  projectId: number,
  userId: number,
  requiredRole: 'owner' | 'admin' | 'member'
): boolean {
  const member = ProjectMember.findOne({ projectId, userId })

  if (!member) return false

  const roleLevel = { owner: 3, admin: 2, member: 1 }
  return roleLevel[member.role] >= roleLevel[requiredRole]
}
```

### 4.4 原生 SQL（仅在必要时使用）

如果 ORM 无法满足需求，可以使用原生 SQL，但**必须使用命名参数**防止 SQL 注入：

```typescript
// ❌ 危险：SQL 注入风险
const sql = `SELECT * FROM users WHERE id = ${userId}`  // 永远不要这样做

// ✅ 安全：使用命名参数
const user = k.DB.sqlite.get(
  'SELECT * FROM users WHERE id = @userId',
  { userId }
)
```

---

## 5. 错误处理规范

### 5.1 标准错误处理模式

```typescript
k.api.post("create", (body: any) => {
  try {
    // 1. 鉴权检查
    if (!k.account.isLogin) {
      return error('Unauthorized', 401)
    }

    // 2. 获取当前用户
    const username = k.account.user.current.userName
    const currentUser = getUserInfo(username)

    // 3. 参数验证
    const { name, description } = body
    if (!name || name.trim() === '') {
      return error('Project name is required', 400)
    }

    // 4. 业务逻辑
    const projectId = createProject(
      { name: name.trim(), description },
      currentUser.id
    )

    // 5. 返回成功
    const project = getProjectById(projectId)
    return success(project, 'Project created successfully')

  } catch (err) {
    // 6. 捕获并记录错误
    return error('Failed to create project', 500, err)
  }
})
```

### 5.2 TypeScript 错误类型处理

在 catch 块中，error 类型为 `unknown`，需要类型检查：

```typescript
try {
  // 业务逻辑
} catch (err) {
  // ✅ 正确：类型检查
  const message = err instanceof Error ? err.message : 'Unknown error'
  k.logger.error('API操作', message)

  return error('操作失败', 500, err)
}
```

---

## 6. 认证和权限规范

### 6.1 鉴权检查

所有需要登录的 API 都必须先检查登录状态：

```typescript
k.api.get("list", () => {
  // 1. 鉴权检查（必须放在第一步）
  if (!k.account.isLogin) {
    return error('Unauthorized', 401)
  }

  // 2. 获取当前用户
  const username = k.account.user.current.userName
  const currentUser = getUserInfo(username)

  // 3. 后续业务逻辑...
})
```

### 6.2 权限检查

对于需要特定权限的操作，使用 Service 层的权限检查函数：

```typescript
k.api.put("update", (body: any) => {
  if (!k.account.isLogin) {
    return error('Unauthorized', 401)
  }

  const currentUser = getUserInfo(k.account.user.current.userName)
  const projectId = parseInt(body.id)

  // 权限检查（需要 admin 权限）
  if (!checkProjectPermission(projectId, currentUser.id, 'admin')) {
    return error('You do not have permission to update this project', 403)
  }

  // 更新逻辑...
})
```

---

## 7. 开发流程规范

### 7.1 API 开发步骤

1. **定义数据模型**（如果需要新表）
   - 在 `kb-task/src/code/Models/` 创建模型文件
   - 使用 K_SQLITE_ORM 定义表结构

2. **创建 Service 层**（如果需要复杂业务逻辑）
   - 在 `kb-task/src/code/Services/` 创建服务文件
   - 封装业务逻辑函数

3. **创建 API 文件**
   - 在 `kb-task/src/api/` 创建 API 文件
   - 使用 `@k-url /api/resource/{action}` 声明路由
   - 导入 Service 和响应工具

4. **实现 API 端点**
   - 按照标准错误处理模式编写代码
   - 使用 `success` 和 `error` 统一响应

5. **测试 API**
   - 测试各种场景（成功、失败、边界情况）

### 7.2 代码组织

```
kb-task/
├── src/
│   ├── api/                    # API 端点
│   │   ├── project.ts          # @k-url /api/project/{action}
│   │   ├── task.ts             # @k-url /api/task/{action}
│   │   └── user.ts             # @k-url /api/user/{action}
│   ├── code/
│   │   ├── Models/             # 数据模型
│   │   │   ├── project.ts
│   │   │   ├── task.ts
│   │   │   └── user.ts
│   │   ├── Services/           # 业务逻辑
│   │   │   ├── project.ts
│   │   │   ├── task.ts
│   │   │   └── user.ts
│   │   └── Utils/              # 工具函数
│   │       └── response.ts     # 响应工具
│   └── db/
│       └── database.db         # SQLite 数据库
```

---

## 8. 最佳实践检查清单

### ⚠️ 必须遵守的规则

- [ ] **@k-url 定义**：使用 `/api/resource/{action}` 格式
- [ ] **参数传递**：ID 通过 query 或 body 传递，避免路径参数
- [ ] **统一响应**：使用 `success` 和 `error` 函数
- [ ] **鉴权检查**：需要登录的 API 必须先检查 `k.account.isLogin`
- [ ] **参数验证**：验证所有必填参数和参数类型
- [ ] **错误处理**：使用 try-catch 捕获错误，并使用 `error()` 返回
- [ ] **权限检查**：敏感操作必须检查用户权限
- [ ] **优先使用 ORM**：避免手写 SQL，使用 K_SQLITE_ORM
- [ ] **SQL 安全**：如果必须使用原生 SQL，使用命名参数防止注入
- [ ] **TypeScript 类型**：正确处理 catch 块中的 error 类型
- [ ] **导入路径**：使用别名导入 (`code/*`)，不使用相对路径

### 推荐实践

- [ ] 为经常查询的字段添加索引
- [ ] 大数据量使用分页查询
- [ ] 记录关键操作日志（使用 `k.logger`）
- [ ] 业务逻辑封装到 Service 层
- [ ] 添加代码注释说明复杂逻辑
- [ ] 保持函数单一职责

---

## 9. 完整示例

### 9.1 任务管理 API 完整实现

```typescript
// 文件: kb-task/src/api/task.ts
// @k-url /api/task/{action}

import { success, error } from 'code/Utils/response'
import { getUserInfo } from 'code/Services/user'
import {
  createTask,
  getTaskById,
  getProjectTasks,
  updateTask,
  deleteTask
} from 'code/Services/task'
import { checkProjectPermission } from 'code/Services/project'

// GET /api/task/detail?id=1
k.api.get("detail", () => {
  if (!k.account.isLogin) {
    return error('Unauthorized', 401)
  }

  const currentUser = getUserInfo(k.account.user.current.userName)
  const query = k.request.queryString
  const taskId = parseInt(query?.id)

  if (!taskId || isNaN(taskId)) {
    return error('Invalid task ID', 400)
  }

  try {
    const task = getTaskById(taskId)

    if (!task) {
      return error('Task not found', 404)
    }

    // 检查项目权限
    if (!checkProjectPermission(task.projectId, currentUser.id, 'member')) {
      return error('You do not have permission to view this task', 403)
    }

    return success(task)

  } catch (err) {
    return error('Failed to get task', 500, err)
  }
})

// GET /api/task/list?projectId=1&page=1&size=20
k.api.get("list", () => {
  if (!k.account.isLogin) {
    return error('Unauthorized', 401)
  }

  const currentUser = getUserInfo(k.account.user.current.userName)
  const query = k.request.queryString
  const projectId = parseInt(query?.projectId)
  const page = parseInt(query?.page) || 1
  const size = parseInt(query?.size) || 20

  if (!projectId || isNaN(projectId)) {
    return error('Project ID is required', 400)
  }

  // 检查项目权限
  if (!checkProjectPermission(projectId, currentUser.id, 'member')) {
    return error('You do not have permission to view tasks in this project', 403)
  }

  try {
    const tasks = getProjectTasks(projectId)

    return success({
      items: tasks,
      total: tasks.length,
      page,
      size
    })

  } catch (err) {
    return error('Failed to get tasks', 500, err)
  }
})

// POST /api/task/create
k.api.post("create", (body: any) => {
  if (!k.account.isLogin) {
    return error('Unauthorized', 401)
  }

  const currentUser = getUserInfo(k.account.user.current.userName)
  const { title, description, projectId, assigneeId, priority, dueDate } = body

  // 参数验证
  if (!title || title.trim() === '') {
    return error('Task title is required', 400)
  }

  if (!projectId) {
    return error('Project ID is required', 400)
  }

  // 检查项目权限
  if (!checkProjectPermission(projectId, currentUser.id, 'member')) {
    return error('You do not have permission to create tasks in this project', 403)
  }

  try {
    const taskId = createTask({
      title: title.trim(),
      description,
      projectId,
      assigneeId,
      priority,
      dueDate
    })

    const task = getTaskById(taskId)
    return success(task, 'Task created successfully')

  } catch (err) {
    return error('Failed to create task', 500, err)
  }
})

// PUT /api/task/update
k.api.put("update", (body: any) => {
  if (!k.account.isLogin) {
    return error('Unauthorized', 401)
  }

  const currentUser = getUserInfo(k.account.user.current.userName)
  const { id, title, description, status, priority, assigneeId, dueDate } = body

  if (!id || isNaN(parseInt(id))) {
    return error('Invalid task ID', 400)
  }

  const taskId = parseInt(id)

  try {
    const task = getTaskById(taskId)

    if (!task) {
      return error('Task not found', 404)
    }

    // 检查项目权限
    if (!checkProjectPermission(task.projectId, currentUser.id, 'member')) {
      return error('You do not have permission to update this task', 403)
    }

    const updated = updateTask(taskId, {
      title: title?.trim(),
      description,
      status,
      priority,
      assigneeId,
      dueDate
    })

    if (!updated) {
      return error('Failed to update task', 500)
    }

    const updatedTask = getTaskById(taskId)
    return success(updatedTask, 'Task updated successfully')

  } catch (err) {
    return error('Failed to update task', 500, err)
  }
})

// DELETE /api/task/delete
k.api.delete("delete", (body: any) => {
  if (!k.account.isLogin) {
    return error('Unauthorized', 401)
  }

  const currentUser = getUserInfo(k.account.user.current.userName)
  const { id } = body

  if (!id || isNaN(parseInt(id))) {
    return error('Invalid task ID', 400)
  }

  const taskId = parseInt(id)

  try {
    const task = getTaskById(taskId)

    if (!task) {
      return error('Task not found', 404)
    }

    // 检查项目权限（需要 admin 权限）
    if (!checkProjectPermission(task.projectId, currentUser.id, 'admin')) {
      return error('You do not have permission to delete this task', 403)
    }

    const deleted = deleteTask(taskId)

    if (!deleted) {
      return error('Failed to delete task', 500)
    }

    return success(null, 'Task deleted successfully')

  } catch (err) {
    return error('Failed to delete task', 500, err)
  }
})
```

---

## 10. 常见问题

### Q1: 为什么要避免路径参数 {id}？

**原因：**
1. 统一性：所有 ID 通过 query 或 body 传递，接口更一致
2. 灵活性：query 和 body 更容易扩展参数
3. 简洁性：@k-url 定义更简单，只需要 {action}

### Q2: 何时使用 ORM，何时使用原生 SQL？

**优先使用 ORM**，只有在以下情况才考虑原生 SQL：
- 复杂的联表查询
- 需要使用 SQL 特有功能（如聚合函数、子查询）
- 性能优化需求

### Q3: 如何处理复杂的多表查询？

可以在 Service 层组合多个 ORM 查询：

```typescript
export function getProjectWithTasks(projectId: number) {
  const project = Project.findById(projectId)
  const tasks = Task.findAll({ projectId })
  const members = ProjectMember.findAll({ projectId })

  return {
    ...project,
    tasks,
    members
  }
}
```

### Q4: 如何实现分页查询？

使用 ORM 的 `findPaginated` 方法：

```typescript
const result = Task.findPaginated(
  { projectId, status: 'pending' },
  {
    page: 1,
    pageSize: 20,
    order: { prop: 'createdAt', order: 'descending' }
  }
)
// 返回: { list, page, pageSize, total }

return success({
  items: result.list,
  total: result.total,
  page: result.page,
  pageSize: result.pageSize
})
```

---

这份规范基于项目实际情况和 Kooboo 框架特性制定，请在开发过程中严格遵守。
