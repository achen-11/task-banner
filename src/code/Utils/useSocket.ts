/**
 * Kooboo Socket 封装
 * 参考客服系统的实现方式
 */

import mitt from './mitt'

type Events = 'enter' | 'ping' | 'pong' | 'heartbeat' | 'subscribe' | 'task_created' | 'task_updated' | 'task_deleted' | 'comment_created' | 'comment_updated' | 'comment_deleted' | 'notification'

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
      if (message[key as keyof SocketMessage] !== null && message[key as keyof SocketMessage] !== undefined) {
        cleaned[key] = message[key as keyof SocketMessage]
      }
    }
    return JSON.stringify(cleaned)
  }
}
