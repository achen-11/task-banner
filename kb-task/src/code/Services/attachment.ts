/**
 * 附件服务 - 处理附件相关的业务逻辑
 */

import { Attachment, type AttachmentType } from 'code/Models/Attachment'

/**
 * 附件信息接口
 */
export interface AttachmentInfo {
  _id: string
  relatedType: string
  relatedId: string
  name: string
  originalName: string
  size: number
  mimeType: string
  storagePath: string
  url: string
  thumbnailUrl: string
  uploaderId: string
  projectId: string
  createdAt: number
  updatedAt: number
}

/**
 * 创建附件记录
 * @param data - 附件数据
 * @returns 新创建的附件 ID（字符串类型）
 */
export function createAttachment(data: {
  relatedType: 'task' | 'comment'
  relatedId: string
  name: string
  originalName: string
  size: number
  mimeType: string
  storagePath: string
  url: string
  thumbnailUrl?: string
  uploaderId: string
  projectId: string
}): string {
  const attachmentId = Attachment.create({
    relatedType: data.relatedType,
    relatedId: data.relatedId,
    name: data.name,
    originalName: data.originalName,
    size: data.size,
    mimeType: data.mimeType,
    storagePath: data.storagePath,
    url: data.url,
    thumbnailUrl: data.thumbnailUrl || '',
    uploaderId: data.uploaderId,
    projectId: data.projectId
  })

  return attachmentId
}

/**
 * 根据 ID 获取附件
 * @param attachmentId - 附件 ID（字符串类型）
 * @returns 附件信息或 null
 */
export function getAttachmentById(attachmentId: string): AttachmentInfo | null {
  const attachment = Attachment.findById(attachmentId) as AttachmentType | null

  if (!attachment) {
    return null
  }

  return formatAttachmentInfo(attachment)
}

/**
 * 获取关联对象的附件列表
 * @param relatedType - 关联类型
 * @param relatedId - 关联对象 ID
 * @returns 附件列表
 */
export function getAttachmentsByRelation(
  relatedType: 'task' | 'comment',
  relatedId: string
): AttachmentInfo[] {
  const attachments = Attachment.findAll({
    relatedType,
    relatedId
  }) as AttachmentType[]

  return attachments
    .map(formatAttachmentInfo)
    .sort((a, b) => a.createdAt - b.createdAt)
}

/**
 * 获取任务的所有附件
 * @param taskId - 任务 ID
 * @returns 附件列表
 */
export function getTaskAttachments(taskId: string): AttachmentInfo[] {
  return getAttachmentsByRelation('task', taskId)
}

/**
 * 获取评论的所有附件
 * @param commentId - 评论 ID
 * @returns 附件列表
 */
export function getCommentAttachments(commentId: string): AttachmentInfo[] {
  return getAttachmentsByRelation('comment', commentId)
}

/**
 * 删除附件
 * @param attachmentId - 附件 ID（字符串类型）
 * @returns 是否成功
 */
export function deleteAttachment(attachmentId: string): boolean {
  // 删除附件记录
  return Attachment.deleteById(attachmentId)
}

/**
 * 批量删除关联对象的所有附件
 * @param relatedType - 关联类型
 * @param relatedId - 关联对象 ID
 * @returns 删除的附件数量
 */
export function deleteAttachmentsByRelation(
  relatedType: 'task' | 'comment',
  relatedId: string
): number {
  const attachments = Attachment.findAll({
    relatedType,
    relatedId
  }) as AttachmentType[]

  let count = 0
  attachments.forEach(att => {
    if (Attachment.deleteById(att._id)) {
      count++
    }
  })

  return count
}

/**
 * 格式化附件信息
 */
function formatAttachmentInfo(attachment: AttachmentType): AttachmentInfo {
  return {
    _id: attachment._id,
    relatedType: attachment.relatedType,
    relatedId: attachment.relatedId,
    name: attachment.name,
    originalName: attachment.originalName,
    size: attachment.size,
    mimeType: attachment.mimeType,
    storagePath: attachment.storagePath,
    url: attachment.url,
    thumbnailUrl: attachment.thumbnailUrl,
    uploaderId: attachment.uploaderId,
    projectId: attachment.projectId,
    createdAt: attachment.createdAt,
    updatedAt: attachment.updatedAt
  }
}
