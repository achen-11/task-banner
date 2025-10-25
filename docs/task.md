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

<!-- task-id: 1761393786292-rmieavzbv -->
#### 1. 整理Api 开发规范

**状态：** 已完成
**优先级：** 中
**创建时间：** 2025/10/25 20:03:06
**更新时间：** 2025/10/25 21:10:00

**任务描述：**

- [x] 1. @k-url 的定义, 动态路由的匹配需要在@k-url 中体现, 比如"/api/project/{action}", action用来作为动态匹配的子路由定义
- [x] 2. 约定少用{id}这种形式来获取 id, 动态路由尽量就只使用{action}, 向 id 这种可以携带在 query 或者 body
- [x] 3. 统一响应工具不用分那么多, 有一个成功和一个失败(通配)就好了
- [x] 4. claude 是否有标准的这种用来表示规则或者偏好的文件, 如果有可以把这些纳入规则标准

**完成内容：**

### 1. 路由定义规范优化

**核心变更：**
- ✅ 使用 `@k-url /api/resource/{action}` 格式
- ✅ `{action}` 用于动态匹配子路由（list, detail, create, update, delete）
- ✅ **避免使用 `{id}` 路径参数**，改用 query 或 body 传递

**示例：**
```typescript
// 文件: kb-task/src/api/project.ts
// @k-url /api/project/{action}

// GET /api/project/list?page=1&size=20
k.api.get("list", () => {
  const query = k.request.queryString
  const page = parseInt(query?.page) || 1
  // ...
})

// GET /api/project/detail?id=1
k.api.get("detail", () => {
  const id = parseInt(k.request.queryString?.id)
  // ...
})

// POST /api/project/create
k.api.post("create", (body: any) => {
  const { name, description } = body
  // ...
})

// PUT /api/project/update
k.api.put("update", (body: any) => {
  const { id, name } = body  // ID 通过 body 传递
  // ...
})

// DELETE /api/project/delete
k.api.delete("delete", (body: any) => {
  const { id } = body  // ID 通过 body 传递
  // ...
})
```

**优势：**
1. **统一性**：所有 ID 通过 query 或 body 传递，接口更一致
2. **灵活性**：query 和 body 更容易扩展参数
3. **简洁性**：@k-url 定义更简单，只需要 {action}

### 2. 统一响应格式简化

**只保留两个核心函数：**

```typescript
/**
 * 成功响应
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
 * 错误响应（通用）
 */
export function error(message: string, code: number = 400, err?: any) {
  // 500 级别错误自动记录日志
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

**使用示例：**
```typescript
// 成功
return success({ id: 1, name: 'John' })
return success({ items: [...], total: 100, page: 1, pageSize: 20 })

// 各种错误（通过 code 区分）
return error('Invalid parameters', 400)
return error('Unauthorized', 401)
return error('Forbidden', 403)
return error('Not found', 404)
return error('Internal server error', 500, err)
```

**优点：**
- 简化 API：只需记住两个函数
- 统一格式：所有响应格式一致
- 灵活性：通过 code 参数支持所有 HTTP 状态码
- 自动日志：500 错误自动记录日志

### 3. 创建 .claud.md 偏好文件

**文件：** `.claud.md`

Claude Code 支持使用 `.claud.md` 文件定义项目开发规范和偏好设置。这个文件放在项目根目录，AI 会自动读取并遵守其中的规则。

**文件内容包括：**

1. **项目结构**：清晰的目录组织
2. **后端 API 规范**：
   - 路由定义（@k-url /api/resource/{action}）
   - 参数传递规范
   - 统一响应格式
   - 标准 API 流程
   - 数据库操作
3. **前端开发规范**：
   - Vue 3 Composition API
   - Tailwind CSS
   - 组件结构
4. **代码风格**：
   - 导入顺序
   - 命名规范
   - TypeScript 类型
5. **安全规范**：
   - SQL 注入防护
   - 鉴权检查
   - 权限检查
6. **文档和注释**：函数注释、复杂逻辑说明
7. **提交前检查清单**
8. **参考文档链接**
9. **开发原则**

**作用：**
- 为 AI 提供明确的开发规范
- 为团队成员提供统一的代码风格指南
- 确保代码质量和一致性
- 简化新成员上手过程

### 4. 完整更新开发规范文档

**文件：** `docs/Backend-Development-Guide.md`

已完全重写开发规范文档，包含：

1. **API 开发规范**（重点优化）：
   - 使用 `@k-url /api/resource/{action}` 格式
   - 详细的路由定义示例（方式一：动态路由，方式二：简单路由）
   - 参数传递规范表格
   - 避免 {id} 路径参数的说明

2. **统一响应格式**（简化）：
   - 只保留 success 和 error 两个函数
   - 详细的使用示例
   - 响应格式说明

3. **数据库、错误处理、认证权限、开发流程**（保持）

4. **完整示例**（更新）：
   - 使用新的路由定义方式
   - 使用简化的响应函数
   - 任务管理 API 完整实现

5. **常见问题**（新增）：
   - Q1: 为什么要避免路径参数 {id}？
   - Q2-Q4: ORM、多表查询、分页查询等

**文件对比：**

| 旧规范 | 新规范 |
|-------|-------|
| `@k-url /api/projects` | `@k-url /api/project/{action}` |
| `GET /api/projects/{id}` | `GET /api/project/detail?id=1` |
| `POST /api/projects/{id}/members` | `POST /api/project/members` + body: {projectId} |
| 8个响应函数 | 2个响应函数（success + error） |

### 总结

✅ **已完成所有优化要求：**
1. 路由定义使用 `{action}` 动态匹配
2. ID 通过 query 或 body 传递
3. 响应工具简化为 success 和 error
4. 创建了 .claud.md 标准偏好文件

**修改文件：**
- `kb-task/src/code/Utils/response.ts` - 简化为2个函数
- `docs/Backend-Development-Guide.md` - 完全重写
- `.claud.md` - 新建项目偏好文件

---


> 📅 导出时间：2025/10/25 20:58:52
> 🤖 由 Task Banner 生成