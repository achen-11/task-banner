/**
 * 标签 API
 */
import request from '@/utils/request'
import type {
  Tag,
  CreateTagParams,
  UpdateTagParams,
  TagListResponse
} from '@/types/tag'

/**
 * 获取项目标签列表
 * @param projectId 项目 ID
 */
export function getProjectTags(projectId: string): Promise<TagListResponse> {
  return request.get('/api/tag/list', {
    params: { projectId }
  })
}

/**
 * 创建标签
 * @param data 标签数据
 */
export function createTag(data: CreateTagParams): Promise<Tag> {
  return request.post('/api/tag/create', data)
}

/**
 * 更新标签
 * @param data 更新数据
 */
export function updateTag(data: UpdateTagParams): Promise<Tag> {
  return request.put('/api/tag/update', data)
}

/**
 * 删除标签
 * @param id 标签 ID
 */
export function deleteTag(id: string): Promise<void> {
  return request.delete('/api/tag/delete', {
    data: { id }
  })
}

/**
 * 更新标签排序
 * @param tags 标签排序数据
 */
export function updateTagOrder(tags: Array<{ id: string; order: number }>): Promise<void> {
  return request.put('/api/tag/updateOrder', { tags })
}

export default {
  getProjectTags,
  createTag,
  updateTag,
  deleteTag,
  updateTagOrder
}
