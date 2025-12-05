# Kooboo 服务端 WebSocket 接入指南

## 概述

本文档说明如何在 Kooboo 服务端接入 WebSocket 实时通信功能。Kooboo 框架提供了简洁的 WebSocket API，通过 `@k-url` 注释即可定义 WebSocket 端点。

## 核心概念

### 1. 路由定义方式

在 Kooboo 中，**不需要使用 `k.api.get()` 等 API 包裹代码**。直接在文件顶部使用 `@k-url` 注释即可定义路由，文件中的代码会在匹配到该 URL 时执行。

```typescript
// @k-url /api/websocket/connect

// 这里的代码会在 WebSocket 连接到 /api/websocket/connect 时执行
// 直接写代码，不需要任何包裹函数
```

### 2. WebSocket 连接流程

1. 客户端通过 WebSocket 协议连接到 `/api/websocket/connect`
2. Kooboo 匹配到 `@k-url` 注释，执行文件中的代码
3. 代码中调用 `k.net.webSocket.accept()` 接受连接
4. 连接建立后，可以监听消息和发送消息

## 完整实现示例

### 文件结构

```
src/
├── api/
│   └── websocket.ts          # WebSocket 连接端点
├── code/
│   ├── Utils/
│   │   └── useSocket.ts      # Socket 工具函数
│   └── Services/
│       └── websocket.ts      # WebSocket 消息推送服务
```

### 1. WebSocket 连接端点 (`src/api/websocket.ts`)

```typescript
// @k-url /api/websocket/connect

import { getUserInfo } from 'code/Services/user'
import { useSocket } from 'code/Utils/useSocket'

/**
 * WebSocket 连接端点
 * GET /api/websocket/connect
 * 
 * 客户端通过 WebSocket 协议连接到此端点
 * 连接 ID 使用当前用户的 ID
 */

// 1. 鉴权检查
if (!k.account.isLogin) {
  k.logger.error('WebSocket', 'Unauthorized')
  k.api.httpCode(401)
}

// 2. 获取当前用户
const username = k.account.user.current.userName
const currentUser = getUserInfo(username)

if (!currentUser) {
  k.logger.error('WebSocket', 'User not found')
  k.api.httpCode(404)
}

// 3. 使用用户 ID 作为连接标识（session ID）
const sid = currentUser._id

// 4. 如果该用户已经在线，强制下线（避免重复连接）
if (k.net.webSocket.list().find(id => id === sid)) {
  const socketConnection = k.net.webSocket.get(sid)
  socketConnection.close()
  k.logger.information('WebSocket', `Force closed existing connection for user ${sid}`)
}

// 5. 创建 socket 实例
const socket = useSocket(sid)

// 6. 监听连接成功事件（客户端发送 enter 事件）
socket.on('enter', () => {
  k.logger.information('WebSocket', `User ${username} (${sid}) entered`)

  // 响应 enter 事件
  socket.send({
    to: sid,
    event: 'enter',
    data: {
      sid,
      online_num: k.net.webSocket.list().length,
      userId: currentUser._id,
      username: currentUser.username
    }
  })
})

// 7. 监听心跳
socket.on('heartbeat', () => {
  socket.send({
    to: sid,
    event: 'heartbeat'
  })
})

// 8. 监听 ping
socket.on('ping', () => {
  socket.send({
    to: sid,
    event: 'pong',
    data: {
      timestamp: Date.now()
    }
  })
})

// 9. 监听订阅项目消息
socket.on('subscribe', ctx => {
  const { projectId } = ctx.data || {}
  if (projectId) {
    k.logger.information('WebSocket', `User ${username} subscribed to project: ${projectId}`)
    socket.send({
      to: sid,
      event: 'subscribe',
      data: {
        projectId,
        subscribed: true
      }
    })
  }
})

// 10. 启动连接（阻塞直到连接关闭）
// 注意：accept 方法会阻塞，这里不会执行到后面的代码
socket.accept()
```

### 2. Socket 工具函数 (`src/code/Utils/useSocket.ts`)

```typescript
/**
 * Kooboo Socket 封装
 * 参考客服系统的实现方式
 */

import mitt from './mitt'

type Events = 'enter' | 'ping' | 'pong' | 'heartbeat' | 'subscribe' | 
              'task_created' | 'task_updated' | 'task_deleted' | 
              'comment_created' | 'comment_updated' | 'comment_deleted' | 
              'notification'

interface SendContent {
  to: string
  is_group?: boolean
  time?: number
  event: Events
  data?: any
  success?: Function
  failure?: Function
}

interface SocketMessage {
  to?: string
  is_group?: boolean
  time?: number
  event: Events
  data: any
}

export function useSocket(sid: string) {
  const emitter = mitt<Record<Events, SocketMessage>>()
  let isAccept = false

  function accept() {
    // 只允许接收一次
    if (isAccept) {
      throw new Error('WebSocket already accepted')
    }
    isAccept = true

    // 使用 Kooboo 的 WebSocket API 接受连接
    k.net.webSocket.accept(sid, ctx => {
      const parsed = SocketParser.parse(ctx.text) as SocketMessage | null
      if (parsed && parsed.event) {
        emitter.emit(parsed.event, parsed)
      }
    })
  }

  function send({
    to,
    is_group,
    time,
    event,
    data,
    success,
    failure
  }: SendContent) {
    const socketConnection = k.net.webSocket.get(to)
    // 不在线不发送
    if (!socketConnection) {
      failure?.()
      return
    }

    const strData = SocketParser.stringify({
      event,
      data,
      time: time || Date.now()
    })

    socketConnection.sendText(strData, success)
  }

  return {
    on: (event: Events, callback: (ctx: SocketMessage) => void) => {
      return emitter.on(event, callback)
    },
    off: emitter.off,
    accept,
    send
  }
}

/**
 * 消息解析器
 */
export class SocketParser {
  static parse(data: string): SocketMessage | null {
    try {
      const parsedData = JSON.parse(data)
      if (typeof parsedData === 'object' && parsedData.event) {
        return parsedData as SocketMessage
      }
    } catch (error) {
      k.logger.error('SocketParser', `Error parsing Socket message: ${error}`)
    }
    return null
  }

  static stringify(message: SocketMessage): string {
    // 移除 null 和 undefined 属性
    const cleaned: any = {}
    for (const key in message) {
      if (message[key as keyof SocketMessage] !== null && 
          message[key as keyof SocketMessage] !== undefined) {
        cleaned[key] = message[key as keyof SocketMessage]
      }
    }
    return JSON.stringify(cleaned)
  }
}
```

### 3. WebSocket 消息推送服务 (`src/code/Services/websocket.ts`)

```typescript
/**
 * WebSocket 服务 - 处理实时消息推送
 * 使用正确的 Kooboo WebSocket API
 */

/**
 * 发送消息给指定用户
 */
function sendToUser(userId: string, event: string, data: any) {
  try {
    const connection = k.net.webSocket.get(userId)
    if (!connection) {
      return false
    }

    const message = {
      event,
      data,
      time: Date.now()
    }

    connection.sendText(JSON.stringify(message))
    return true
  } catch (err) {
    k.logger.error('WebSocket', `Failed to send message to user ${userId}: ${err}`)
    return false
  }
}

/**
 * 广播消息给项目中的所有成员
 */
function broadcastToProject(projectId: string, event: string, data: any) {
  try {
    const allConnections = k.net.webSocket.list()
    let sentCount = 0

    for (const connectionId of allConnections) {
      try {
        const connection = k.net.webSocket.get(connectionId)
        if (connection) {
          const message = {
            event,
            data,
            time: Date.now()
          }
          connection.sendText(JSON.stringify(message))
          sentCount++
        }
      } catch (err) {
        k.logger.warning('WebSocket', `Failed to send message to connection ${connectionId}: ${err}`)
      }
    }

    k.logger.information('WebSocket', `Broadcasted ${event} to ${sentCount} connections for project ${projectId}`)
    return sentCount
  } catch (err) {
    k.logger.error('WebSocket', `Failed to broadcast message: ${err}`)
    return 0
  }
}

/**
 * 推送任务创建消息
 */
export function pushTaskCreated(task: any, projectId: string) {
  broadcastToProject(projectId, 'task_created', {
    projectId,
    taskId: task._id,
    task: {
      _id: task._id,
      displayId: task.displayId,
      title: task.title,
      status: task.status,
      priority: task.priority,
      assigneeId: task.assigneeId,
      creatorId: task.creatorId
    }
  })
}

// ... 其他推送函数类似
```

## 关键点说明

### 1. 路由定义

**重要**: 在 Kooboo 中，**不需要使用 `k.api.get()` 包裹代码**。直接在文件顶部使用 `@k-url` 注释即可：

```typescript
// ✅ 正确方式
// @k-url /api/websocket/connect

// 直接写代码
if (!k.account.isLogin) {
  k.api.httpCode(401)
}
// ...

// ❌ 错误方式（不需要这样）
k.api.get('/api/websocket/connect', () => {
  // ...
})
```

### 2. WebSocket 连接接受

使用 `k.net.webSocket.accept()` 接受连接：

```typescript
k.net.webSocket.accept(sid, ctx => {
  // ctx.text 是接收到的消息文本
  // 解析消息并处理
})
```

### 3. 发送消息

有两种方式发送消息：

**方式一：使用 `useSocket` 工具函数**
```typescript
socket.send({
  to: userId,
  event: 'task_created',
  data: { ... }
})
```

**方式二：直接使用 Kooboo API**
```typescript
const connection = k.net.webSocket.get(userId)
if (connection) {
  connection.sendText(JSON.stringify({
    event: 'task_created',
    data: { ... },
    time: Date.now()
  }))
}
```

### 4. 连接管理

```typescript
// 获取所有连接 ID
const allConnections = k.net.webSocket.list()

// 获取指定连接
const connection = k.net.webSocket.get(connectionId)

// 关闭连接
connection.close()
```

### 5. 消息格式

消息统一使用以下格式：

```typescript
{
  event: string,    // 事件类型
  data: any,        // 数据
  time: number      // 时间戳
}
```

## 在业务代码中使用

在任务、评论等业务 API 中，调用推送服务：

```typescript
// @k-url /api/task/create

import { pushTaskCreated } from 'code/Services/websocket'

// ... 创建任务的业务逻辑
const task = await createTask(...)

// 推送 WebSocket 消息
pushTaskCreated(task, projectId)

// 返回响应
k.api.json({ success: true, data: task })
```

## 开发环境配置

### Vite 代理配置

在开发环境中，需要配置 Vite 代理以支持 WebSocket：

```typescript
// frontend/vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'https://your-domain.com',
        changeOrigin: true,
        secure: false,
        ws: true, // ✅ 重要：启用 WebSocket 代理
      }
    }
  }
})
```

### 前端连接

```typescript
// 开发模式：使用当前域名和端口（Vite 代理会处理）
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
const url = `${protocol}//${window.location.host}/api/websocket/connect`

const ws = new WebSocket(url)
```

## 注意事项

1. **认证**: WebSocket 连接需要用户已登录，在连接端点中检查 `k.account.isLogin`
2. **连接标识**: 使用用户 ID 作为连接标识（`sid`），确保每个用户只有一个连接
3. **重复连接**: 如果用户已在线，应该先关闭旧连接再建立新连接
4. **阻塞执行**: `socket.accept()` 会阻塞执行，直到连接关闭
5. **错误处理**: WebSocket 推送失败不应该影响主业务流程
6. **心跳机制**: 建议客户端定期发送心跳消息保持连接

## 总结

Kooboo 的 WebSocket 接入非常简洁：

1. 使用 `@k-url` 注释定义路由（**不需要 `k.api.get()` 包裹**）
2. 直接写代码处理连接逻辑
3. 使用 `k.net.webSocket.accept()` 接受连接
4. 使用 `k.net.webSocket.get()` 和 `sendText()` 发送消息
5. 使用 `useSocket` 工具函数简化事件监听和消息发送

这种设计让 WebSocket 接入变得非常简单直接！
