/**
 * 标签服务 - 处理标签相关的业务逻辑
 */

import { Tag, type TagType } from 'code/Models/Tag'
import { TaskTag, type TaskTagType } from 'code/Models/TaskTag'

/**
 * 标签信息接口
 */
export interface TagInfo {
  _id: string
  projectId: string
  name: string
  color: string
  createdAt: number
}

/**
 * 创建标签
 * @param data - 标签数据
 * @returns 新创建的标签 ID（字符串类型）
 * @throws 如果标签名称已存在
 */
export function createTag(data: {
  projectId: string
  name: string
  color?: string
}): string {
  // 检查标签名称是否已存在
  const existing = Tag.findOne({
    projectId: data.projectId,
    name: data.name
  }) as TagType | null

  if (existing) {
    throw new Error('Tag name already exists in this project')
  }

  // 创建标签
  const tagId = Tag.create({
    projectId: data.projectId,
    name: data.name,
    color: data.color || '#10B981'
  })

  return tagId
}

/**
 * 根据 ID 获取标签
 * @param tagId - 标签 ID（字符串类型）
 * @returns 标签信息或 null
 */
export function getTagById(tagId: string): TagInfo | null {
  const tag = Tag.findById(tagId) as TagType | null

  if (!tag) {
    return null
  }

  return formatTagInfo(tag)
}

/**
 * 获取项目的所有标签
 * @param projectId - 项目 ID
 * @returns 标签列表
 */
export function getProjectTags(projectId: string): TagInfo[] {
  const tags = Tag.findAll({ projectId }) as TagType[]

  // 按创建时间排序
  return tags
    .map(formatTagInfo)
    .sort((a, b) => a.createdAt - b.createdAt)
}

/**
 * 更新标签信息
 * @param tagId - 标签 ID（字符串类型）
 * @param data - 更新的数据
 * @returns 是否成功
 * @throws 如果标签名称已存在
 */
export function updateTag(
  tagId: string,
  data: {
    name?: string
    color?: string
  }
): boolean {
  const tag = Tag.findById(tagId) as TagType | null

  if (!tag) {
    return false
  }

  // 如果要更新名称，检查是否重复
  if (data.name && data.name !== tag.name) {
    const existing = Tag.findOne({
      projectId: tag.projectId,
      name: data.name
    }) as TagType | null

    if (existing) {
      throw new Error('Tag name already exists in this project')
    }
  }

  const updateData: any = {}
  if (data.name !== undefined) updateData.name = data.name
  if (data.color !== undefined) updateData.color = data.color

  const updatedId = Tag.updateById(tagId, updateData)
  return updatedId !== null && updatedId !== undefined
}

/**
 * 删除标签
 * @param tagId - 标签 ID（字符串类型）
 * @returns 是否成功
 */
export function deleteTag(tagId: string): boolean {
  // 1. 删除所有任务标签关联
  const taskTags = TaskTag.findAll({ tagId: tagId }) as TaskTagType[]
  taskTags.forEach(tt => {
    TaskTag.deleteById(tt._id)
  })

  // 2. 删除标签
  return Tag.deleteById(tagId)
}

/**
 * 格式化标签信息
 */
function formatTagInfo(tag: TagType): TagInfo {
  return {
    _id: tag._id,
    projectId: tag.projectId,
    name: tag.name,
    color: tag.color,
    createdAt: tag.createdAt
  }
}
