// @k-url /api/test/{action}
//
// 开发/调试专用：手动触发 WebSocket 广播，非生产功能。
// 见 .kooboo-ai/specs/backend.md § 开发调试 API

import { success, error } from 'code/Utils/response'
import { getCurrentAuthUser } from 'code/Services/auth'
import { getUserInfo } from 'code/Services/user'
import { SocketParser } from 'code/Utils/useSocket'

// 定义事件类型
type Events = 'enter' | 'ping' | 'pong' | 'heartbeat' | 'subscribe' | 
              'task_created' | 'task_updated' | 'task_deleted' | 
              'comment_created' | 'comment_updated' | 'comment_deleted' | 
              'document_created' | 'document_updated' | 'document_deleted' |
              'notification'

/**
 * 广播消息给所有连接（测试用）
 */
function broadcastMessage(event: Events, data: any) {
  try {
    const allConnections = k.net.webSocket.list()
    let sentCount = 0

    for (const connectionId of allConnections) {
      try {
        const connection = k.net.webSocket.get(connectionId)
        if (connection) {
          const message: { event: Events; data: any; time: number } = {
            event,
            data,
            time: Date.now()
          }
          // 使用 SocketParser 格式化消息
          const formattedMessage = SocketParser.stringify(message as any)
          connection.sendText(formattedMessage)
          sentCount++
        }
      } catch (err) {
        k.logger.warning('WebSocket', `Failed to send message to connection ${connectionId}: ${err}`)
      }
    }

    k.logger.information('WebSocket', `Broadcasted ${event} to ${sentCount} connections`)
    return sentCount
  } catch (err) {
    k.logger.error('WebSocket', `Failed to broadcast message: ${err}`)
    return 0
  }
}

// GET /api/test/websocket?event=task_created&projectId=xxx&message=测试消息
k.api.get("websocket", () => {
  // 2. 获取参数
  const query = k.request.queryString as any
  const event = query.event || 'notification'
  const projectId = query.projectId || ''
  const message = query.message || '这是一条测试消息'
  const userId = query.userId // 可选：指定用户 ID

  // 3. 获取当前用户
    const currentUser = getCurrentAuthUser()
    if (!currentUser) {
      return error('Unauthorized', 401)
    }
  if (!currentUser) {
    return error('User not found', 404)
  }

  try {
    // 4. 构建测试消息数据
    // 根据事件类型构建不同的数据格式
    let testData: any
    
    if (event === 'notification') {
      // notification 事件需要特定的数据格式
      testData = {
        projectId: projectId || 'test',
        notification: {
          id: `test-${Date.now()}`,
          type: 'test',
          title: '测试通知',
          content: message,
          read: false
        }
      }
    } else if (event === 'task_created') {
      // task_created 事件格式
      testData = {
        projectId: projectId || 'test',
        taskId: `test-task-${Date.now()}`,
        task: {
          _id: `test-task-${Date.now()}`,
          displayId: 9999,
          title: message,
          status: 'todo',
          priority: 'medium',
          assigneeId: '',
          creatorId: currentUser._id
        }
      }
    } else if (event === 'document_created') {
      // document_created 事件格式
      testData = {
        projectId: projectId || 'test',
        documentId: `test-doc-${Date.now()}`,
        document: {
          _id: `test-doc-${Date.now()}`,
          title: message,
          type: 'markdown',
          status: 'draft',
          version: 1,
          tags: [],
          createdBy: currentUser._id
        }
      }
    } else {
      // 其他事件的通用格式
      testData = {
        projectId: projectId || 'test',
        message,
        timestamp: Date.now(),
        from: {
          userId: currentUser._id,
          username: currentUser.username
        }
      }
    }

    // 5. 发送 WebSocket 消息
    if (userId) {
      // 发送给指定用户
      const connection = k.net.webSocket.get(userId)
      if (connection) {
        const wsMessage: { event: Events; data: any; time: number } = {
          event: event as Events,
          data: testData,
          time: Date.now()
        }
        // 使用 SocketParser 格式化消息
        const formattedMessage = SocketParser.stringify(wsMessage as any)
        connection.sendText(formattedMessage)
        return success({
          sent: true,
          target: 'user',
          userId,
          event,
          message: '消息已发送给指定用户'
        })
      } else {
        return error(`用户 ${userId} 不在线`, 404)
      }
    } else {
      // 广播给所有连接
      const sentCount = broadcastMessage(event as Events, testData)
      return success({
        sent: true,
        target: 'broadcast',
        sentCount,
        event,
        message: `消息已广播给 ${sentCount} 个连接`
      })
    }
  } catch (err) {
    k.logger.error('TestWebSocketError', err instanceof Error ? err.message : String(err))
    return error('Failed to send WebSocket message', 500, err)
  }
})
