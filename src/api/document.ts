// @k-url /api/document/{action}

import { success, error } from 'code/Utils/response'
import { getCurrentAuthUser } from 'code/Services/auth'
import {
  createDocument,
  getDocumentById,
  getDocumentDetailById,
  getProjectDocuments,
  updateDocument,
  deleteDocument,
  getDocumentVersions,
  getDocumentVersion,
  checkDocumentPermission
} from 'code/Services/document'
import { checkProjectPermission } from 'code/Services/project'
import { pushDocumentCreated, pushDocumentUpdated, pushDocumentDeleted, pushNotification } from 'code/Services/websocket'
import { createMCPOperationNotification } from 'code/Services/notification'
import { Notification } from 'code/Models/Notification'

interface DocumentListQuery {
  projectId: string
  page: string
  size: string
  status: string
  type: string
  keyword: string
}
// GET /api/document/list?projectId=xxx&page=1&size=20&status=draft&type=markdown&keyword=xxx
k.api.get("list", () => {
  const currentUser = getCurrentAuthUser()
  if (!currentUser) {
    return error('Unauthorized', 401)
  }
  const query = k.request.queryString as unknown as DocumentListQuery
  const projectId = query?.projectId
  const page = parseInt(query?.page) || 1
  const size = parseInt(query?.size) || 20
  const status = query?.status
  const type = query?.type
  const keyword = query?.keyword

  if (!projectId || projectId.trim() === '') {
    return error('Project ID is required', 400)
  }

  // 检查项目权限（需要成员权限才能查看文档列表）
  if (!checkProjectPermission(projectId, currentUser._id, 'member')) {
    return error('You do not have permission to view documents in this project', 403)
  }

  try {
    // 获取文档列表
    const documents = getProjectDocuments(projectId, {
      status,
      type,
      keyword
    })

    // 手动分页
    const total = documents.length
    const startIndex = (page - 1) * size
    const endIndex = startIndex + size
    const paginatedDocuments = documents.slice(startIndex, endIndex)

    return success({
      items: paginatedDocuments,
      total,
      page,
      size
    })

  } catch (err) {
    return error('Failed to get document list', 500, err)
  }
})

// GET /api/document/detail?id=xxx
k.api.get("detail", (id: string) => {
  const currentUser = getCurrentAuthUser()
  if (!currentUser) {
    return error('Unauthorized', 401)
  }
  const documentId = id

  if (!documentId || documentId.trim() === '') {
    return error('Document ID is required', 400)
  }

  // 检查文档权限
  if (!checkDocumentPermission(documentId, currentUser._id, 'view')) {
    return error('You do not have permission to view this document', 403)
  }

  try {
    const document = getDocumentDetailById(documentId)

    if (!document) {
      return error('Document not found', 404)
    }

    return success(document)

  } catch (err) {
    return error('Failed to get document', 500, err)
  }
})

// POST /api/document/create
k.api.post("create", (body: any) => {
  const currentUser = getCurrentAuthUser()
  if (!currentUser) {
    return error('Unauthorized', 401)
  }
  const { title, content, projectId, type, tags, status } = body

  // 参数验证
  if (!title || title.trim() === '') {
    return error('Document title is required', 400)
  }

  if (!projectId || projectId.trim() === '') {
    return error('Project ID is required', 400)
  }

  // 检查项目权限（需要成员权限才能创建文档）
  if (!checkProjectPermission(projectId, currentUser._id, 'member')) {
    return error('You do not have permission to create documents in this project', 403)
  }

  try {
    const documentId = createDocument(
      {
        title: title.trim(),
        content: content || '',
        projectId,
        type: type || 'markdown',
        tags: tags || [],
        status: status || 'draft'
      },
      currentUser._id
    )

    const document = getDocumentById(documentId)
    
    // 推送 WebSocket 消息
    try {
      pushDocumentCreated(document!, projectId)
    } catch (wsErr) {
      // WebSocket 推送失败不影响主流程
      k.logger.warning('WebSocket', `Failed to push document created message: ${wsErr}`)
    }

    // 检测是否是 MCP 调用
    const authHeader = k.request.headers.get('Authorization') || k.request.headers.get('authorization')
    const isMCPCall = authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
    
    if (isMCPCall) {
      // MCP 调用：创建真实通知并推送
      try {
        const notificationId = createMCPOperationNotification(
          currentUser._id,
          'document_created',
          document!.title,
          document!._id,
          projectId
        )
        
        const notification = Notification.findById(notificationId)
        if (notification) {
          pushNotification(currentUser._id, notification, projectId)
        }
      } catch (notifErr) {
        k.logger.warning('Notification', `Failed to create MCP notification: ${notifErr}`)
      }
    }
    
    return success(document, 'Document created successfully')

  } catch (err) {
    return error('Failed to create document', 500, err)
  }
})

// PUT /api/document/update
k.api.put("update", (body: any) => {
  const currentUser = getCurrentAuthUser()
  if (!currentUser) {
    return error('Unauthorized', 401)
  }
  const { id, title, content, status, tags, order, changeLog } = body

  if (!id || id.trim() === '') {
    return error('Document ID is required', 400)
  }

  // 检查文档权限
  if (!checkDocumentPermission(id, currentUser._id, 'edit')) {
    return error('You do not have permission to update this document', 403)
  }

  try {
    // 获取当前文档以获取 projectId
    const currentDoc = getDocumentById(id)
    if (!currentDoc) {
      return error('Document not found', 404)
    }

    const res = updateDocument(
      id,
      {
        title: title?.trim(),
        content,
        status,
        tags,
        order
      },
      currentUser._id,
      changeLog
    )

    if (!res) {
      return error('Failed to update document', 500)
    }

    const document = getDocumentById(id)
    
    // 推送 WebSocket 消息
    try {
      const changes: Record<string, any> = {}
      if (title !== undefined) changes.title = title
      if (content !== undefined) changes.content = content
      if (status !== undefined) changes.status = status
      if (tags !== undefined) changes.tags = tags
      if (order !== undefined) changes.order = order
      
      pushDocumentUpdated(document!, currentDoc.projectId, changes)
    } catch (wsErr) {
      // WebSocket 推送失败不影响主流程
      k.logger.warning('WebSocket', `Failed to push document updated message: ${wsErr}`)
    }

    // 检测是否是 MCP 调用
    const authHeader = k.request.headers.get('Authorization') || k.request.headers.get('authorization')
    const isMCPCall = authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
    
    if (isMCPCall) {
      // MCP 调用：创建真实通知并推送
      try {
        const notificationId = createMCPOperationNotification(
          currentUser._id,
          'document_updated',
          document!.title,
          document!._id,
          currentDoc.projectId
        )
        
        const notification = Notification.findById(notificationId)
        if (notification) {
          pushNotification(currentUser._id, notification, currentDoc.projectId)
        }
      } catch (notifErr) {
        k.logger.warning('Notification', `Failed to create MCP notification: ${notifErr}`)
      }
    }
    
    return success(document, 'Document updated successfully')

  } catch (err) {
    return error('Failed to update document', 500, err)
  }
})

// DELETE /api/document/delete
k.api.delete("delete", (body: any) => {
  const currentUser = getCurrentAuthUser()
  if (!currentUser) {
    return error('Unauthorized', 401)
  }
  const { id } = body

  if (!id || id.trim() === '') {
    return error('Document ID is required', 400)
  }

  // 检查文档权限（需要管理员权限才能删除）
  if (!checkDocumentPermission(id, currentUser._id, 'delete')) {
    return error('You do not have permission to delete this document', 403)
  }

  try {
    // 获取当前文档以获取 projectId
    const currentDoc = getDocumentById(id)
    if (!currentDoc) {
      return error('Document not found', 404)
    }

    const res = deleteDocument(id)

    if (!res) {
      return error('Failed to delete document', 500)
    }

    // 推送 WebSocket 消息
    try {
      pushDocumentDeleted(id, currentDoc.projectId)
    } catch (wsErr) {
      // WebSocket 推送失败不影响主流程
      k.logger.warning('WebSocket', `Failed to push document deleted message: ${wsErr}`)
    }

    // 检测是否是 MCP 调用
    const authHeader = k.request.headers.get('Authorization') || k.request.headers.get('authorization')
    const isMCPCall = authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
    
    if (isMCPCall) {
      // MCP 调用：创建真实通知并推送
      try {
        const notificationId = createMCPOperationNotification(
          currentUser._id,
          'document_deleted',
          currentDoc.title,
          id,
          currentDoc.projectId
        )
        
        const notification = Notification.findById(notificationId)
        if (notification) {
          pushNotification(currentUser._id, notification, currentDoc.projectId)
        }
      } catch (notifErr) {
        k.logger.warning('Notification', `Failed to create MCP notification: ${notifErr}`)
      }
    }

    return success(null, 'Document deleted successfully')

  } catch (err) {
    return error('Failed to delete document', 500, err)
  }
})

// GET /api/document/versions?documentId=xxx
k.api.get("versions", (documentId: string) => {
  const currentUser = getCurrentAuthUser()
  if (!currentUser) {
    return error('Unauthorized', 401)
  }

  if (!documentId || documentId.trim() === '') {
    return error('Document ID is required', 400)
  }

  // 检查文档权限
  if (!checkDocumentPermission(documentId, currentUser._id, 'view')) {
    return error('You do not have permission to view this document', 403)
  }

  try {
    const versions = getDocumentVersions(documentId)
    return success(versions)

  } catch (err) {
    return error('Failed to get document versions', 500, err)
  }
})

// GET /api/document/version?documentId=xxx&version=1
k.api.get("version", (documentId: string, version: string) => {
  const currentUser = getCurrentAuthUser()
  if (!currentUser) {
    return error('Unauthorized', 401)
  }
  const versionNumber = parseInt(version)

  if (!documentId || documentId.trim() === '') {
    return error('Document ID is required', 400)
  }

  if (!version || isNaN(versionNumber)) {
    return error('Valid version number is required', 400)
  }

  // 检查文档权限
  if (!checkDocumentPermission(documentId, currentUser._id, 'view')) {
    return error('You do not have permission to view this document', 403)
  }

  try {
    const versionDocument = getDocumentVersion(documentId, versionNumber)

    if (!versionDocument) {
      return error('Document version not found', 404)
    }

    return success(versionDocument)

  } catch (err) {
    return error('Failed to get document version', 500, err)
  }
})

// POST /api/document/batch-delete
k.api.post("batch-delete", (body: any) => {
  const currentUser = getCurrentAuthUser()
  if (!currentUser) {
    return error('Unauthorized', 401)
  }
  const { documentIds } = body

  if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
    return error('Document IDs array is required', 400)
  }

  try {
    const results = []
    let successCount = 0
    let failCount = 0

    for (const documentId of documentIds) {
      try {
        // 检查每个文档的权限
        if (!checkDocumentPermission(documentId, currentUser._id, 'delete')) {
          results.push({
            documentId,
            success: false,
            error: 'No permission'
          })
          failCount++
          continue
        }

        const success = deleteDocument(documentId)
        results.push({
          documentId,
          success,
          error: success ? null : 'Delete failed'
        })

        if (success) {
          successCount++
        } else {
          failCount++
        }

      } catch (err) {
        results.push({
          documentId,
          success: false,
          error: (err as Error).message
        })
        failCount++
      }
    }

    return success({
      total: documentIds.length,
      successCount,
      failCount,
      results
    }, `Batch delete completed: ${successCount} success, ${failCount} failed`)

  } catch (err) {
    return error('Failed to batch delete documents', 500, err)
  }
})