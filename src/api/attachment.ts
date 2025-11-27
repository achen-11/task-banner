// @k-url /api/attachment/{action}

import { success, error } from 'code/Utils/response'
import { getUserInfo } from 'code/Services/user'
import {
  createAttachment,
  getAttachmentById,
  getAttachmentsByRelation,
  deleteAttachment,
  updateAttachmentsRelatedId
} from 'code/Services/attachment'
import { getTaskById } from 'code/Services/task'
import { checkProjectPermission } from 'code/Services/project'

/**
 * 生成文件存储路径
 * @param folder - 文件夹名称
 * @param fileName - 文件名
 * @returns 完整路径
 */
function getFilePath(folder: string, fileName: string): string {
  // 使用时间戳和随机数避免文件名冲突
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const ext = fileName.split('.').pop()
  const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'))

  return `attachments/${folder}/${nameWithoutExt}_${timestamp}_${random}.${ext}`
}

/**
 * 生成缩略图（仅用于图片）
 * 注意：这里只是返回原图 URL，实际的缩略图生成在前端完成
 * 如果需要服务端生成缩略图，需要使用图片处理库
 */
function generateThumbnail(fileInfo: any, mimeType: string): string {
  if (mimeType.startsWith('image/')) {
    // TODO: 实现服务端缩略图生成
    // 目前直接返回原图 URL
    return fileInfo.url
  }
  return ''
}

// POST /api/attachment/upload
k.api.post("upload", () => {
  // 1. 鉴权检查
  if (!k.account.isLogin) {
    return error('Unauthorized', 401)
  }

  // 2. 获取参数
  const relatedType = k.request.form.get("relatedType") as 'task' | 'comment'
  const relatedId = k.request.form.get("relatedId")
  const projectId = k.request.form.get("projectId")
  const files = k.request.files

  // 3. 参数验证
  if (!relatedType || !relatedId || !projectId) {
    return error('Missing required parameters: relatedType, relatedId, projectId', 400)
  }

  if (relatedType !== 'task' && relatedType !== 'comment') {
    return error('Invalid relatedType, must be "task" or "comment"', 400)
  }

  if (!files || files.length === 0) {
    return error('No files uploaded', 400)
  }

  // 4. 上传附件
  try {
    // 获取当前用户
    const username = k.account.user.current.userName
    const currentUser = getUserInfo(username)

    // 权限检查（需要是项目成员）
    if (!checkProjectPermission(projectId, currentUser._id, 'member')) {
      return error('You do not have permission to upload files to this project', 403)
    }

    // 如果是任务附件，验证任务是否存在（允许临时 ID 'temp'）
    if (relatedType === 'task' && relatedId !== 'temp') {
      const task = getTaskById(relatedId)
      if (!task) {
        return error('Task not found', 404)
      }
      if (task.projectId !== projectId) {
        return error('Task does not belong to this project', 400)
      }
    }

    // 处理所有上传的文件
    const result = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const { fileName, contentType, bytes } = file

      // 检查文件大小（50MB 限制）
      const MAX_SIZE = 50 * 1024 * 1024
      if (bytes.length > MAX_SIZE) {
        k.logger.warning('FileTooLarge', `File ${fileName} exceeds 50MB limit`)
        continue
      }

      // 生成存储路径
      const storagePath = getFilePath(`${relatedType}_${relatedId}`, fileName)

      // 写入文件
      const fileInfo = k.file.writeBinary(storagePath, bytes)

      // 生成缩略图 URL（仅图片）
      const thumbnailUrl = generateThumbnail(fileInfo, contentType)

      // 创建附件记录
      const attachmentId = createAttachment({
        relatedType,
        relatedId,
        name: fileInfo.name,
        originalName: fileName,
        size: fileInfo.size,
        mimeType: contentType,
        storagePath: fileInfo.fullName,
        url: fileInfo.url,
        thumbnailUrl,
        uploaderId: currentUser._id,
        projectId
      })

      // 获取完整的附件信息
      const attachment = getAttachmentById(attachmentId)
      if (attachment) {
        result.push(attachment)
      }
    }

    return success(result, `Successfully uploaded ${result.length} file(s)`)

  } catch (err) {
    k.logger.error('UploadAttachmentError', err instanceof Error ? err.message : String(err))
    return error('Failed to upload attachments', 500, err)
  }
})

// PUT /api/attachment/updateRelatedId
k.api.put("updateRelatedId", (body: any) => {
  if (!k.account.isLogin) {
    return error('Unauthorized', 401)
  }

  const oldRelatedId = body?.oldRelatedId
  const newRelatedId = body?.newRelatedId
  const relatedType = body?.relatedType

  if (!oldRelatedId || !newRelatedId || !relatedType) {
    return error('Missing required parameters: oldRelatedId, newRelatedId, relatedType', 400)
  }

  if (relatedType !== 'task' && relatedType !== 'comment') {
    return error('Invalid relatedType, must be "task" or "comment"', 400)
  }

  try {
    
    const count = updateAttachmentsRelatedId(oldRelatedId, newRelatedId, relatedType)
    return success({ count }, `Successfully updated ${count} attachment(s)`)
  } catch (err) {
    k.logger.error('UpdateAttachmentRelatedIdError', err instanceof Error ? err.message : String(err))
    return error('Failed to update attachment relatedId', 500, err)
  }
})

// GET /api/attachment/list?relatedType=task&relatedId=xxx
k.api.get("list", () => {
  // 1. 鉴权检查
  if (!k.account.isLogin) {
    return error('Unauthorized', 401)
  }

  // 2. 获取参数
  const query = k.request.queryString as unknown as {
    relatedType: 'task' | 'comment'
    relatedId: string
  }

  const { relatedType, relatedId } = query

  if (!relatedType || !relatedId) {
    return error('Missing required parameters: relatedType, relatedId', 400)
  }

  if (relatedType !== 'task' && relatedType !== 'comment') {
    return error('Invalid relatedType, must be "task" or "comment"', 400)
  }

  // 3. 获取附件列表
  try {
    // 获取当前用户
    const username = k.account.user.current.userName
    const currentUser = getUserInfo(username)

    const attachments = getAttachmentsByRelation(relatedType, relatedId)

    // 如果有附件，检查权限
    if (attachments.length > 0) {
      const projectId = attachments[0].projectId
      if (!checkProjectPermission(projectId, currentUser._id, 'member')) {
        return error('You do not have permission to view these attachments', 403)
      }
    }

    return success(attachments)

  } catch (err) {
    k.logger.error('GetAttachmentsError', err instanceof Error ? err.message : String(err))
    return error('Failed to get attachments', 500, err)
  }
})

// DELETE /api/attachment/delete
k.api.delete("delete", (body: any) => {
  // 1. 鉴权检查
  if (!k.account.isLogin) {
    return error('Unauthorized', 401)
  }

  // 2. 参数验证
  const { id } = body

  if (!id || typeof id !== 'string' || id.trim() === '') {
    return error('Invalid attachment ID', 400)
  }

  const attachmentId = id

  // 3. 删除附件
  try {
    // 获取当前用户
    const username = k.account.user.current.userName
    const currentUser = getUserInfo(username)

    // 获取附件信息
    const attachment = getAttachmentById(attachmentId)

    if (!attachment) {
      return error('Attachment not found', 404)
    }

    // 权限检查（需要是上传者或项目管理员）
    const isUploader = attachment.uploaderId === currentUser._id
    const isAdmin = checkProjectPermission(attachment.projectId, currentUser._id, 'admin')

    if (!isUploader && !isAdmin) {
      return error('You do not have permission to delete this attachment', 403)
    }

    // 删除物理文件
    try {
      k.file.delete(attachment.storagePath)
    } catch (fileErr) {
      k.logger.warning('DeleteFileError', `Failed to delete file: ${attachment.storagePath}`)
    }

    // 删除附件记录
    const deleted = deleteAttachment(attachmentId)

    if (!deleted) {
      return error('Failed to delete attachment', 500)
    }

    return success(null, 'Attachment deleted successfully')

  } catch (err) {
    k.logger.error('DeleteAttachmentError', err instanceof Error ? err.message : String(err))
    return error('Failed to delete attachment', 500, err)
  }
})
