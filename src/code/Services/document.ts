/**
 * 文档服务 - 处理文档相关的业务逻辑
 */

import { Document, type DocumentType } from 'code/Models/Document'
import { DocumentVersion, type DocumentVersionType } from 'code/Models/DocumentVersion'
import { checkProjectPermission } from 'code/Services/project'
import { getUserById } from './user'

/**
 * 文档信息接口
 */
export interface DocumentInfo {
  _id: string
  title: string
  content: string
  projectId: string
  type: string
  version: number
  createdBy: string
  updatedBy: string
  status: string
  tags: string[]
  order: number
  createdAt: number
  updatedAt: number
}

/**
 * 文档详情信息接口（包含用户信息）
 */
export interface DocumentDetailInfo extends DocumentInfo {
  // 创建者信息
  creatorInfo?: {
    displayName?: string
    username?: string
    email?: string
  }
  // 更新者信息
  updaterInfo?: {
    displayName?: string
    username?: string
    email?: string
  }
}

/**
 * 文档版本信息接口
 */
export interface DocumentVersionInfo {
  _id: string
  documentId: string
  version: number
  content: string
  title: string
  createdBy: string
  changeLog: string
  createdAt: number
  // 创建者信息
  creatorInfo?: {
    displayName?: string
    username?: string
    email?: string
  }
}

/**
 * 创建文档
 * @param data - 文档数据
 * @param createdBy - 创建者 ID
 * @returns 新创建的文档 ID
 */
export function createDocument(
  data: {
    title: string
    content?: string
    projectId: string
    type?: string
    tags?: string[]
    status?: string
  },
  createdBy: string
): string {
  // 1. 创建文档
  const documentId = Document.create({
    title: data.title,
    content: data.content || '',
    projectId: data.projectId,
    type: data.type || 'markdown',
    version: 1,
    createdBy: createdBy,
    updatedBy: createdBy,
    status: data.status || 'draft',
    tags: JSON.stringify(data.tags || []),
    order: 0
  })

  // 2. 创建初始版本记录
  DocumentVersion.create({
    documentId: documentId,
    version: 1,
    content: data.content || '',
    title: data.title,
    createdBy: createdBy,
    changeLog: '创建文档'
  })

  return documentId
}

/**
 * 根据 ID 获取文档
 * @param documentId - 文档 ID
 * @returns 文档信息或 null
 */
export function getDocumentById(documentId: string): DocumentInfo | null {
  const document = Document.findById(documentId) as DocumentType | null

  if (!document) {
    return null
  }

  return formatDocumentInfo(document)
}

/**
 * 根据 ID 获取文档详情（包含用户信息）
 * @param documentId - 文档 ID
 * @returns 文档详情或 null
 */
export function getDocumentDetailById(documentId: string): DocumentDetailInfo | null {
  const document = Document.findById(documentId) as DocumentType | null

  if (!document) {
    return null
  }

  // 1. 获取基础文档信息
  const documentInfo = formatDocumentInfo(document)

  // 2. 获取用户信息
  const creatorInfo = getUserById(document.createdBy)!
  const updaterInfo = getUserById(document.updatedBy)!

  // 3. 返回包含用户信息的文档详情
  return {
    ...documentInfo,
    creatorInfo,
    updaterInfo
  }
}

/**
 * 获取项目的文档列表
 * @param projectId - 项目 ID
 * @param filters - 过滤条件
 * @returns 文档列表
 */
export function getProjectDocuments(
  projectId: string,
  filters?: {
    status?: string
    type?: string
    keyword?: string
  }
): DocumentInfo[] {
  // 构建查询条件
  const where: any = { projectId: projectId }

  if (filters?.status) {
    where.status = filters.status
  }

  if (filters?.type) {
    where.type = filters.type
  }

  if (filters?.keyword) {
    // 这里可以使用 SQL 的 LIKE 查询，暂时使用内存过滤
    const allDocuments = Document.findAll(where) as DocumentType[]
    return allDocuments
      .filter(doc =>
        doc.title.toLowerCase().includes(filters.keyword!.toLowerCase()) ||
        doc.content.toLowerCase().includes(filters.keyword!.toLowerCase())
      )
      .map(formatDocumentInfo)
  }

  const documents = Document.findAll(where) as DocumentType[]

  // 按排序和创建时间排序
  return documents
    .sort((a, b) => {
      if (a.order !== b.order) {
        return b.order - a.order
      }
      return b.updatedAt - a.updatedAt
    })
    .map(formatDocumentInfo)
}

/**
 * 更新文档
 * @param documentId - 文档 ID
 * @param data - 更新的数据
 * @param updatedBy - 更新者 ID
 * @param changeLog - 变更说明（用于版本记录）
 * @returns 是否成功
 */
export function updateDocument(
  documentId: string,
  data: {
    title?: string
    content?: string
    status?: string
    tags?: string[]
    order?: number
  },
  updatedBy: string,
  changeLog?: string
): boolean {
  // 1. 获取当前文档
  const currentDoc = Document.findById(documentId) as DocumentType | null
  if (!currentDoc) {
    return false
  }

  // 2. 检查是否有内容或标题变更
  const hasContentChange =
    (data.title !== undefined && data.title !== currentDoc.title) ||
    (data.content !== undefined && data.content !== currentDoc.content)

  // 3. 更新文档
  const updateData: any = {
    updatedBy: updatedBy,
    ...data
  }

  // 更新标签
  if (data.tags !== undefined) {
    updateData.tags = JSON.stringify(data.tags)
  }

  // 如果有内容变更，递增版本号
  if (hasContentChange) {
    updateData.version = currentDoc.version + 1
  }

  const success = Document.updateById(documentId, updateData)

  // 4. 如果有内容变更，创建新的版本记录
  if (success && hasContentChange) {
    const updatedDoc = Document.findById(documentId) as DocumentType
    DocumentVersion.create({
      documentId: documentId,
      version: updatedDoc.version,
      content: data.content !== undefined ? data.content : currentDoc.content,
      title: data.title !== undefined ? data.title : currentDoc.title,
      createdBy: updatedBy,
      changeLog: changeLog || `更新到版本 ${updatedDoc.version}`
    })
  }

  return !!(success)
}

/**
 * 删除文档
 * @param documentId - 文档 ID
 * @returns 是否成功
 */
export function deleteDocument(documentId: string): boolean {
  // 1. 删除文档（软删除）
  return Document.removeById(documentId)
}

/**
 * 获取文档的版本历史
 * @param documentId - 文档 ID
 * @returns 版本列表
 */
export function getDocumentVersions(documentId: string): DocumentVersionInfo[] {
  const versions = DocumentVersion.findAll({
    documentId: documentId
  }) as DocumentVersionType[]

  // 按版本号降序排列
  return versions
    .sort((a, b) => b.version - a.version)
    .map(formatDocumentVersionInfo)
}

/**
 * 获取指定版本的文档内容
 * @param documentId - 文档 ID
 * @param version - 版本号
 * @returns 版本信息或 null
 */
export function getDocumentVersion(
  documentId: string,
  version: number
): DocumentVersionInfo | null {
  const versionDoc = DocumentVersion.findOne({
    documentId: documentId,
    version: version
  }) as DocumentVersionType | null

  if (!versionDoc) {
    return null
  }

  return formatDocumentVersionInfo(versionDoc)
}

/**
 * 检查用户对文档的权限
 * @param documentId - 文档 ID
 * @param userId - 用户 ID
 * @param action - 操作类型
 * @returns 是否有权限
 */
export function checkDocumentPermission(
  documentId: string,
  userId: string,
  action: 'view' | 'edit' | 'delete' = 'view'
): boolean {
  // 1. 获取文档
  const document = Document.findById(documentId) as DocumentType | null
  if (!document) {
    return false
  }

  // 2. 检查项目权限
  switch (action) {
    case 'view':
    case 'edit':
      // 查看和编辑需要项目成员权限
      return checkProjectPermission(document.projectId, userId, 'member')
    case 'delete':
      // 删除需要项目管理员权限
      return checkProjectPermission(document.projectId, userId, 'admin')
    default:
      return false
  }
}

/**
 * 格式化文档信息
 */
function formatDocumentInfo(document: DocumentType): DocumentInfo {
  return {
    _id: document._id,
    title: document.title,
    content: document.content || '',
    projectId: document.projectId,
    type: document.type || 'markdown',
    version: document.version || 1,
    createdBy: document.createdBy,
    updatedBy: document.updatedBy || document.createdBy,
    status: document.status || 'draft',
    tags: parseTags(document.tags),
    order: document.order || 0,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt
  }
}

/**
 * 格式化文档版本信息
 */
function formatDocumentVersionInfo(version: DocumentVersionType): DocumentVersionInfo {
  return {
    _id: version._id,
    documentId: version.documentId,
    version: version.version,
    content: version.content,
    title: version.title,
    createdBy: version.createdBy,
    changeLog: version.changeLog || '',
    createdAt: version.createdAt
    // creatorInfo 暂时留空，后续可以在 User Service 实现后补充
  }
}

/**
 * 解析标签 JSON
 */
function parseTags(tagsJson: string): string[] {
  try {
    return JSON.parse(tagsJson || '[]')
  } catch {
    return []
  }
}