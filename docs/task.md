## 🤖 AI 协作指引

### 任务处理流程
1. **阅读任务**：仔细阅读下方的任务需求，理解每个任务的目标、技术要点和参考资料
2. **实现任务**：根据项目技术栈和任务描述完成开发
3. **保留元数据**：在返回结果时，务必保留每个任务的 task-id 注释（`<!-- task-id: xxx -->`）
4. **更新任务信息**：
   - 将任务状态更新为「待验收」
   - **添加任务摘要**：在任务描述开头添加 `**任务摘要：** <一句话总结>`
   - 补充实现细节（修改文件、技术要点等）
   - 如有修改文件，在技术要点中注明
5. **发送完成通知**：⚠️ **重要！必须执行！**
   - 使用命令：`bash /Users/achen/Priv/task-banner/.claude-notify.sh "标题" "描述"`
   - 标题：简短的任务完成说明（如：✅ XXX 功能完成）
   - 描述：一句话总结完成的内容
6. **生成文件**：⚠️ **重要！必须使用 Write 工具生成文件**
   - 使用 Write 工具生成 `/Users/achen/Priv/task-banner/docs/task.json` 文件
     - 格式：单个任务用对象，多个任务用数组
     - 示例（单任务）：
       ```json
       {
         "_id": "任务ID",
         "status": "review",
         "summary": "任务摘要（20-50字）",
         "content": "完整的任务内容，包含实现方案、修改文件、技术要点、验证结果等所有信息"
       }
       ```
     - 示例（多任务）：使用 JSON 数组 `[{...}, {...}]`
   - 使用 Write 工具生成 `/Users/achen/Priv/task-banner/docs/task.md` 文件
     - 格式：完整的 Markdown 文档（包含 AI 协作指引 + 任务列表）
     - 必须保留所有 `<!-- task-id: xxx -->` 注释
   - 注意：content 字段需要使用 \n 表示换行，使用 \" 转义引号

### 📝 任务摘要编写规范
- **长度**：20-50 字
- **内容**：用一句话概括完成了什么，解决了什么问题
- **示例**：
  - ✅ "实现了用户登录功能，支持账号密码和第三方登录"
  - ✅ "修复了任务列表排序 bug，优化了性能"
  - ✅ "添加了任务导出功能，支持 Markdown 格式"
  - ❌ "将描述从 xxx 改为 xxx"（太粗暴）
  - ❌ "已在 Service 层实现..."（太技术化）

### ⚠️ 重要提醒
- 必须保留所有 `<!-- task-id: xxx -->` 注释，这是任务回填的关键标识
- 保持 Markdown 结构完整，不要删除任何标题层级
- 任务摘要必须简洁明了，便于快速理解任务变更内容

---

## 任务列表
共 1 个任务

### 🟡 中优先级

<!-- task-id: 4870e5a5-7ed0-4d78-a3d4-05cb55039dbf -->
#### 1. 消息通知

**状态：** 待验收
**优先级：** 中
**创建时间：** 2025/10/27 18:25:22
**更新时间：** 2025/11/21 15:50:00

**任务摘要：** 实现了完整的消息通知系统，包括任务指派和内容更新通知的自动触发、消息列表展示、未读数量显示和"我的消息"页面功能。

**任务需求：**

1. 任务指派通知
2. 任务内容更新通知
3. 实现"我的消息"页面

---

## 🛠️ AI 解决方案

### 实现步骤

1. **后端通知服务层**
   - 创建 `src/code/Services/notification.ts` 服务层
   - 实现 `createNotification()` - 创建通知
   - 实现 `getUserNotifications()` - 获取用户通知列表，支持分页和筛选
   - 实现 `getUnreadCount()` - 获取未读通知数量
   - 实现 `markAsRead()` - 标记单个通知为已读
   - 实现 `markAllAsRead()` - 标记所有通知为已读
   - 实现 `createTaskAssignedNotification()` - 创建任务指派通知
   - 实现 `createTaskUpdatedNotification()` - 创建任务内容更新通知

2. **后端通知API**
   - 创建 `src/api/notification.ts` API 端点
   - 实现 `GET /api/notification/list` - 获取通知列表，支持分页、类型筛选、已读状态筛选
   - 实现 `GET /api/notification/unread-count` - 获取未读通知数量
   - 实现 `PUT /api/notification/read` - 标记单个通知为已读
   - 实现 `PUT /api/notification/read-all` - 标记所有通知为已读

3. **任务更新集成通知触发**
   - 在 `src/code/Services/task.ts` 的 `updateTask()` 函数中集成通知触发逻辑
   - 当 `assigneeId` 变化时，调用 `createTaskAssignedNotification()` 发送任务指派通知
   - 当 `title` 或 `content` 变化时，调用 `createTaskUpdatedNotification()` 发送任务内容更新通知
   - 避免给自己发送通知（操作者是接收者时不发送）
   - 只在有负责人时才发送内容更新通知

4. **前端通知API客户端**
   - 创建 `frontend/src/types/notification.ts` - 定义通知相关的 TypeScript 类型
   - 创建 `frontend/src/api/notification.ts` - 实现前端通知 API 调用
   - 实现 `getNotifications()` - 获取通知列表
   - 实现 `getUnreadCount()` - 获取未读数量
   - 实现 `markNotificationAsRead()` - 标记为已读
   - 实现 `markAllNotificationsAsRead()` - 全部标记为已读

5. **"我的消息"页面**
   - 更新 `frontend/src/views/Messages.vue` 页面
   - 实现真实的消息列表展示，替换 mock 数据
   - 实现筛选功能（全部/未读/任务/评论/@提醒）
   - 实现分页加载
   - 实现点击消息跳转到相关任务（通过获取任务详情获取项目ID）
   - 实现标记已读和全部标记已读功能
   - 实现动态筛选计数更新
   - 添加页面可见性变化监听，自动刷新未读数量

6. **Sidebar 未读数量显示**
   - 更新 `frontend/src/components/Sidebar.vue`
   - 实现未读消息数量的获取和显示
   - 添加定时刷新机制（每30秒）
   - 监听路由变化，进入消息页面时刷新
   - 优化未读数量显示样式（超过99显示"99+"）
   - 处理组件卸载时清理定时器

### 修改的文件

**后端文件：**
- `src/code/Services/notification.ts` - 新建，实现通知服务层
- `src/api/notification.ts` - 新建，实现通知 API 端点
- `src/code/Services/task.ts` - 更新，在 `updateTask()` 中集成通知触发逻辑
- `src/code/Models/Notification.ts` - 更新，在注释中添加 `task_updated` 类型说明

**前端文件：**
- `frontend/src/types/notification.ts` - 新建，定义通知类型
- `frontend/src/api/notification.ts` - 新建，实现前端通知 API 客户端
- `frontend/src/views/Messages.vue` - 更新，实现真实的消息列表功能
- `frontend/src/components/Sidebar.vue` - 更新，实现未读数量显示和自动刷新
- `frontend/src/utils/time.ts` - 已存在，使用 `formatRelativeTime()` 格式化时间显示

### 技术要点

1. **通知触发逻辑**
   - 在 `updateTask()` 中检测字段变化
   - 任务指派通知：`assigneeId` 变化且新值不为空时触发
   - 任务内容更新通知：`title` 或 `content` 变化时触发
   - 避免重复通知：操作者是接收者时不发送

2. **通知服务设计**
   - 使用 `Notification` 模型创建和查询通知
   - 支持按 `userId`、`type`、`isRead` 筛选
   - 支持分页查询（page, size）
   - 返回数据包含任务标题等扩展信息

3. **前端消息列表**
   - 使用 Vue Composition API (`ref`, `computed`, `watch`, `onMounted`, `onUnmounted`)
   - 实现前端筛选和分页
   - 点击消息时通过 `getTaskDetail()` 获取任务详情，再跳转到对应项目
   - 使用 `formatRelativeTime()` 显示相对时间

4. **未读数量实时更新**
   - Sidebar 中每30秒自动刷新未读数量
   - 监听路由变化，进入消息页面时刷新
   - 页面可见性变化时刷新
   - 使用 `setInterval` 和 `clearInterval` 管理定时器

5. **API 设计**
   - 使用 `@k-url` 注解实现动态路径 `/api/notification/{action}`
   - 统一的鉴权检查和错误处理
   - 返回标准化的响应格式

### 验证结果

1. **后端通知服务**
   - ✅ `createNotification()` 成功创建通知记录
   - ✅ `getUserNotifications()` 支持分页和筛选
   - ✅ `getUnreadCount()` 正确统计未读数量
   - ✅ `markAsRead()` 和 `markAllAsRead()` 正确更新已读状态

2. **通知触发**
   - ✅ 更新任务指派人时，自动发送 `task_assigned` 通知
   - ✅ 更新任务标题或内容时，自动发送 `task_updated` 通知
   - ✅ 操作者不会收到自己操作的通知
   - ✅ 没有负责人的任务不会发送内容更新通知

3. **前端消息页面**
   - ✅ 消息列表正确展示，支持筛选和分页
   - ✅ 点击消息可跳转到相关任务
   - ✅ 标记已读功能正常
   - ✅ 全部标记已读功能正常
   - ✅ 筛选计数动态更新

4. **Sidebar 未读数量**
   - ✅ 正确显示未读消息数量
   - ✅ 定时刷新机制正常
   - ✅ 路由变化时自动刷新
   - ✅ 数量超过99时显示"99+"
   - ✅ 组件卸载时正确清理定时器
