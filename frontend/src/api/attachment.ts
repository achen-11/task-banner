/**
 * 附件 API
 */
import request from '@/utils/request'

export interface Attachment {
  _id: string
  relatedType: 'task' | 'comment'
  relatedId: string
  name: string
  originalName: string
  size: number
  mimeType: string
  url: string
  thumbnailUrl?: string
  uploaderId: string
  projectId: string
  createdAt: number
  updatedAt: number
}

/**
 * 上传附件
 * @param files 文件列表
 * @param relatedType 关联类型 ('task' | 'comment')
 * @param relatedId 关联对象 ID
 * @param projectId 项目 ID
 */
export function uploadAttachments(
  files: File[],
  relatedType: 'task' | 'comment',
  relatedId: string,
  projectId: string
): Promise<Attachment[]> {
  const formData = new FormData()

  // 添加参数
  formData.append('relatedType', relatedType)
  formData.append('relatedId', relatedId)
  formData.append('projectId', projectId)

  // 添加文件
  files.forEach(file => {
    formData.append('files', file)
  })

  return request.post('/api/attachment/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 获取附件列表
 * @param relatedType 关联类型
 * @param relatedId 关联对象 ID
 */
export function getAttachmentList(
  relatedType: 'task' | 'comment',
  relatedId: string
): Promise<Attachment[]> {
  return request.get('/api/attachment/list', {
    params: { relatedType, relatedId }
  })
}

/**
 * 删除附件
 * @param id 附件 ID
 */
export function deleteAttachment(id: string): Promise<void> {
  return request.delete('/api/attachment/delete', {
    data: { id }
  })
}

export default {
  uploadAttachments,
  getAttachmentList,
  deleteAttachment
}
