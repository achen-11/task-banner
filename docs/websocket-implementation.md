# WebSocket 实时通信实现

## 概述

为 task-banner 项目接入了 WebSocket 实时通信功能，实现任务变更、评论等操作的实时推送。

## 实现内容

### 1. WebSocket API 端点

**文件**: `src/api/websocket.ts`

- `GET /api/websocket/connect` - 建立 WebSocket 连接
- `GET /api/websocket/status` - 获取连接状态

### 2. WebSocket 服务

**文件**: `src/code/Services/websocket.ts`

提供以下推送函数：
- `pushTaskCreated()` - 推送任务创建消息
- `pushTaskUpdated()` - 推送任务更新消息
- `pushTaskDeleted()` - 推送任务删除消息
- `pushCommentCreated()` - 推送评论创建消息
- `pushCommentUpdated()` - 推送评论更新消息
- `pushCommentDeleted()` - 推送评论删除消息
- `pushNotification()` - 推送通知消息

### 3. 集成点

已在以下 API 中集成 WebSocket 推送：
- `POST /api/task/create` - 任务创建时推送
- `PUT /api/task/update` - 任务更新时推送
- `DELETE /api/task/delete` - 任务删除时推送
- `POST /api/task/comment` - 评论创建时推送
- `PUT /api/task/comment` - 评论更新时推送
- `DELETE /api/task/comment` - 评论删除时推送

## 使用方法

### 前端连接 WebSocket

```javascript
// 获取 WebSocket URL（需要先登录获取 token）
const wsUrl = `ws://your-domain.com/api/websocket/connect`

// 建立连接
const ws = new WebSocket(wsUrl)

// 监听消息
ws.onmessage = (event) => {
  const message = JSON.parse(event.data)
  
  // 消息格式：{ event, data, time }
  switch (message.event) {
    case 'enter':
      // 连接成功确认
      console.log('连接成功:', message.data)
      break
    case 'task_created':
      // 处理任务创建
      console.log('新任务:', message.data.task)
      break
    case 'task_updated':
      // 处理任务更新
      console.log('任务更新:', message.data.task)
      break
    case 'task_deleted':
      // 处理任务删除
      console.log('任务删除:', message.data.taskId)
      break
    case 'comment_created':
      // 处理评论创建
      console.log('新评论:', message.data.comment)
      break
    case 'notification':
      // 处理通知
      console.log('通知:', message.data.notification)
      break
    case 'pong':
    case 'heartbeat':
      // 心跳响应
      break
  }
}

// 连接建立后发送 enter 事件
ws.onopen = () => {
  ws.send(JSON.stringify({ event: 'enter' }))
}

// 发送心跳
setInterval(() => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ event: 'heartbeat' }))
  }
}, 30000) // 每30秒发送一次

// 连接关闭
ws.onclose = () => {
  console.log('WebSocket 连接已关闭')
  // 可以在这里实现重连逻辑
}
```

## 消息格式

### 任务创建消息
```json
{
  "event": "task_created",
  "data": {
    "projectId": "project-id",
    "taskId": "task-id",
    "task": {
      "_id": "task-id",
      "displayId": 1001,
      "title": "任务标题",
      "status": "todo",
      "priority": "medium",
      "assigneeId": "user-id",
      "creatorId": "user-id"
    }
  },
  "time": 1234567890
}
```

### 任务更新消息
```json
{
  "event": "task_updated",
  "data": {
    "projectId": "project-id",
    "taskId": "task-id",
    "task": {
      "_id": "task-id",
      "displayId": 1001,
      "title": "任务标题",
      "status": "in_progress",
      "priority": "high",
      "progress": 50
    },
    "changes": {
      "status": "in_progress",
      "priority": "high"
    }
  },
  "time": 1234567890
}
```

### 评论创建消息
```json
{
  "event": "comment_created",
  "data": {
    "projectId": "project-id",
    "taskId": "task-id",
    "comment": {
      "id": "comment-id",
      "type": "user",
      "userId": "user-id",
      "content": "评论内容",
      "summary": "评论摘要",
      "mentionedUsers": ["user-id-1", "user-id-2"]
    }
  },
  "time": 1234567890
}
```

### 通知消息
```json
{
  "event": "notification",
  "data": {
    "projectId": "project-id",
    "taskId": "task-id",
    "notification": {
      "id": "notification-id",
      "type": "mention",
      "title": "通知标题",
      "content": "通知内容",
      "read": false
    }
  },
  "time": 1234567890
}
```

## 技术实现

### Kooboo WebSocket API

使用 Kooboo 框架提供的 WebSocket API，参考客服系统的实现方式：

```typescript
// 1. 使用 useSocket 工具函数创建 socket 实例
import { useSocket } from 'code/Utils/useSocket'

const sid = currentUser._id // 使用用户 ID 作为连接标识
const socket = useSocket(sid)

// 2. 监听事件
socket.on('enter', ctx => {
  // 处理 enter 事件
  socket.send({
    to: sid,
    event: 'enter',
    data: { ... }
  })
})

socket.on('heartbeat', ctx => {
  // 处理心跳
})

// 3. 启动连接（阻塞直到连接关闭）
socket.accept()

// 发送消息
socket.send({
  to: userId,
  event: 'task_created',
  data: { ... }
})

// 获取连接
const connection = k.net.webSocket.get(userId)
connection.sendText(JSON.stringify({ event, data, time }))

// 获取所有连接
const connections = k.net.webSocket.list()
```

### 连接管理

- 使用用户 ID 作为连接标识
- 连接建立时自动使用当前登录用户的 ID
- 连接断开时自动清理

### 消息推送策略

1. **项目广播**: 任务和评论的变更会广播给项目中的所有在线成员
2. **用户推送**: 通知和 @ 提及会单独推送给特定用户
3. **错误处理**: WebSocket 推送失败不会影响主业务流程

## 注意事项

1. **认证**: WebSocket 连接需要用户已登录
2. **重连**: 前端需要实现自动重连机制
3. **心跳**: 建议前端定期发送 ping 消息保持连接
4. **性能**: 当前实现是广播给所有连接，后续可以优化为按项目订阅

## 后续优化

1. 实现按项目订阅机制（只推送相关项目的消息）
2. 实现连接池管理，提高性能
3. 添加消息队列，确保消息不丢失
4. 实现消息持久化（可选）
