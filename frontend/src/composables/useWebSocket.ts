/**
 * WebSocket Composable - 管理 WebSocket 连接和消息处理
 */
import { ref, onUnmounted, type Ref } from 'vue'
import { isLogin, getCurrentUser } from '@/utils/auth'
import type {
  WebSocketMessage,
  WebSocketMessageType,
  TaskCreatedData,
  TaskUpdatedData,
  TaskDeletedData,
  CommentCreatedData,
  CommentUpdatedData,
  CommentDeletedData,
  NotificationData
} from '@/types/websocket'

export interface WebSocketCallbacks {
  onTaskCreated?: (data: TaskCreatedData, message: WebSocketMessage) => void
  onTaskUpdated?: (data: TaskUpdatedData, message: WebSocketMessage) => void
  onTaskDeleted?: (data: TaskDeletedData, message: WebSocketMessage) => void
  onCommentCreated?: (data: CommentCreatedData, message: WebSocketMessage) => void
  onCommentUpdated?: (data: CommentUpdatedData, message: WebSocketMessage) => void
  onCommentDeleted?: (data: CommentDeletedData, message: WebSocketMessage) => void
  onNotification?: (data: NotificationData, message: WebSocketMessage) => void
  onError?: (error: Event | Error) => void
  onConnect?: () => void
  onDisconnect?: () => void
}

export function useWebSocket(callbacks: WebSocketCallbacks = {}) {
  const ws = ref<WebSocket | null>(null)
  const isConnected = ref(false)
  const reconnectAttempts = ref(0)
  const maxReconnectAttempts = 5
  const reconnectDelay = 3000 // 3秒
  const pingInterval = ref<number | null>(null)
  const reconnectTimer = ref<number | null>(null)

  /**
   * 获取 WebSocket URL
   */
  function getWebSocketUrl(): string {
    const isDevelopment = import.meta.env.DEV
    
    if (isDevelopment) {
      // 开发模式：使用当前域名和端口（Vite 代理会处理）
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      return `${protocol}//${window.location.host}/api/websocket/connect`
    } else {
      // 生产模式：使用配置的 API 地址
      const baseURL = import.meta.env.VITE_API_BASE_URL || window.location.origin
      // 将 http:// 或 https:// 转换为 ws:// 或 wss://
      const wsProtocol = baseURL.startsWith('https') ? 'wss' : 'ws'
      const wsBase = baseURL.replace(/^https?:\/\//, '')
      return `${wsProtocol}://${wsBase}/api/websocket/connect`
    }
  }

  /**
   * 连接 WebSocket
   */
  function connect() {
    // 检查登录状态
    if (!isLogin()) {
      console.warn('[WebSocket] User not logged in, skipping connection')
      return
    }

    // 如果已经连接，先关闭
    if (ws.value && ws.value.readyState === WebSocket.OPEN) {
      console.log('[WebSocket] Already connected')
      return
    }

    try {
      const url = getWebSocketUrl()
      console.log('[WebSocket] Connecting to:', url)

      const websocket = new WebSocket(url)
      ws.value = websocket

      websocket.onopen = () => {
        console.log('[WebSocket] Connected')
        isConnected.value = true
        reconnectAttempts.value = 0

        // 发送 enter 事件（通知服务器连接已建立）
        send({ event: 'enter' })

        // 启动心跳
        startPing()

        // 调用连接回调
        callbacks.onConnect?.()
      }

      websocket.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          handleMessage(message)
        } catch (error) {
          console.error('[WebSocket] Failed to parse message:', error)
        }
      }

      websocket.onerror = (error) => {
        console.error('[WebSocket] Error:', error)
        callbacks.onError?.(error)
      }

      websocket.onclose = (event) => {
        console.log('[WebSocket] Disconnected', event.code, event.reason)
        isConnected.value = false
        stopPing()

        // 调用断开回调
        callbacks.onDisconnect?.()

        // 如果不是正常关闭，尝试重连
        if (event.code !== 1000 && reconnectAttempts.value < maxReconnectAttempts) {
          scheduleReconnect()
        }
      }
    } catch (error) {
      console.error('[WebSocket] Failed to create connection:', error)
      callbacks.onError?.(error as Error)
    }
  }

  /**
   * 处理接收到的消息
   */
  function handleMessage(message: WebSocketMessage) {
    // 支持新格式 { event, data, time } 和旧格式 { type, data, timestamp }
    const eventType = message.event || message.type
    console.log('[WebSocket] Received message:', eventType, message)

    switch (eventType) {
      case 'task_created':
        callbacks.onTaskCreated?.(message.data as TaskCreatedData, message)
        break

      case 'task_updated':
        callbacks.onTaskUpdated?.(message.data as TaskUpdatedData, message)
        break

      case 'task_deleted':
        callbacks.onTaskDeleted?.(message.data as TaskDeletedData, message)
        break

      case 'comment_created':
        callbacks.onCommentCreated?.(message.data as CommentCreatedData, message)
        break

      case 'comment_updated':
        callbacks.onCommentUpdated?.(message.data as CommentUpdatedData, message)
        break

      case 'comment_deleted':
        callbacks.onCommentDeleted?.(message.data as CommentDeletedData, message)
        break

      case 'notification':
        callbacks.onNotification?.(message.data as NotificationData, message)
        break

      case 'pong':
      case 'heartbeat':
        // 心跳响应，不需要处理
        break

      case 'enter':
        // 连接成功事件（服务器响应）
        console.log('[WebSocket] Enter confirmed:', message.data)
        if (message.data?.online_num !== undefined) {
          console.log(`[WebSocket] Online users: ${message.data.online_num}`)
        }
        break

      default:
        console.warn('[WebSocket] Unknown message type:', eventType)
    }
  }

  /**
   * 发送消息
   * 使用新格式：{ event, data, time }
   */
  function send(message: { event?: WebSocketMessageType; type?: WebSocketMessageType; data?: any; [key: string]: any }) {
    if (ws.value && ws.value.readyState === WebSocket.OPEN) {
      // 转换为新格式
      const formattedMessage: any = {
        event: message.event || message.type || 'ping',
        data: message.data,
        time: Date.now()
      }
      ws.value.send(JSON.stringify(formattedMessage))
    } else {
      console.warn('[WebSocket] Cannot send message, connection not open')
    }
  }

  /**
   * 启动心跳
   */
  function startPing() {
    stopPing()
    pingInterval.value = window.setInterval(() => {
      if (ws.value && ws.value.readyState === WebSocket.OPEN) {
        send({ event: 'heartbeat' })
      }
    }, 30000) // 每30秒发送一次心跳
  }

  /**
   * 停止心跳
   */
  function stopPing() {
    if (pingInterval.value !== null) {
      clearInterval(pingInterval.value)
      pingInterval.value = null
    }
  }

  /**
   * 安排重连
   */
  function scheduleReconnect() {
    if (reconnectTimer.value !== null) {
      return // 已经安排了重连
    }

    reconnectAttempts.value++
    const delay = reconnectDelay * reconnectAttempts.value

    console.log(`[WebSocket] Scheduling reconnect in ${delay}ms (attempt ${reconnectAttempts.value}/${maxReconnectAttempts})`)

    reconnectTimer.value = window.setTimeout(() => {
      reconnectTimer.value = null
      if (!isConnected.value && reconnectAttempts.value < maxReconnectAttempts) {
        connect()
      }
    }, delay)
  }

  /**
   * 断开连接
   */
  function disconnect() {
    stopPing()
    if (reconnectTimer.value !== null) {
      clearTimeout(reconnectTimer.value)
      reconnectTimer.value = null
    }
    if (ws.value) {
      ws.value.close(1000, 'Client disconnect')
      ws.value = null
    }
    isConnected.value = false
  }

  /**
   * 订阅项目消息（可选功能）
   */
  function subscribeProject(projectId: string) {
    send({
      event: 'subscribe',
      data: { projectId }
    })
  }

  // 组件卸载时断开连接
  onUnmounted(() => {
    disconnect()
  })

  return {
    ws: ws as Ref<WebSocket | null>,
    isConnected,
    connect,
    disconnect,
    send,
    subscribeProject
  }
}
