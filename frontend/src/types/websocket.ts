/**
 * WebSocket 消息类型定义
 */

export type WebSocketMessageType =
  | 'task_created'
  | 'task_updated'
  | 'task_deleted'
  | 'comment_created'
  | 'comment_updated'
  | 'comment_deleted'
  | 'document_created'
  | 'document_updated'
  | 'document_deleted'
  | 'notification'
  | 'ping'
  | 'pong'
  | 'subscribe' // 客户端发送的订阅消息
  | 'enter' // 客户端发送的连接确认消息
  | 'heartbeat' // 客户端发送的心跳消息

// 后端发送的消息格式：{ event, data, time }
export interface WebSocketMessage {
  event: WebSocketMessageType
  data?: any
  time?: number
  // 兼容旧格式
  type?: WebSocketMessageType
  timestamp?: number
  projectId?: string
  taskId?: string
}

export interface TaskCreatedData {
  task: {
    _id: string
    displayId: number
    title: string
    status: string
    priority: string
    assigneeId?: string
    creatorId: string
  }
}

export interface TaskUpdatedData {
  task: {
    _id: string
    displayId: number
    title: string
    status: string
    priority: string
    assigneeId?: string
    progress?: number
  }
  changes?: Record<string, any>
}

export interface TaskDeletedData {
  taskId: string
}

export interface CommentCreatedData {
  comment: {
    id: string
    type: string
    userId: string
    content: string
    summary?: string
    mentionedUsers?: string[]
  }
}

export interface CommentUpdatedData {
  comment: {
    id: string
    content: string
    summary?: string
  }
}

export interface CommentDeletedData {
  commentId: string
}

export interface NotificationData {
  notification: {
    id: string
    type: string
    title?: string
    content?: string
    read: boolean
  }
}

export interface DocumentCreatedData {
  document: {
    _id: string
    title: string
    type: string
    status: string
    version: number
    tags: string[]
    createdBy: string
  }
}

export interface DocumentUpdatedData {
  document: {
    _id: string
    title: string
    type: string
    status: string
    version: number
    tags: string[]
    updatedBy: string
  }
  changes?: Record<string, any>
}

export interface DocumentDeletedData {
  documentId: string
}
