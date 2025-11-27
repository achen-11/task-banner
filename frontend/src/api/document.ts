/**
 * 文档 API
 */
import request from '@/utils/request'

/**
 * 文档信息
 */
export interface Document {
  _id: string
  title: string
  content: string
  projectId: string
  type: string
  status: 'draft' | 'published' | 'archived'
  tags: string[]
  createdBy: string
  updatedBy: string
  createdAt: number
  updatedAt: number
}

/**
 * 文档详情（包含创建者和更新者信息）
 */
export interface DocumentDetail extends Document {
  version?: number
  creatorInfo?: {
    _id: string
    username?: string
    displayName?: string
    email?: string
  }
  updaterInfo?: {
    _id: string
    username?: string
    displayName?: string
    email?: string
  }
}

/**
 * 文档列表响应
 */
export interface DocumentListResponse {
  items: Document[]
  total: number
  page: number
  size: number
}

/**
 * 文档版本信息
 */
export interface DocumentVersion {
  documentId: string
  version: number
  title: string
  content: string
  changeLog: string
  createdBy: string
  createdAt: number
}

/**
 * 获取文档列表
 * @param projectId 项目 ID
 * @param params 查询参数
 */
export function getDocumentList(
  projectId: string,
  params?: {
    page?: number
    size?: number
    status?: string
    type?: string
    keyword?: string
  }
): Promise<DocumentListResponse> {
  return request.get('/api/document/list', {
    params: {
      projectId,
      page: params?.page || 1,
      size: params?.size || 100,
      ...(params?.status && { status: params.status }),
      ...(params?.type && { type: params.type }),
      ...(params?.keyword && { keyword: params.keyword })
    }
  })
}

/**
 * 获取文档详情
 * @param id 文档 ID
 */
export function getDocumentDetail(id: string): Promise<DocumentDetail> {
  return request.get('/api/document/detail', {
    params: { id }
  })
}

/**
 * 创建文档
 * @param data 文档数据
 */
export function createDocument(data: {
  title: string
  content: string
  projectId: string
  type: string
  status: string
  tags?: string[]
}): Promise<Document> {
  return request.post('/api/document/create', data)
}

/**
 * 更新文档
 * @param data 更新数据
 */
export function updateDocument(data: {
  id: string
  title?: string
  content?: string
  status?: string
  changeLog?: string
}): Promise<Document> {
  return request.put('/api/document/update', data)
}

/**
 * 删除文档
 * @param id 文档 ID
 */
export function deleteDocument(id: string): Promise<void> {
  return request.delete('/api/document/delete', {
    data: { id }
  })
}

/**
 * 获取文档版本列表
 * @param documentId 文档 ID
 */
export function getDocumentVersions(documentId: string): Promise<DocumentVersion[]> {
  return request.get('/api/document/versions', {
    params: { documentId }
  })
}

/**
 * 获取特定版本
 * @param documentId 文档 ID
 * @param version 版本号
 */
export function getDocumentVersion(documentId: string, version: number): Promise<DocumentVersion> {
  return request.get('/api/document/version', {
    params: { documentId, version }
  })
}

/**
 * 导出文档
 * @param id 文档 ID
 */
export function exportDocument(id: string): Promise<Blob> {
  return request.get('/api/document/export', {
    params: { id },
    responseType: 'blob'
  })
}

export default {
  getDocumentList,
  getDocumentDetail,
  createDocument,
  updateDocument,
  deleteDocument,
  getDocumentVersions,
  getDocumentVersion,
  exportDocument
}

