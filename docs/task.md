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

<!-- task-id: 1761439871786-cx4cg20uh -->
#### 1. 任务详情页- api

**状态：** 已完成
**优先级：** 中
**创建时间：** 2025/10/26 08:51:11
**更新时间：** 2025/10/26 09:30:00

**任务描述：**

- [x] 阅读"docs/task-detail-api-requirements.md"
- [x] 优先完成task, module, tag, 这三个模块的 api, 其他例如评论这些可以晚点再支持

**实现细节：**

已完成 Task、Module、Tag 三个模块的完整 API 实现，包括 Service 层和 API 层。

### 实现的功能模块

#### 1. **Task（任务）模块**

**Service 层** (`kb-task/src/code/Services/task.ts`)
- `createTask()` - 创建任务，支持自动设置 order、标签关联
- `getTaskById()` - 获取任务基本信息
- `getTaskDetailById()` - 获取任务详情（包含标签）
- `getProjectTasks()` - 获取项目任务列表，支持多条件筛选
- `updateTask()` - 更新任务信息，支持标签完全替换
- `deleteTask()` - 删除任务，级联删除标签关联
- `batchUpdateTaskOrder()` - 批量更新任务顺序

**API 层** (`kb-task/src/api/task.ts`)
- `GET /api/task/list` - 获取任务列表（支持分页和筛选）
- `GET /api/task/detail` - 获取任务详情
- `POST /api/task/create` - 创建任务
- `PUT /api/task/update` - 更新任务
- `DELETE /api/task/delete` - 删除任务
- `PUT /api/task/updateOrder` - 批量更新任务顺序

#### 2. **Module（模块）模块**

**Service 层** (`kb-task/src/code/Services/module.ts`)
- `createModule()` - 创建模块，自动设置 order
- `getModuleById()` - 获取模块信息
- `getProjectModules()` - 获取项目所有模块，按层级排序
- `updateModule()` - 更新模块信息
- `deleteModule()` - 删除模块

**API 层** (`kb-task/src/api/module.ts`)
- `GET /api/module/list` - 获取项目模块列表
- `GET /api/module/detail` - 获取模块详情
- `POST /api/module/create` - 创建模块（需要 admin 权限）
- `PUT /api/module/update` - 更新模块（需要 admin 权限）
- `DELETE /api/module/delete` - 删除模块（需要 admin 权限）

#### 3. **Tag（标签）模块**

**Service 层** (`kb-task/src/code/Services/tag.ts`)
- `createTag()` - 创建标签，检查名称重复
- `getTagById()` - 获取标签信息
- `getProjectTags()` - 获取项目所有标签
- `updateTag()` - 更新标签，检查名称重复
- `deleteTag()` - 删除标签，级联删除任务关联

**API 层** (`kb-task/src/api/tag.ts`)
- `GET /api/tag/list` - 获取项目标签列表
- `GET /api/tag/detail` - 获取标签详情
- `POST /api/tag/create` - 创建标签
- `PUT /api/tag/update` - 更新标签
- `DELETE /api/tag/delete` - 删除标签（需要 admin 权限）

### 技术要点

**架构设计**
- 严格遵循三层架构：Model -> Service -> API
- Model 层已存在，直接复用（Task.ts, Module.ts, Tag.ts）
- Service 层封装业务逻辑，提供类型安全的接口
- API 层负责路由、参数验证、权限检查

**统一规范**
- ✅ 使用 `@k-url /api/{resource}/{action}` 路由格式
- ✅ 使用 `success()` 和 `error()` 统一响应格式
- ✅ 所有接口进行鉴权检查（`k.account.isLogin`）
- ✅ 根据操作类型检查项目成员权限
- ✅ 外键统一使用 Kooboo 自动生成的 `_id`（string 类型）
- ✅ 时间戳使用 UNIX timestamp（number 类型）

**权限控制**
- **Task API**：
  - 创建/更新/查看：需要项目成员（member）权限
  - 删除：需要项目管理员（admin）或任务创建者
- **Module API**：
  - 查看：需要项目成员（member）权限
  - 创建/更新/删除：需要项目管理员（admin）权限
- **Tag API**：
  - 查看/创建/更新：需要项目成员（member）权限
  - 删除：需要项目管理员（admin）权限

**业务逻辑**
- 任务创建时自动设置 order（最大值 + 1）
- 任务支持标签关联，更新时可完全替换标签
- 模块支持多级嵌套（通过 parentId）
- 标签名称在同一项目内唯一
- 删除操作自动级联清理关联数据

**错误处理**
- 统一使用 try-catch 捕获异常
- 使用 `k.logger.error()` 记录错误日志
- 区分不同错误类型返回适当的 HTTP 状态码
- 特殊错误（如名称重复）返回详细错误信息

### 相关文件

**Service 层**
- `kb-task/src/code/Services/task.ts` - 任务服务（新建）
- `kb-task/src/code/Services/module.ts` - 模块服务（新建）
- `kb-task/src/code/Services/tag.ts` - 标签服务（新建）

**API 层**
- `kb-task/src/api/task.ts` - 任务 API（新建）
- `kb-task/src/api/module.ts` - 模块 API（新建）
- `kb-task/src/api/tag.ts` - 标签 API（新建）

**Model 层**（已存在，复用）
- `kb-task/src/code/Models/Task.ts` - 任务模型
- `kb-task/src/code/Models/Module.ts` - 模块模型
- `kb-task/src/code/Models/Tag.ts` - 标签模型
- `kb-task/src/code/Models/TaskTag.ts` - 任务标签关联模型

**参考文档**
- `docs/task-detail-api-requirements.md` - API 需求文档
- `docs/Backend-Development-Guide.md` - 服务端开发规范
- `docs/数据库设计.md` - 数据库设计文档

### API 接口统计

共实现 **17 个 API 接口**：

| 模块 | 接口数量 | 说明 |
|-----|---------|-----|
| Task（任务） | 6 个 | 列表、详情、创建、更新、删除、批量排序 |
| Module（模块） | 5 个 | 列表、详情、创建、更新、删除 |
| Tag（标签） | 5 个 | 列表、详情、创建、更新、删除 |
| **总计** | **16 个** | 覆盖任务详情页核心功能 |

### 测试建议

1. **任务 API 测试**
   - 创建任务（带/不带标签）
   - 获取任务列表（测试各种筛选条件）
   - 更新任务状态、优先级、标签
   - 批量更新任务顺序（拖拽场景）
   - 删除任务（测试权限控制）

2. **模块 API 测试**
   - 创建多级模块（顶级 + 子模块）
   - 获取模块列表（验证排序）
   - 更新模块层级关系
   - 删除模块（需 admin 权限）

3. **标签 API 测试**
   - 创建标签（测试名称重复验证）
   - 获取标签列表
   - 更新标签名称/颜色
   - 删除标签（验证级联删除任务关联）

### 下一步工作

根据 API 需求文档，剩余待实现的功能（低优先级）：

1. **评论功能**（4 个 API）
   - 获取评论列表
   - 创建评论
   - 更新评论
   - 删除评论

2. **任务历史**（1 个 API）
   - 获取任务变更历史

这些功能可以在后续迭代中实现，当前已完成的 API 已经满足任务详情页的核心需求。

---


> 📅 导出时间：2025/10/26 09:30:00
> 🤖 由 Task Banner 生成
