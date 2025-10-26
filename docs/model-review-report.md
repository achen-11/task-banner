# Model Review 报告

**生成时间**: 2025-10-26
**审查范围**: kb-task/src/code/Models/
**审查目的**: 确保后端数据模型能够支撑已实现的前端功能

---

## 📋 执行摘要

本次审查对比了后端的 10 个数据模型和已实现的前端功能（任务详情抽屉、附件系统、活动历史等），发现了 **1 个严重缺失的模型**、**5 处字段不匹配**和**多项优化建议**。

### 关键发现
- ❌ **严重缺失**: Attachment（附件）模型完全缺失
- ⚠️ **字段不匹配**: Task、TaskComment 等模型存在字段命名和类型不一致
- ⚠️ **设计冲突**: 模块选择（单选 vs 多选）存在前后端不一致

---

## 🗂️ 现有 Models 清单

| 序号 | Model | 表名 | 状态 | 说明 |
|------|-------|------|------|------|
| 1 | User | users | ✅ 完整 | 用户模型 |
| 2 | Project | projects | ✅ 完整 | 项目模型 |
| 3 | ProjectMember | project_members | ✅ 完整 | 项目成员关联 |
| 4 | Module | modules | ⚠️ 需调整 | 模块模型（支持多级） |
| 5 | Task | tasks | ⚠️ 需调整 | 任务核心模型 |
| 6 | Tag | tags | ✅ 完整 | 标签模型 |
| 7 | TaskTag | task_tags | ✅ 完整 | 任务-标签关联表 |
| 8 | TaskHistory | task_history | ✅ 完整 | 任务变更历史 |
| 9 | TaskComment | task_comments | ⚠️ 需调整 | 任务评论 |
| 10 | Notification | notifications | ✅ 完整 | 通知模型 |
| 11 | **Attachment** | - | ❌ **缺失** | **附件模型** |

---

## ❌ 严重缺失：Attachment 模型

### 问题描述
前端已完整实现附件功能（`src/components/attachment/`），包括：
- ✅ AttachmentUpload.vue - 上传组件（点击/拖拽/粘贴）
- ✅ AttachmentCard.vue - 附件卡片展示
- ✅ AttachmentList.vue - 附件列表容器
- ✅ ImageLightbox.vue - 图片预览组件

但后端完全缺少 **Attachment 数据模型**。

### 前端使用的 Attachment 接口
```typescript
interface Attachment {
  _id: string
  name: string          // 文件名
  size: number          // 文件大小（字节）
  type: string          // MIME 类型
  url: string           // 文件访问 URL
  thumbnailUrl?: string // 缩略图 URL（图片）
  uploadedAt: number    // 上传时间戳
}
```

### 建议的 Attachment 模型 (采纳, 新增该 model)

```typescript
import { ksql, DataTypes } from 'module/k_sqlite'

/**
 * 附件模型（支持任务附件和评论附件）
 */
export const Attachment = ksql.define(
  'attachments',
  {
    // 关联信息
    relatedType: {
      type: DataTypes.String,
      required: true, // 'task' | 'comment'
      index: true
    },
    relatedId: {
      type: DataTypes.String,
      required: true, // taskId 或 commentId
      index: true
    },

    // 文件信息
    name: {
      type: DataTypes.String,
      required: true
    },
    originalName: {
      type: DataTypes.String,
      required: true // 原始文件名
    },
    size: {
      type: DataTypes.Number,
      required: true // 字节数
    },
    mimeType: {
      type: DataTypes.String,
      required: true // image/png, application/pdf, etc.
    },

    // 存储信息
    storagePath: {
      type: DataTypes.String,
      required: true // 服务器存储路径
    },
    url: {
      type: DataTypes.String,
      required: true // 访问 URL
    },
    thumbnailUrl: {
      type: DataTypes.String,
      default: '' // 缩略图 URL（仅图片）
    },

    // 元数据
    uploaderId: {
      type: DataTypes.String,
      required: true,
      ref: {
        tableName: 'users',
        fieldName: '_id',
        onDelete: 'CASCADE'
      },
      index: true
    },
    projectId: {
      type: DataTypes.String,
      required: true,
      ref: {
        tableName: 'projects',
        fieldName: '_id',
        onDelete: 'CASCADE'
      },
      index: true
    }
  },
  {
    timestamps: true, // createdAt, updatedAt
    softDelete: false,
    indexes: [
      {
        columns: ['relatedType', 'relatedId'],
        name: 'attachment_related_idx'
      },
      {
        columns: ['projectId', 'createdAt'],
        name: 'attachment_project_created_idx'
      }
    ]
  }
)

export type AttachmentType = typeof Attachment.$type
```

### 实现优先级
🔴 **P0 - 紧急**：前端功能已完成，必须立即添加此模型才能支持附件功能。

---

## ⚠️ 字段不匹配问题

### 1. Task 模型字段不匹配

| 字段 | 后端 (Models/Task.ts) | 前端 (TaskBasicInfo.vue) | 问题 |
|------|----------------------|-------------------------|------|
| 任务描述 | `content: String` | `description?: string` | **命名不一致** |
| 指派人 | `assigneeId: String` | `assignee?: string` | **前端存名字，后端存 ID** |
| 模块 | `moduleId: String` (单选) | `module?: string \| string[]` (多选) | **单选 vs 多选冲突** |
| 附件 | ❌ 缺失 | `attachments?: Attachment[]` | **后端缺失** |

#### 建议调整

**Option A: 最小改动（推荐）**
```typescript
// Task.ts - 添加字段
{
  // 保留 content 用于富文本（Quill.js）
  content: {
    type: DataTypes.String,
    default: ''
  },
  // 新增 description 用于普通文本描述
  description: {
    type: DataTypes.String,
    default: ''
  },

  // 保留 assigneeId
  assigneeId: {
    type: DataTypes.String,
    default: ''
  },

  // 保留 moduleId，前端需要调整为单选
  moduleId: {
    type: DataTypes.String,
    default: ''
  }
}
```

**Option B: 完全对齐前端** (采纳, 但需要调整)
```typescript
{
  description: { // 继续使用 content , 前端也改为 content 而不是 desc
    type: DataTypes.String,
    default: ''
  },

  // 支持多模块需要使用关联表 TaskModule（类似 TaskTag）
  // 删除 moduleId 字段
}

// 新建 TaskModule 关联表
export const TaskModule = ksql.define(
  'task_modules',
  {
    taskId: {
      type: DataTypes.String,
      required: true,
      ref: { tableName: 'tasks', fieldName: '_id', onDelete: 'CASCADE' },
      index: true
    },
    moduleId: {
      type: DataTypes.String,
      required: true,
      ref: { tableName: 'modules', fieldName: '_id', onDelete: 'CASCADE' },
      index: true
    }
  },
  {
    timestamps: false,
    uniques: [{ columns: ['taskId', 'moduleId'], name: 'task_module_unique' }]
  }
)
```

**推荐**: Option A，原因：
1. 向后兼容现有代码
2. `content` 未来用于 Quill.js 富文本
3. 前端调整模块选择为单选更简单（或者只取第一个）
最终方案: 
1. 现在task 都还是空的, 不需要兼容
2. 保持`content`字段, 前端改为 content 而不是 desc
3.  使用关联表 TaskModule（类似 TaskTag）, 删除 moduleId 字段


---

### 2. Module.parentId 类型不一致 (采纳建议, 修改)

**当前定义**:
```typescript
parentId: {
  type: DataTypes.Number, // ❌ 与其他 ID 类型不一致
  default: 0
}
```

**建议修改**:
```typescript
parentId: {
  type: DataTypes.String, // ✅ 与其他 ID 保持一致
  default: '', // 空字符串表示顶级模块
  index: true
}
```

**原因**:
- 所有其他关联字段都使用 String 类型的 `_id`
- Kooboo 的 `_id` 是自动生成的 String
- 使用 Number 会导致关联查询失败

---

### 3. TaskComment 缺少附件关联

**当前定义**:
```typescript
// TaskComment.ts
export const TaskComment = ksql.define(
  'task_comments',
  {
    taskId: { ... },
    userId: { ... },
    content: { ... },
    mentionedUsers: { ... }
    // ❌ 缺少附件关联
  }
)
```

**设计文档要求** (docs/attachment-feature-design.md):
> 方案 A（分离式）：
> - 任务附件：附加到 Task
> - 评论附件：附加到 TaskComment

**解决方案**:
使用前面提出的 Attachment 模型，通过 `relatedType` 和 `relatedId` 关联：
```typescript
// 查询评论的附件
const commentAttachments = await Attachment.find({
  relatedType: 'comment',
  relatedId: commentId
})
```

无需修改 TaskComment 模型，Attachment 模型已支持。

---

### 4. Task.taskId 类型与前端展示不一致

**后端定义**:
```typescript
taskId: {
  type: DataTypes.String,
  default: () => `task_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  // 生成示例: "task_1698765432000_a3b5c7d"
}
```

**前端展示**:
```vue
<!-- TaskDetailDrawer.vue -->
<div class="text-sm font-mono text-gray-500">
  #{{ currentTask.taskId }}  <!-- 显示为 #1001, #1002 等数字 -->
</div>
```

**问题**: 前端期望 `taskId` 是递增的数字（#1001），但后端生成的是随机字符串。

**建议方案**:

**Option A: 添加 displayId 字段（推荐）**
```typescript
// Task.ts
{
  taskId: {
    type: DataTypes.String,
    required: true,
    unique: true,
    default: () => `task_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  },
  displayId: {
    type: DataTypes.Number,
    required: true,
    unique: true,
    index: true
    // 需要在创建时手动分配递增 ID
  }
}
```

**Option B: 修改 taskId 为自增数字**
```typescript
taskId: {
  type: DataTypes.Number,
  required: true,
  unique: true,
  autoIncrement: true, // 如果 k_sqlite 支持
  index: true
}
```

**推荐**: Option A
- 保持现有的 taskId 作为内部唯一标识
- displayId 用于用户界面展示
- 类似 GitHub 的 issue number 设计

最终方案:
1. task 有默认 _id 作为唯一标识, 仍然使用_id 作为唯一标识
2. 移除 task_id 字段, 确实 displayId 这个命名更好, 不会产生歧义
3. 自增是否支持可以阅读"kb-task/src/module/k_sqlite/code/index.ts" 或者"kscript-docs/K_SQLITE_ORM_文档.md", 查看是否支持
   1. 如果支持就使用, 不支持我们自己维护

---

### 5. 前端 assignee 字段使用问题 (采纳建议)

**前端当前实现**:
```typescript
// TaskBasicInfo.vue
assignee?: string  // 直接存储用户名 "张三"

<el-select v-model="localTask.assignee">
  <el-option label="张三" value="张三" />
  <el-option label="李四" value="李四" />
</el-select>
```

**后端实现**:
```typescript
// Task.ts
assigneeId: {
  type: DataTypes.String,
  default: ''  // 存储用户 _id
}
```

**问题**: 前端存名字，后端存 ID，数据不一致。

**建议**:
1. **后端保持不变**（使用 assigneeId）
2. **前端调整**为使用 userId 而不是 username：
```typescript
// 修改后
assigneeId?: string  // 存储用户 _id

<el-select v-model="localTask.assigneeId">
  <el-option
    v-for="user in projectUsers"
    :key="user._id"
    :label="user.displayName || user.username"
    :value="user._id"
  />
</el-select>
```

---

## ✅ 设计良好的部分

### 1. 标签系统 (Tag + TaskTag)
- ✅ 使用关联表实现多对多关系
- ✅ 唯一约束防止重复关联
- ✅ 级联删除确保数据一致性
- ✅ 项目级别的标签隔离（projectId + name 唯一）

### 2. TaskHistory 活动历史
- ✅ 字段级变更追踪（field, oldValue, newValue）
- ✅ 支持前端的活动历史功能
- ✅ 索引优化（taskId + createdAt）

### 3. 用户和权限
- ✅ User 模型完整
- ✅ ProjectMember 支持角色管理
- ✅ password 字段默认不查询（安全）

### 4. 通知系统
- ✅ 支持多种通知类型
- ✅ 关联任务和评论
- ✅ 未读状态追踪

---

## 📊 前后端字段映射表

### Task 模型完整映射

| 前端字段 (TaskBasicInfo.vue) | 后端字段 (Task.ts) | 状态 | 建议 |
|------------------------------|-------------------|------|------|
| `_id` | `_id` | ✅ 一致 | - |
| `taskId: number` | `taskId: string` | ⚠️ 类型不一致 | 添加 `displayId: number` |
| `title` | `title` | ✅ 一致 | - |
| `status` | `status` | ✅ 一致 | - |
| `priority` | `priority` | ✅ 一致 | - |
| `description?: string` | `content: string` | ⚠️ 命名不一致 | 添加 `description` 字段 |
| `assignee?: string` | `assigneeId: string` | ⚠️ 存储内容不一致 | 前端改为 `assigneeId` |
| `module?: string \| string[]` | `moduleId: string` | ⚠️ 单选 vs 多选 | 前端改为单选或后端添加关联表 |
| `tags?: string[]` | 通过 TaskTag 关联 | ⚠️ 需要 JOIN | 前端改为存 tagId 数组 |
| `dueDate?: number` | `dueDate: number` | ✅ 一致 | - |
| `progress?: number` | `progress: number` | ✅ 一致 | - |
| `attachments?: Attachment[]` | ❌ 缺失 | ❌ 后端缺失 | 添加 Attachment 模型 |
| `createdAt` | `createdAt` | ✅ 一致 | - |
| `updatedAt` | `updatedAt` | ✅ 一致 | - |
| - | `projectId` | - | 前端需要 |
| - | `creatorId` | - | 前端需要 |
| - | `order` | - | 前端需要（拖拽排序） |

---

## 🎯 行动计划

### Phase 1: 紧急修复（本周完成）

#### 1.1 添加 Attachment 模型 🔴 P0
```bash
# 创建文件
kb-task/src/code/Models/Attachment.ts
```
- [ ] 创建 Attachment 模型（见上文建议）
- [ ] 在 index.ts 中导出
- [ ] 编写迁移脚本创建表

#### 1.2 修复 Module.parentId 类型 🔴 P0
```typescript
// Models/Module.ts
parentId: {
  type: DataTypes.String,  // Number -> String
  default: '',             // 0 -> ''
  index: true
}
```

### Phase 2: 字段对齐（下周完成）

#### 2.1 Task 模型调整 🟡 P1
- [ ] 添加 `description` 字段（用于简单文本描述）
- [ ] 添加 `displayId` 字段（用于界面展示的递增 ID）
- [ ] 保留 `content` 字段（未来用于 Quill.js 富文本）

#### 2.2 前端调整 🟡 P1
- [ ] `assignee` 改为 `assigneeId`，存储用户 ID
- [ ] `module` 改为单选（或等待后端支持多选）
- [ ] `tags` 改为存储 tagId 数组而不是名称数组
- [ ] 添加 `projectId`、`creatorId`、`order` 字段

### Phase 3: API 实现（2 周内）

#### 3.1 附件相关 API 🟡 P1
- [ ] POST /api/attachments/upload - 上传附件
- [ ] GET /api/attachments/:id - 获取附件详情
- [ ] DELETE /api/attachments/:id - 删除附件
- [ ] GET /api/tasks/:taskId/attachments - 获取任务的所有附件
- [ ] GET /api/comments/:commentId/attachments - 获取评论的所有附件

#### 3.2 任务 CRUD API 调整 🟡 P1
- [ ] 更新 Task 创建/更新接口，支持新字段
- [ ] 添加附件关联处理
- [ ] 返回数据中包含关联的 attachments 数组

### Phase 4: 优化和扩展（1 个月内）

#### 4.1 模块多选支持 🟢 P2
- [ ] 创建 TaskModule 关联表（可选）
- [ ] 更新相关 API

#### 4.2 数据迁移 🟢 P2
- [ ] 编写迁移脚本处理现有数据
- [ ] 生成 displayId
- [ ] 迁移 assignee 名称到 assigneeId

---

## 📝 建议的开发顺序

```
1. ✅ 前端附件功能实现（已完成）
   ├── AttachmentUpload.vue
   ├── AttachmentCard.vue
   ├── AttachmentList.vue
   └── ImageLightbox.vue

2. 🔴 后端 Attachment 模型（当前任务）
   ├── 创建 Attachment.ts
   ├── 数据库迁移
   └── 导出模型

3. 🔴 附件上传 API
   ├── 文件上传处理
   ├── 缩略图生成
   └── URL 生成

4. 🟡 Task 模型字段调整
   ├── 添加 description
   ├── 添加 displayId
   └── 数据库迁移

5. 🟡 前端数据层调整
   ├── assignee -> assigneeId
   ├── tags -> tagIds
   └── 添加缺失字段

6. 🟢 其他优化
   ├── 模块多选（可选）
   └── 性能优化
```

---

## 🔍 潜在风险

### 1. 数据迁移风险 ⚠️
- 现有任务数据可能没有 `displayId`，需要批量生成
- `assignee` 名称到 ID 的迁移可能需要匹配用户表

**缓解措施**:
- 编写迁移脚本前先备份数据库
- 在测试环境验证迁移脚本
- 提供回滚方案

### 2. 前后端并行开发风险 ⚠️
- 前端使用 mock 数据，与真实 API 可能不一致

**缓解措施**:
- 定义清晰的 API 契约（OpenAPI/Swagger）
- 前后端定期同步接口定义
- 尽快替换 mock 为真实 API

### 3. 文件存储风险 ⚠️
- 附件文件需要存储空间管理
- 大文件上传性能问题
- 文件安全和访问权限

**缓解措施**:
- 设置文件大小限制（当前前端限制 50MB）
- 使用文件存储服务（本地文件系统或对象存储）
- 实现访问权限验证（只有项目成员可访问）

---

## 💡 额外建议

### 1. 添加 TaskAttachment 视图/关联
虽然使用通用的 Attachment 模型很灵活，但可以考虑为常用查询创建便捷方法：

```typescript
// Task.ts 中添加
Task.getAttachments = async function(taskId: string) {
  return await Attachment.find({
    relatedType: 'task',
    relatedId: taskId
  })
}
```

### 2. 考虑软删除 (暂不考虑)
某些场景下，附件删除可能需要恢复：
```typescript
// Attachment.ts
{
  deletedAt: {
    type: DataTypes.Timestamp,
    default: 0
  }
}
// softDelete: true
```

### 3. 文件版本管理 (暂时不需要)
如果未来需要附件版本控制：
```typescript
// AttachmentVersion.ts (可选扩展)
{
  attachmentId: String,
  version: Number,
  storagePath: String,
  ...
}
```

### 4. 统一 ID 生成策略
考虑为 displayId 创建统一的生成服务：
```typescript
// services/IdGenerator.ts
class IdGenerator {
  static async getNextTaskId(projectId: string): Promise<number> {
    // 获取项目内下一个可用的任务 ID
    const lastTask = await Task.findOne({
      projectId,
      sort: '-displayId'
    })
    return (lastTask?.displayId || 0) + 1
  }
}
```

---

## 📚 参考文档

1. [附件功能设计文档](./attachment-feature-design.md) - 前端附件功能的详细设计
2. [任务详情反馈](./task-detail-feeback.md) - 用户对任务详情页的反馈
3. Kooboo k_sqlite 文档 - 数据模型定义规范

---

## 📞 后续行动

**需要决策的问题**:
1. ✅ Attachment 模型使用通用设计（relatedType）还是分离式（TaskAttachment, CommentAttachment）？
   - **建议**: 通用设计，更灵活

2. ⚠️ Task.module 支持单选还是多选？
   - **建议**: 先实现单选，未来需要时再添加关联表

3. ⚠️ Task.taskId 保持字符串还是改为数字？
   - **建议**: 添加 displayId 数字字段，保留 taskId 字符串

**下一步**:
1. Review 本报告，确认调整方案
2. 创建 Attachment 模型和迁移脚本
3. 实现附件上传 API
4. 前端集成真实 API

---

**报告生成**: Claude Code
**最后更新**: 2025-10-26
