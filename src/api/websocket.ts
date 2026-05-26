// @k-url /api/websocket/connect

import { getCurrentAuthUser } from 'code/Services/auth'
import { useSocket } from 'code/Utils/useSocket'

/**
 * WebSocket 连接端点
 * GET /api/websocket/connect
 */

const currentUser = getCurrentAuthUser()
if (!currentUser) {
  k.logger.error('WebSocket', 'Unauthorized')
  k.api.httpCode(401)
}

const sid = currentUser!._id

if (k.net.webSocket.list().find(id => id === sid)) {
  const socketConnection = k.net.webSocket.get(sid)
  socketConnection.close()
  k.logger.information('WebSocket', `Force closed existing connection for user ${sid}`)
}

const socket = useSocket(sid)

socket.on('enter', () => {
  k.logger.information('WebSocket', `User ${currentUser!.username} (${sid}) entered`)

  socket.send({
    to: sid,
    event: 'enter',
    data: {
      sid,
      online_num: k.net.webSocket.list().length,
      userId: currentUser!._id,
      username: currentUser!.username
    }
  })
})

socket.on('heartbeat', () => {
  socket.send({
    to: sid,
    event: 'heartbeat'
  })
})

socket.on('ping', () => {
  socket.send({
    to: sid,
    event: 'pong',
    data: {
      timestamp: Date.now()
    }
  })
})

socket.on('subscribe', ctx => {
  const { projectId } = ctx.data || {}
  if (projectId) {
    k.logger.information('WebSocket', `User ${currentUser!.username} subscribed to project: ${projectId}`)
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

socket.accept()
