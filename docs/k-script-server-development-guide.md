# K-Script 服务端开发规范

## 概述

本文档基于对K-Script框架和现有项目结构的分析，整理出适用于K-Script的服务端开发规范。K-Script是一个基于TypeScript的同步执行框架，不支持Promise/async/await。

## 核心技术特性

### 1. 执行模式
- **同步执行**：所有代码都是同步执行，没有异步概念
- **不支持Promise/async/await**：不能使用任何异步语法
- **即时响应**：代码执行完成后立即返回结果

### 2. 系统架构
- **基于TypeScript**：完整的类型支持
- **K_SQLITE ORM**：内置SQLite数据库操作
- **k.api**：HTTP请求处理框架
- **k.account**：用户认证系统

## API开发规范

### 1. 文件位置和路由声明

所有API文件必须放在 `kb-task/src/api/` 目录下，使用 `@k-url` 声明路由。

```typescript
// 文件: kb-task/src/api/dashboard.ts
// @k-url /api/dashboard/{action}

import { success, error } from 'code/Utils/response'
import { getUserInfo } from 'code/Services/user'
```

### 2. 路由定义方式

#### 核心原则
- ✅ 使用 `{action}` 动态路由
- ✅ 避免路径参数 `{id}`，改用 query 或 body 传递
- ✅ 一个文件对应一组相关的API端点

#### 正确示例
```typescript
// GET /api/dashboard/data?period=week
k.api.get("data", () => {
  const query = k.request.queryString as unknown as { period?: string }
  // 处理逻辑...
})

// POST /api/dashboard/create
k.api.post("create", (body: any) => {
  const { name, description } = body
  // 处理逻辑...
})
```

#### 错误示例
```typescript
// ❌ 错误：K-Script不支持异步
k.api.get("data", async () => {
  const data = await someAsyncFunction() // 错误！
  return success(data)
})

// ❌ 错误：使用路径参数
// @k-url /api/task/{id}  // 避免这种写法
```

### 3. 参数传递规范

| 参数类型 | 传递方式 | 使用场景 | 获取方式 |
|---------|---------|---------|---------|
| ID、筛选条件 | Query 参数 | GET 请求 | `k.request.queryString` |
| 创建/更新数据 | Body | POST/PUT/DELETE | 函数参数 `body` |
| 分页参数 | Query 参数 | GET 列表请求 | `k.request.queryString` |
| 认证信息 | Header | 所有请求 | `k.account` |

### 4. 统一响应格式

只提供两个核心函数：`success` 和 `error`

```typescript
import { success, error } from 'code/Utils/response'

// 成功响应
return success(data, '操作成功')

// 错误响应
return error('参数错误', 400)
return error('未授权', 401)
return error('权限不足', 403)
return error('资源不存在', 404)
return error('服务器错误', 500, err)
```

### 5. 标准API结构

```typescript
// @k-url /api/resource/{action}

import { success, error } from 'code/Utils/response'
import { getUserInfo } from 'code/Services/user'

k.api.get("action", () => {
  // 1. 鉴权检查（必须放在第一步）
  if (!k.account.isLogin) {
    return error('Unauthorized', 401)
  }

  // 2. 获取当前用户
  const username = k.account.user.current.userName
  const currentUser = getUserInfo(username)

  // 3. 参数验证
  const query = k.request.queryString as unknown as { id?: string }
  const paramId = query?.id

  if (!paramId) {
    return error('参数错误：缺少必需参数', 400)
  }

  // 4. 业务逻辑处理
  try {
    // 同步执行业务逻辑
    const data = someBusinessLogic(paramId, currentUser._id)

    // 5. 返回成功结果
    return success(data, '操作成功')
  } catch (err) {
    // 6. 错误处理
    k.logger.error('API操作错误', err instanceof Error ? err.message : String(err))
    return error('操作失败', 500, err)
  }
})
```

## Service层规范

### 1. 文件位置

所有Service文件必须放在 `kb-task/src/code/Services/` 目录下。

### 2. 函数设计原则

- **纯函数**：给定相同输入，始终返回相同输出
- **同步执行**：不包含任何异步操作
- **单一职责**：每个函数只做一件事
- **类型安全**：明确的TypeScript类型定义

### 3. 标准Service函数

```typescript
// 文件: kb-task/src/code/Services/user.ts

import { User, type UserType } from 'code/Models/User'

export interface UserInfo {
  _id: string
  username: string
  email: string
  displayName: string
  avatar: string
  isAdmin: boolean
}

/**
 * 根据用户名获取用户信息（自动注册）
 * @param username - 用户名
 * @returns 用户信息对象
 */
export function getUserInfo(username: string): UserInfo {
  // 1. 先从数据库查询用户
  let userRecord = User.findOne({ username: username }) as UserType | null

  // 2. 如果用户已存在，直接返回
  if (userRecord) {
    return formatUserInfo(userRecord)
  }

  // 3. 用户不存在，从 Kooboo 账户系统获取信息并自动创建
  const koobooUser = k.account.user.get(username)

  if (!koobooUser) {
    throw new Error(`User not found: ${username}`)
  }

  // 4. 创建新用户记录（同步执行）
  const userId = User.create({
    username: koobooUser.userName,
    email: kooboo.email || `${koobooUser.userName}@example.com`,
    password: '', // Kooboo 统一认证
    displayName: kooboo.fullName || koobooUser.userName,
    avatar: '',
    isAdmin: kooboo.isAdmin || false
  })

  // 5. 查询新创建的用户记录
  userRecord = User.findById(userId) as UserType | null

  if (!userRecord) {
    throw new Error('Failed to create user')
  }

  return formatUserInfo(userRecord)
}

/**
 * 格式化用户信息
 * @param userRecord - 数据库记录
 * @returns 标准化用户信息
 */
function formatUserInfo(userRecord: UserType): UserInfo {
  return {
    _id: userRecord._id,
    username: userRecord.username,
    email: userRecord.email,
    displayName: userRecord.displayName || userRecord.username,
    avatar: userRecord.avatar || '',
    isAdmin: userRecord.isAdmin || false
  }
}
```

## 数据库操作规范

### 1. K_SQLITE ORM 使用

**优先使用ORM方式**，避免手写SQL：

```typescript
import { Task, type TaskType } from 'code/Models/Task'

// ✅ 推荐：使用ORM
const tasks = Task.findAll({
  projectId: 'project_123',
  status: 'todo'
}) as TaskType[]

const task = Task.findById('task_456') as TaskType | null

const taskId = Task.create({
  title: '新任务',
  status: 'todo',
  projectId: 'project_123'
})

const updatedId = Task.updateById('task_456', {
  status: 'completed'
})
```

### 2. 主键规范

**重要：** Kooboo的ORM会自动为每个表生成 `_id` 字段作为主键

```typescript
// ✅ 正确：不定义主键
export const Task = ksql.define('tasks', {
  title: { type: DataTypes.String, required: true },
  status: { type: DataTypes.String, default: 'todo' }
})

// ❌ 错误：与自动生成的 _id 冲突
export const Task = ksql.define('tasks', {
  id: {
    type: DataTypes.Number,
    primaryKey: true,     // ❌ 禁止
    autoincrement: true   // ❌ 禁止
  },
  title: { type: DataTypes.String, required: true }
})
```

### 3. 外键引用

所有外键必须指向 `_id` 字段（字符串类型）：

```typescript
export const Task = ksql.define('tasks', {
  projectId: {
    type: DataTypes.String,  // ⚠️ 外键类型必须是 String
    required: true,
    ref: {
      tableName: 'projects',
      fieldName: '_id',      // ✅ 引用 _id，不是 id
      onDelete: 'CASCADE'
    }
  }
})
```

## 错误处理规范

### 1. 错误类型处理

```typescript
try {
  const result = businessLogic()
  return success(result)
} catch (err) {
  // ✅ 正确：类型检查
  const message = err instanceof Error ? err.message : 'Unknown error'
  k.logger.error('API操作', message)

  if (err instanceof TypeError) {
    return error('数据类型错误', 400, err)
  } else {
    return error('操作失败', 500, err)
  }
}
```

### 2. 参数验证

```typescript
// ✅ 推荐：完整的参数验证
const validateParams = (body: any) => {
  if (!body || typeof body !== 'object') {
    throw new Error('请求体格式错误')
  }

  if (!body.title || typeof body.title !== 'string' || body.title.trim() === '') {
    throw new Error('标题不能为空')
  }

  if (body.priority && !['low', 'medium', 'high'].includes(body.priority)) {
    throw new Error('优先级参数无效')
  }
}

k.api.post("create", (body: any) => {
  if (!k.account.isLogin) {
    return error('Unauthorized', 401)
  }

  try {
    validateParams(body)
    // 业务逻辑...
  } catch (err) {
    return error(err instanceof Error ? err.message : '参数验证失败', 400)
  }
})
```

## 类型定义规范

### 1. 接口定义

```typescript
// ✅ 推荐：明确的接口定义
export interface UserInfo {
  _id: string              // Kooboo自动生成的字符串ID
  username: string
  email: string
  displayName: string
  avatar: string
  isAdmin: boolean
}

export interface TaskInfo {
  _id: string
  title: string
  content: string
  status: 'todo' | 'in_progress' | 'completed'
  priority: 'low' | 'medium' | 'high'
  assigneeId: string
  creatorId: string
  createdAt: number
  updatedAt: number
}
```

### 2. 导出类型

```typescript
// ✅ 推荐：导出类型供其他模块使用
export type TaskType = typeof Task.$type
export type ProjectType = typeof Project.$type

// ✅ 推荐：定义业务接口
export type { TaskInfo, ProjectDetailInfo } from './types'
```

## 性能优化指南

### 1. 数据库查询优化

```typescript
// ✅ 推荐：为查询字段添加索引
export const Task = ksql.define('tasks', {
  projectId: {
    type: DataTypes.String,
    required: true,
    index: true  // 添加索引
  },
  status: {
    type: DataTypes.String,
    default: 'todo',
    index: true  // 添加索引
  }
})

// ✅ 推荐：分页查询大数据量
const getTasksPaginated = (projectId: string, page: number, size: number) => {
  return Task.findPaginated(
    { projectId },
    { page, pageSize: size, order: { prop: 'createdAt', order: 'descending' } }
  )
}
```

### 2. 批量操作优化

```typescript
// ✅ 推荐：使用批量操作
const updateMultipleTasks = (updates: Array<{ id: string; status: string }>) => {
  updates.forEach(update => {
    Task.updateById(update.id, { status: update.status })
  })
}
```

### 3. 查询优化

```typescript
// ✅ 推荐：选择需要的字段
const tasks = Task.findAll(
  { projectId: 'project_123' },
  { select: ['title', 'status', 'priority'] }  // 只选择需要的字段
) as TaskType[]
```

## 测试和调试

### 1. 日志记录

```typescript
// ✅ 推荐：合理使用日志
k.logger.information('API调用', '用户请求任务列表', { userId: '123', projectId: '456' })
k.logger.error('数据库错误', err instanceof Error ? err.message : String(err))
k.logger.debug('调试信息', '参数验证通过', { params: body })
```

### 2. 开发模式

在开发环境中，可以临时添加调试信息：

```typescript
// 只在开发环境执行
if (process.env.NODE_ENV === 'development') {
  k.logger.debug('Debug API Data:', { query, body })
}
```

## 文件组织结构

```
kb-task/
├── src/
│   ├── api/                    # API 端点
│   │   ├── dashboard.ts      # @k-url /api/dashboard/{action}
│   │   ├── project.ts         # @k-url /api/project/{action}
│   │   ├── task.ts           # @k-url /api/task/{action}
│   │   └── user.ts           # @k-url /api/user/{action}
│   └── code/
│       ├── Models/             # 数据模型
│       │   ├── User.ts
│       │   ├── Project.ts
│       │   └── Task.ts
│       ├── Services/           # 业务逻辑层
│       │   ├── user.ts
│       │   ├── project.ts
│       │   ├── task.ts
│       │   └── dashboard.ts
│       ├── Utils/              # 工具函数
│       │   └── response.ts
│       └── k_sqlite/           # ORM配置
└── db/                        # SQLite数据库
    └── database.db
```

## 常见问题与解决方案

### 1. Q: 为什么不能使用Promise/async？
**A:** K-Script是基于同步执行的框架，没有事件循环机制来处理Promise。所有操作都是同步的，执行完成后立即返回结果。

### 2. Q: 如何处理大量数据处理？
**A:**
- 使用分页查询避免一次性加载过多数据
- 使用索引优化查询性能
- 将复杂计算逻辑分解为多个小步骤
- 使用缓存减少重复计算

### 3: Q: 如何实现类似异步的效果？
**A:**
- 对于耗时操作，考虑使用队列机制
- 对于复杂计算，可以分步骤处理
- 使用数据库触发器或存储过程

## 最佳实践检查清单

### ⚠️ 必须遵守的规则

- [ ] **@k-url 定义**：使用 `/api/resource/{action}` 格式
- [ ] **同步执行**：不使用Promise/async/await
- [ ] **统一响应**：使用 `success` 和 `error` 函数
- [ ] **鉴权检查**：需要登录的API必须检查 `k.account.isLogin`
- [ ] **参数验证**：验证所有必填参数和参数类型
- [ ] **错误处理**：使用try-catch捕获错误
- [ ] **主键规范**：只使用自动生成的 `_id` 字段
- [ ] **类型安全**：使用TypeScript类型定义

### 推荐实践

- [ ] **添加索引**：为经常查询的字段添加索引
- [ ] **分页查询**：大数据量时使用分页
- [ ] **日志记录**：记录关键操作和错误
- [ ] **业务逻辑封装**：复杂逻辑放入Service层
- [ ] **代码注释**：为复杂逻辑添加说明
- [ ] **单一职责**：保持函数简单明了