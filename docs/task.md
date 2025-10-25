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

共 2 个任务（已完成 2 个）

### 🟡 中优先级

<!-- task-id: 1761383983797-u3ipf4y7y -->
#### 1. 创建 Vue 项目

**状态：** 已完成
**优先级：** 中
**创建时间：** 2025/10/25 17:19:43
**更新时间：** 2025/10/25 17:40:00

**任务描述：**

- [x] 在 "kb-task/frontend",根据文档构建vue项目
- [x] 指定服务端api地址为https://ai_task_manage.redev/api
- [x] 主动降级使用 tailwindcss 3, 4 很容易出现错误
- [x] 定义build 配置,
    - [x] index.html打包到"kb-task/src/page",
    - [x] js 打包 "kb-task/src/js"
    - [x] css 打包到""kb-task/src/css"

**实现说明：**
- 使用 `npm create vue@latest` 创建 Vue 3 + TypeScript + Router + Pinia 项目
- 安装 Tailwind CSS 3.4.18 版本，配置 PostCSS 和 Tailwind 配置文件
- 创建 `.env` 环境变量文件，配置 API 地址为 `VITE_API_BASE_URL=https://ai_task_manage.redev/api`
- 修改 `vite.config.ts` 配置 build 输出路径：
  - `outDir: '../src'` 输出到父目录的 src 文件夹
  - JS 文件输出到 `js/[name]-[hash].js`
  - CSS 文件输出到 `css/[name]-[hash].css`
  - 添加 `move-html` npm script 将 index.html 移动到 `page` 目录

**修改的文件：**
- `kb-task/frontend/package.json` - 添加 move-html script
- `kb-task/frontend/vite.config.ts` - 配置 build 输出路径
- `kb-task/frontend/tailwind.config.js` - 配置 content 路径
- `kb-task/frontend/src/assets/main.css` - 引入 Tailwind CSS 指令

---

<!-- task-id: 1761384211235-xx8e9txfk -->
#### 2. 表模型定义

**状态：** 已完成
**优先级：** 中
**创建时间：** 2025/10/25 17:23:31
**更新时间：** 2025/10/25 17:40:00

**任务描述：**

- [x] 根据表拆分(一个表一个文件)
- [x] 在"kb-task/src/code/Models"定义表结构

**实现说明：**
按照 k_sqlite_orm 规范，在 `kb-task/src/code/Models` 目录下创建了 10 个数据模型文件，每个表一个文件：

1. **User.ts** - 用户模型
   - 主键自增 ID，初始值 1000
   - 包含 username、email、password、avatar、displayName 字段
   - email 和 username 设置唯一索引
   - password 字段默认不查询（select: false）

2. **Project.ts** - 项目模型
   - 包含项目名称、描述、颜色、所有者、状态等字段
   - ownerId 外键关联 users 表，级联删除

3. **ProjectMember.ts** - 项目成员模型
   - projectId 和 userId 组合唯一约束
   - 包含角色字段（owner/admin/member/viewer）

4. **Module.ts** - 模块模型（支持多级嵌套）
   - parentId 字段支持多级模块嵌套（0 表示顶级）
   - 创建复合索引 (projectId, parentId, order)

5. **Task.ts** - 任务模型
   - 包含 taskId（UUID）和 id（自增主键）
   - 支持状态、优先级、负责人、创建人、截止日期等字段
   - content 字段存储 Quill.js Delta JSON

6. **Tag.ts** - 标签模型
   - projectId 和 name 组合唯一约束

7. **TaskTag.ts** - 任务标签关联模型
   - taskId 和 tagId 组合唯一约束
   - 级联删除

8. **TaskHistory.ts** - 任务历史模型
   - 记录任务的所有变更，实现迭代历史功能
   - 包含 field、oldValue、newValue、action 字段

9. **TaskComment.ts** - 任务评论模型
   - 支持 @提醒功能（mentionedUsers 数组字段）

10. **Notification.ts** - 通知模型
    - 支持多种通知类型（task_assigned/task_status_changed/mentioned/commented）
    - 包含已读状态和关联任务/评论 ID

**技术要点：**
- 所有模型均使用 `softDelete: false`（不使用软删除）
- 使用 `timestamps: true` 自动添加 createdAt/updatedAt 字段
- 外键使用 `ref` 配置，支持级联删除（onDelete: 'CASCADE'）
- 使用 `uniques` 配置组合唯一约束
- 使用 `indexes` 配置复合索引
- 导出 TypeScript 类型定义（使用 `typeof Model.$type`）

**创建的文件：**
- `kb-task/src/code/Models/User.ts`
- `kb-task/src/code/Models/Project.ts`
- `kb-task/src/code/Models/ProjectMember.ts`
- `kb-task/src/code/Models/Module.ts`
- `kb-task/src/code/Models/Task.ts`
- `kb-task/src/code/Models/Tag.ts`
- `kb-task/src/code/Models/TaskTag.ts`
- `kb-task/src/code/Models/TaskHistory.ts`
- `kb-task/src/code/Models/TaskComment.ts`
- `kb-task/src/code/Models/Notification.ts`
- `kb-task/src/code/Models/index.ts` - 统一导出所有模型

---


> 📅 导出时间：2025/10/25 17:25:07
> 🤖 由 Task Banner 生成
> ✅ 任务完成时间：2025/10/25 17:40:00