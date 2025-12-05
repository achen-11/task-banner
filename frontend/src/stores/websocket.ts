/**
 * WebSocket Store - 管理 WebSocket 连接和全局消息处理
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useWebSocket, type WebSocketCallbacks } from '@/composables/useWebSocket'
import { usePageTitle } from '@/composables/usePageTitle'
import type {
  TaskCreatedData,
  TaskUpdatedData,
  TaskDeletedData,
  CommentCreatedData,
  CommentUpdatedData,
  CommentDeletedData,
  DocumentCreatedData,
  DocumentUpdatedData,
  DocumentDeletedData,
  NotificationData,
  WebSocketMessage
} from '@/types/websocket'
import { ElMessage, ElNotification } from 'element-plus'

export const useWebSocketStore = defineStore('websocket', () => {
  const isConnected = ref(false)
  const lastMessage = ref<WebSocketMessage | null>(null)
  
  // 页面标题管理
  const { incrementUnread, decrementUnread, resetTitle, setUnreadCount } = usePageTitle()

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
      console.log('[WebSocket Store] Task created:', data, message)
      lastMessage.value = message

      // 从 data 中提取 projectId（兼容 message.projectId）
      const projectId = (data as any).projectId || message.projectId

      // 触发自定义事件，让组件监听
      window.dispatchEvent(new CustomEvent('websocket:task-created', {
        detail: { data, message: { ...message, projectId } }
      }))

      // 显示通知（总是显示，不受项目过滤影响）
      ElNotification({
        title: '新任务',
        message: `任务 "${data.task.title}" 已创建`,
        type: 'info',
        duration: 3000
      })
    },

    onTaskUpdated: (data: TaskUpdatedData, message: WebSocketMessage) => {
      console.log('[WebSocket Store] Task updated:', data, message)
      lastMessage.value = message

      // 从 data 中提取 projectId（兼容 message.projectId）
      const projectId = (data as any).projectId || message.projectId

      // 触发自定义事件
      window.dispatchEvent(new CustomEvent('websocket:task-updated', {
        detail: { data, message: { ...message, projectId } }
      }))

      // 显示通知（总是显示）
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
      } else {
        ElNotification({
          title: '任务已更新',
          message: `任务 "${data.task.title}" 已更新`,
          type: 'success',
          duration: 3000
        })
      }
    },

    onTaskDeleted: (data: TaskDeletedData, message: WebSocketMessage) => {
      console.log('[WebSocket Store] Task deleted:', data, message)
      lastMessage.value = message

      // 从 data 中提取 projectId（兼容 message.projectId）
      const projectId = (data as any).projectId || message.projectId

      // 触发自定义事件
      window.dispatchEvent(new CustomEvent('websocket:task-deleted', {
        detail: { data, message: { ...message, projectId } }
      }))

      // 显示通知（总是显示）
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

    onDocumentCreated: (data: DocumentCreatedData, message: WebSocketMessage) => {
      console.log('[WebSocket Store] Document created:', data, message)
      lastMessage.value = message

      // 从 data 中提取 projectId（兼容 message.projectId）
      const projectId = (data as any).projectId || message.projectId

      // 触发自定义事件，让组件监听
      window.dispatchEvent(new CustomEvent('websocket:document-created', {
        detail: { data, message: { ...message, projectId } }
      }))

      // 显示通知（总是显示）
      ElNotification({
        title: '新文档',
        message: `文档 "${data.document.title}" 已创建`,
        type: 'info',
        duration: 3000
      })
    },

    onDocumentUpdated: (data: DocumentUpdatedData, message: WebSocketMessage) => {
      console.log('[WebSocket Store] Document updated:', data, message)
      lastMessage.value = message

      // 从 data 中提取 projectId（兼容 message.projectId）
      const projectId = (data as any).projectId || message.projectId

      // 触发自定义事件
      window.dispatchEvent(new CustomEvent('websocket:document-updated', {
        detail: { data, message: { ...message, projectId } }
      }))

      // 显示通知（总是显示）
      if (data.changes) {
        const changeKeys = Object.keys(data.changes)
        if (changeKeys.length > 0) {
          ElNotification({
            title: '文档已更新',
            message: `文档 "${data.document.title}" 的 ${changeKeys.join(', ')} 已更新`,
            type: 'success',
            duration: 3000
          })
        }
      } else {
        ElNotification({
          title: '文档已更新',
          message: `文档 "${data.document.title}" 已更新`,
          type: 'success',
          duration: 3000
        })
      }
    },

    onDocumentDeleted: (data: DocumentDeletedData, message: WebSocketMessage) => {
      console.log('[WebSocket Store] Document deleted:', data, message)
      lastMessage.value = message

      // 从 data 中提取 projectId（兼容 message.projectId）
      const projectId = (data as any).projectId || message.projectId

      // 触发自定义事件
      window.dispatchEvent(new CustomEvent('websocket:document-deleted', {
        detail: { data, message: { ...message, projectId } }
      }))

      // 显示通知（总是显示）
      ElNotification({
        title: '文档已删除',
        message: '文档已被删除',
        type: 'warning',
        duration: 3000
      })
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

      // 如果通知未读，增加未读数量并更新页面标题
      if (!data.notification.read) {
        incrementUnread()
      }
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
