/**
 * WebSocket Store - 管理 WebSocket 连接和全局消息处理
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useWebSocket, type WebSocketCallbacks } from '@/composables/useWebSocket'
import type {
  TaskCreatedData,
  TaskUpdatedData,
  TaskDeletedData,
  CommentCreatedData,
  CommentUpdatedData,
  CommentDeletedData,
  NotificationData,
  WebSocketMessage
} from '@/types/websocket'
import { ElMessage, ElNotification } from 'element-plus'

export const useWebSocketStore = defineStore('websocket', () => {
  const isConnected = ref(false)
  const lastMessage = ref<WebSocketMessage | null>(null)

  // WebSocket 回调
  const callbacks: WebSocketCallbacks = {
    onConnect: () => {
      console.log('[WebSocket Store] Connected')
      isConnected.value = true
    },

    onDisconnect: () => {
      console.log('[WebSocket Store] Disconnected')
      isConnected.value = false
    },

    onError: (error) => {
      console.error('[WebSocket Store] Error:', error)
    },

    onTaskCreated: (data: TaskCreatedData, message: WebSocketMessage) => {
      console.log('[WebSocket Store] Task created:', data)
      lastMessage.value = message

      // 触发自定义事件，让组件监听
      window.dispatchEvent(new CustomEvent('websocket:task-created', {
        detail: { data, message }
      }))

      // 显示通知（可选）
      ElNotification({
        title: '新任务',
        message: `任务 "${data.task.title}" 已创建`,
        type: 'info',
        duration: 3000
      })
    },

    onTaskUpdated: (data: TaskUpdatedData, message: WebSocketMessage) => {
      console.log('[WebSocket Store] Task updated:', data)
      lastMessage.value = message

      // 触发自定义事件
      window.dispatchEvent(new CustomEvent('websocket:task-updated', {
        detail: { data, message }
      }))

      // 显示通知（可选）
      if (data.changes) {
        const changeKeys = Object.keys(data.changes)
        if (changeKeys.length > 0) {
          ElNotification({
            title: '任务已更新',
            message: `任务 "${data.task.title}" 的 ${changeKeys.join(', ')} 已更新`,
            type: 'success',
            duration: 3000
          })
        }
      }
    },

    onTaskDeleted: (data: TaskDeletedData, message: WebSocketMessage) => {
      console.log('[WebSocket Store] Task deleted:', data)
      lastMessage.value = message

      // 触发自定义事件
      window.dispatchEvent(new CustomEvent('websocket:task-deleted', {
        detail: { data, message }
      }))

      // 显示通知
      ElNotification({
        title: '任务已删除',
        message: '任务已被删除',
        type: 'warning',
        duration: 3000
      })
    },

    onCommentCreated: (data: CommentCreatedData, message: WebSocketMessage) => {
      console.log('[WebSocket Store] Comment created:', data)
      lastMessage.value = message

      // 触发自定义事件
      window.dispatchEvent(new CustomEvent('websocket:comment-created', {
        detail: { data, message }
      }))

      // 如果是 @ 提及，显示通知
      if (data.comment.mentionedUsers && data.comment.mentionedUsers.length > 0) {
        ElNotification({
          title: '有人提到了你',
          message: data.comment.summary || data.comment.content.substring(0, 50),
          type: 'info',
          duration: 5000
        })
      }
    },

    onCommentUpdated: (data: CommentUpdatedData, message: WebSocketMessage) => {
      console.log('[WebSocket Store] Comment updated:', data)
      lastMessage.value = message

      // 触发自定义事件
      window.dispatchEvent(new CustomEvent('websocket:comment-updated', {
        detail: { data, message }
      }))
    },

    onCommentDeleted: (data: CommentDeletedData, message: WebSocketMessage) => {
      console.log('[WebSocket Store] Comment deleted:', data)
      lastMessage.value = message

      // 触发自定义事件
      window.dispatchEvent(new CustomEvent('websocket:comment-deleted', {
        detail: { data, message }
      }))
    },

    onNotification: (data: NotificationData, message: WebSocketMessage) => {
      console.log('[WebSocket Store] Notification:', data)
      lastMessage.value = message

      // 触发自定义事件
      window.dispatchEvent(new CustomEvent('websocket:notification', {
        detail: { data, message }
      }))

      // 显示通知
      ElNotification({
        title: data.notification.title || '通知',
        message: data.notification.content || '',
        type: 'info',
        duration: 5000
      })
    }
  }

  // 初始化 WebSocket
  const { connect, disconnect, isConnected: wsConnected, subscribeProject } = useWebSocket(callbacks)

  // 连接 WebSocket
  function initialize() {
    connect()
  }

  // 断开连接
  function cleanup() {
    disconnect()
  }

  // 订阅项目消息
  function subscribe(projectId: string) {
    subscribeProject(projectId)
  }

  return {
    isConnected: wsConnected,
    lastMessage,
    initialize,
    cleanup,
    subscribe
  }
})
