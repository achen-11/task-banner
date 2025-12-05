/**
 * WebSocket 服务 - 处理实时消息推送
 * 使用正确的 Kooboo WebSocket API
 */

// 注意：k 是 Kooboo 运行时环境提供的全局对象
// 在 TypeScript 编译时可能会有类型错误，但在运行时是可用的

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
 * 注意：这里简化处理，实际应该根据用户所属项目来过滤
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

/**
 * 推送任务更新消息
 */
export function pushTaskUpdated(task: any, projectId: string, changes?: Record<string, any>) {
  broadcastToProject(projectId, 'task_updated', {
    projectId,
    taskId: task._id,
    task: {
      _id: task._id,
      displayId: task.displayId,
      title: task.title,
      status: task.status,
      priority: task.priority,
      assigneeId: task.assigneeId,
      progress: task.progress
    },
    changes
  })
}

/**
 * 推送任务删除消息
 */
export function pushTaskDeleted(taskId: string, projectId: string) {
  broadcastToProject(projectId, 'task_deleted', {
    projectId,
    taskId
  })
}

/**
 * 推送评论创建消息
 */
export function pushCommentCreated(comment: any, taskId: string, projectId: string) {
  broadcastToProject(projectId, 'comment_created', {
    projectId,
    taskId,
    comment: {
      id: comment._id || comment.id,
      type: comment.type,
      userId: comment.userId,
      content: comment.content,
      summary: comment.summary,
      mentionedUsers: comment.mentionedUsers
    }
  })

  // 如果有 @ 提及的用户，单独推送通知
  if (comment.mentionedUsers && comment.mentionedUsers.length > 0) {
    comment.mentionedUsers.forEach((userId: string) => {
      sendToUser(userId, 'notification', {
        projectId,
        taskId,
        type: 'mention',
        message: `有人在任务中提到了你`,
        commentId: comment._id || comment.id
      })
    })
  }
}

/**
 * 推送评论更新消息
 */
export function pushCommentUpdated(comment: any, taskId: string, projectId: string) {
  broadcastToProject(projectId, 'comment_updated', {
    projectId,
    taskId,
    comment: {
      id: comment._id || comment.id,
      content: comment.content,
      summary: comment.summary
    }
  })
}

/**
 * 推送评论删除消息
 */
export function pushCommentDeleted(commentId: string, taskId: string, projectId: string) {
  broadcastToProject(projectId, 'comment_deleted', {
    projectId,
    taskId,
    commentId
  })
}

/**
 * 推送通知消息给特定用户
 */
export function pushNotification(userId: string, notification: any, projectId?: string) {
  sendToUser(userId, 'notification', {
    projectId,
    notification: {
      id: notification._id || notification.id,
      type: notification.type,
      title: notification.title,
      content: notification.content,
      read: notification.read
    }
  })
}
