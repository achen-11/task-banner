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

<!-- task-id: 1761398923353-w1n41yhcx -->
#### 1. 数据库定义

**状态：** 已完成
**优先级：** 中
**创建时间：** 2025/10/25 21:28:43
**更新时间：** 2025/10/25 21:35:00

**任务描述：**

- [x] 需要新增一个规范, kooboo 生成表时会自动带一个唯一标识"_id", 因此再设置 primaryKey:true 时会出现"Script error on 'project' SQLite Error 1: 'table "projects" has more than one primary key'."
- [x] 默认使用_id 作为主键, 例如, 如果需要 task id 时, 可以定义这个字段, 但不设为 primary key

**实现说明：**

已完成所有模型定义的修复和规范文档的更新：

1. **修复的模型文件（10个）：**
   - `kb-task/src/code/Models/Project.ts` - 移除 `id` 字段的 `primaryKey: true`
   - `kb-task/src/code/Models/ProjectMember.ts` - 移除主键定义，更新外键引用
   - `kb-task/src/code/Models/Module.ts` - 移除主键定义，更新外键引用
   - `kb-task/src/code/Models/Task.ts` - 移除主键定义，更新外键引用，保留 `taskId` 作为普通字段
   - `kb-task/src/code/Models/Tag.ts` - 移除主键定义，更新外键引用
   - `kb-task/src/code/Models/TaskTag.ts` - 移除主键定义，更新外键引用
   - `kb-task/src/code/Models/TaskHistory.ts` - 移除主键定义，更新外键引用
   - `kb-task/src/code/Models/TaskComment.ts` - 移除主键定义，更新外键引用
   - `kb-task/src/code/Models/Notification.ts` - 移除主键定义，更新外键引用
   - `kb-task/src/code/Models/User.ts` - 移除主键定义

2. **更新的规范文档：**
   - `docs/Backend-Development-Guide.md` - 添加了详细的 Kooboo 主键规范说明（第 365-457 行）
   - `.claud.md` - 在数据库操作部分添加了 Kooboo 主键规范（第 117-144 行）

3. **关键修改点：**
   - 移除所有模型中的 `id: { primaryKey: true, autoincrement: true }` 定义
   - 将所有外键引用从 `fieldName: 'id'` 改为 `fieldName: '_id'`
   - 保留了 Task 模型的 `taskId` 字段作为自定义 ID，但不设为主键

4. **技术要点：**
   - Kooboo ORM 自动为每个表生成 `_id` 字段作为主键
   - 禁止手动定义 `primaryKey: true`，会导致 "more than one primary key" 错误
   - 允许定义自定义 ID 字段（如 `taskId`），但不能设为主键
   - 所有外键必须引用 `_id` 字段

---


> 📅 导出时间：2025/10/25 21:28:46
> 🤖 由 Task Banner 生成