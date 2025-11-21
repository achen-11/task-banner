# 消息通知和"我的消息"页面实现方案

## 一、需求分析

根据 task.md 中的需求：
1. **任务指派通知** - 当任务被分配给用户时发送通知
2. **任务内容更新通知** - 当任务内容被更新时发送通知

## 二、现有基础设施

### 2.1 数据模型
- ✅ `Notification` 模型已存在 (`src/code/Models/Notification.ts`)
  - 字段：`userId`, `type`, `title`, `content`, `relatedTaskId`, `relatedCommentId`, `isRead`, `createdAt`
  - 通知类型：`task_assigned`, `task_status_changed`, `mentioned`, `commented`
  - 已有索引：`userId + isRead` 复合索引

### 2.2 前端页面
- ✅ `Messages.vue` 页面已存在，但使用 mock 数据
- ✅ 路由已配置：`/messages`
- ✅ Sidebar 已有消息入口，显示未读数量

### 2.3 后端 API
- ❌ 通知相关 API 尚未实现
- ✅ 任务更新逻辑在 `src/code/Services/task.ts` 的 `updateTask` 函数中

## 三、技术方案设计

### 3.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                     前端层 (Frontend)                        │
├─────────────────────────────────────────────────────────────┤
│  Messages.vue (我的消息页面)                                  │
│  - 消息列表展示                                              │
│  - 筛选（全部/未读/任务/评论/@提醒）                          │
│  - 标记已读                                                  │
│  - 点击跳转到相关任务                                        │
│                                                              │
│  Sidebar.vue                                                 │
│  - 显示未读消息数量                                          │
│  - 实时更新未读数量                                          │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP API
┌─────────────────────────────────────────────────────────────┐
│                     后端层 (Backend)                          │
├─────────────────────────────────────────────────────────────┤
│  src/api/notification.ts                                     │
│  - GET /api/notification/list - 获取通知列表                 │
│  - GET /api/notification/unread-count - 获取未读数量          │
│  - PUT /api/notification/read - 标记为已读                    │
│  - PUT /api/notification/read-all - 全部标记为已读             │
│                                                              │
│  src/code/Services/notification.ts                          │
│  - createNotification() - 创建通知                           │
│  - getUserNotifications() - 获取用户通知                    │
│  - getUnreadCount() - 获取未读数量                           │
│  - markAsRead() - 标记已读                                   │
│                                                              │
│  集成点：                                                     │
│  - src/code/Services/task.ts::updateTask()                  │
│    → 检测 assigneeId 变化 → 发送任务指派通知                  │
│    → 检测 content/title 变化 → 发送内容更新通知               │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                      数据层 (Database)                        │
├─────────────────────────────────────────────────────────────┤
│  notifications 表 (已存在)                                    │
│  - userId, type, title, content, relatedTaskId, isRead, etc. │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 通知触发时机

#### 3.2.1 任务指派通知
**触发条件**：`updateTask` 时 `assigneeId` 发生变化
- 旧值：`oldTask.assigneeId` (可能为空)
- 新值：`data.assigneeId` (不为空且不等于旧值)
- **接收者**：新指派的用户 (`data.assigneeId`)
- **不发送给**：操作者自己（如果操作者就是被指派人）
- **通知类型**：`task_assigned`
- **通知内容**：
  - title: `"任务已分配给你"`
  - content: `"{操作者} 将任务「{任务标题}」分配给了你"`

#### 3.2.2 任务内容更新通知
**触发条件**：`updateTask` 时 `title` 或 `content` 发生变化
- **接收者**：任务负责人 (`task.assigneeId`)，如果存在
- **不发送给**：操作者自己（如果操作者就是负责人）
- **通知类型**：`task_updated` (需要在模型中新增)
- **通知内容**：
  - title: `"任务内容已更新"`
  - content: `"{操作者} 更新了任务「{任务标题}」的内容"`

### 3.3 通知类型扩展

当前模型支持的类型：
- `task_assigned` - 任务分配 ✅
- `task_status_changed` - 任务状态变更
- `mentioned` - @提醒
- `commented` - 评论通知

**需要新增**：
- `task_updated` - 任务内容更新

### 3.4 前端实现细节

#### 3.4.1 API 接口定义
```typescript
// frontend/src/api/notification.ts
export interface Notification {
  _id: string
  userId: string
  type: 'task_assigned' | 'task_updated' | 'task_status_changed' | 'mentioned' | 'commented'
  title: string
  content: string
  relatedTaskId?: string
  relatedCommentId?: string
  isRead: boolean
  createdAt: number
  // 扩展字段（前端计算）
  sender?: { displayName: string; username: string }
  taskTitle?: string
  timeAgo?: string
}

export function getNotifications(params: {
  page?: number
  size?: number
  type?: string
  isRead?: boolean
}): Promise<{ items: Notification[]; total: number }>

export function getUnreadCount(): Promise<number>

export function markAsRead(notificationId: string): Promise<void>

export function markAllAsRead(): Promise<void>
```

#### 3.4.2 Messages.vue 优化
- 替换 mock 数据为真实 API 调用
- 实现分页加载
- 实现筛选功能
- 点击通知跳转到对应任务
- 实时更新未读数量

#### 3.4.3 Sidebar 未读数量
- 在 Sidebar 组件中调用 `getUnreadCount()`
- 使用定时轮询或 WebSocket（可选）更新未读数量
- 初始建议：页面加载时获取，点击消息页面时刷新

## 四、具体实现步骤

### 阶段1：后端 Service 层
1. 创建 `src/code/Services/notification.ts`
   - `createNotification()` - 创建通知
   - `getUserNotifications()` - 获取用户通知列表（支持筛选、分页）
   - `getUnreadCount()` - 获取未读数量
   - `markAsRead()` - 标记单个通知为已读
   - `markAllAsRead()` - 标记所有通知为已读

### 阶段2：后端 API 层
2. 创建 `src/api/notification.ts`
   - `GET /api/notification/list` - 获取通知列表
   - `GET /api/notification/unread-count` - 获取未读数量
   - `PUT /api/notification/read` - 标记为已读
   - `PUT /api/notification/read-all` - 全部标记为已读

### 阶段3：集成通知触发
3. 修改 `src/code/Services/task.ts::updateTask()`
   - 检测 `assigneeId` 变化 → 调用 `createNotification()` 发送任务指派通知
   - 检测 `title` 或 `content` 变化 → 调用 `createNotification()` 发送内容更新通知
   - 获取操作者信息（从 `userId` 参数）
   - 获取任务信息（从 `oldTask` 和更新后的任务）
   - 获取接收者信息（被指派的用户）

### 阶段4：前端 API 层
4. 创建 `frontend/src/api/notification.ts`
   - 定义 TypeScript 接口
   - 实现 API 调用函数

### 阶段5：前端页面优化
5. 更新 `frontend/src/views/Messages.vue`
   - 替换 mock 数据
   - 实现真实 API 调用
   - 优化 UI 展示
   - 实现点击跳转

6. 更新 `frontend/src/components/Sidebar.vue`
   - 调用 API 获取未读数量
   - 实现未读数量更新逻辑

### 阶段6：类型定义
7. 创建/更新类型定义
   - `frontend/src/types/notification.ts`

## 五、技术要点

### 5.1 通知去重
- **场景**：短时间内多次更新任务内容
- **方案**：可以考虑在创建通知前检查是否已有相同类型的未读通知
- **简化方案**：每次更新都创建新通知（更简单，用户体验也合理）

### 5.2 通知发送逻辑
- **不给自己发通知**：如果操作者就是接收者，不发送通知
- **获取操作者信息**：从 `updateTask` 的 `userId` 参数获取
- **获取接收者信息**：
  - 任务指派：接收者是 `data.assigneeId`
  - 内容更新：接收者是 `oldTask.assigneeId`（如果存在）

### 5.3 通知内容格式化
- 使用操作者的 `displayName` 或 `username`
- 使用任务标题
- 内容简洁明了

### 5.4 前端实时更新
- **方案1**：定时轮询（简单，推荐初始实现）
  - 在 Sidebar 挂载时开始轮询
  - 间隔 30-60 秒
  - 离开页面时清除定时器
- **方案2**：WebSocket（后续优化）
- **方案3**：页面可见性 API + 轮询
  - 页面可见时轮询
  - 页面隐藏时停止

### 5.5 分页和性能
- 后端支持分页（page, size）
- 默认每页 20 条
- 前端实现无限滚动或分页器

## 六、数据库考虑

### 6.1 通知清理
- **方案1**：保留所有通知（简单）
- **方案2**：定期清理已读的旧通知（如 30 天前）
- **初始实现**：方案1

### 6.2 索引优化
- 已有索引：`userId + isRead` 复合索引 ✅
- 查询场景：
  - 按用户查询 + 按已读状态筛选 ✅
  - 按类型筛选（可选优化）
  - 按时间排序（createdAt 降序）

## 七、UI/UX 设计

### 7.1 消息列表
- 未读消息：蓝色背景高亮
- 已读消息：白色背景
- 显示操作者、内容、时间
- 点击跳转到对应任务
- 支持筛选：全部/未读/任务相关

### 7.2 未读数量徽章
- 在 Sidebar 消息入口显示红色数字徽章
- 未读数量 > 0 时显示
- 数字超过 99 显示 "99+"

### 7.3 时间显示
- 使用相对时间：刚刚、5分钟前、1小时前、昨天、具体日期
- 前端格式化，使用 `formatDate` 或类似工具

## 八、测试验证

### 8.1 功能测试
1. 任务指派通知
   - 将任务分配给用户A → 用户A收到通知
   - 用户A自己分配给自己 → 不收到通知
2. 任务内容更新通知
   - 更新任务内容 → 负责人收到通知
   - 负责人自己更新 → 不收到通知
3. 消息页面
   - 列表展示正确
   - 筛选功能正常
   - 标记已读功能正常
   - 点击跳转正确

### 8.2 边界情况
- 任务没有负责人时更新内容 → 不发送通知
- 取消任务分配（assigneeId 置空）→ 不发送通知（或发送"取消分配"通知？）
- 大量通知时的性能

## 九、后续扩展

- [ ] 评论通知（已有模型支持）
- [ ] @提醒通知（已有模型支持）
- [ ] 任务状态变更通知
- [ ] 通知设置（用户可选择接收哪些类型的通知）
- [ ] WebSocket 实时推送
- [ ] 邮件通知（可选）
- [ ] 通知聚合（相同类型的多个通知合并显示）

## 十、文件清单

### 需要创建的文件
1. `src/code/Services/notification.ts` - 通知服务层
2. `src/api/notification.ts` - 通知 API 层
3. `frontend/src/api/notification.ts` - 前端 API 客户端
4. `frontend/src/types/notification.ts` - 类型定义

### 需要修改的文件
1. `src/code/Services/task.ts` - 集成通知触发逻辑
2. `frontend/src/views/Messages.vue` - 替换 mock 数据，实现真实功能
3. `frontend/src/components/Sidebar.vue` - 显示未读数量
4. `src/code/Models/Notification.ts` - 可能需要扩展类型（task_updated）

## 十一、实施优先级

**Phase 1 - 核心功能**（必须）
1. 后端 Service 和 API
2. 任务指派通知触发
3. 前端消息页面基础功能
4. Sidebar 未读数量

**Phase 2 - 完善功能**（重要）
1. 任务内容更新通知触发
2. 消息筛选和分页
3. 点击跳转到任务

**Phase 3 - 优化**（可选）
1. 实时更新优化
2. 通知去重
3. 其他通知类型

---

**建议**：先实现 Phase 1，确保核心功能可用，然后逐步完善。
