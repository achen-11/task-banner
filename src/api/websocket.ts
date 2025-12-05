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

// 4. 如果该用户已经在线，强制下线
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
// 注意：accept 方法会阻塞，这里不会执行到
socket.accept()

