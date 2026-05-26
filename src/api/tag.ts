// @k-url /api/tag/{action}

import { success, error } from 'code/Utils/response'
import { getCurrentAuthUser } from 'code/Services/auth'
import { getUserInfo } from 'code/Services/user'
import {
  createTag,
  getTagById,
  getProjectTags,
  updateTag,
  updateTagOrder,
  deleteTag
} from 'code/Services/tag'
import { checkProjectPermission } from 'code/Services/project'

// GET /api/tag/list?projectId=xxx
k.api.get("list", () => {
  // 2. 参数验证
  const query = k.request.queryString as unknown as { projectId: string }
  const projectId = query.projectId

  if (!projectId || projectId.trim() === '') {
    return error('Invalid project ID', 400)
  }

  // 3. 获取标签列表
  try {
    // 获取当前用户
    const currentUser = getCurrentAuthUser()
    if (!currentUser) {
      return error('Unauthorized', 401)
    }
    // 权限检查（需要是项目成员）
    if (!checkProjectPermission(projectId, currentUser._id, 'member')) {
      return error('You do not have permission to view tags', 403)
    }

    const tags = getProjectTags(projectId)

    return success({
      items: tags,
      total: tags.length
    })

  } catch (err) {
    k.logger.error('GetTagListError', err instanceof Error ? err.message : String(err))
    return error('Failed to get tags', 500, err)
  }
})

// GET /api/tag/detail?id=xxx
k.api.get("detail", () => {
  // 2. 参数验证
  const query = k.request.queryString as unknown as { id: string }
  const tagId = query.id

  if (!tagId || tagId.trim() === '') {
    return error('Invalid tag ID', 400)
  }

  // 3. 获取标签详情
  try {
    // 获取当前用户
    const currentUser = getCurrentAuthUser()
    if (!currentUser) {
      return error('Unauthorized', 401)
    }
    const tag = getTagById(tagId)

    if (!tag) {
      return error('Tag not found', 404)
    }

    // 权限检查（需要是项目成员）
    if (!checkProjectPermission(tag.projectId, currentUser._id, 'member')) {
      return error('You do not have permission to view this tag', 403)
    }

    return success(tag)

  } catch (err) {
    k.logger.error('GetTagDetailError', err instanceof Error ? err.message : String(err))
    return error('Failed to get tag', 500, err)
  }
})

// POST /api/tag/create
k.api.post("create", (body: any) => {
  // 2. 参数验证
  const { projectId, name, color, prompt, showInQuickBar, order } = body

  if (!projectId || typeof projectId !== 'string' || projectId.trim() === '') {
    return error('Invalid project ID', 400)
  }

  if (!name || name.trim() === '') {
    return error('Tag name is required', 400)
  }

  // 3. 创建标签
  try {
    // 获取当前用户
    const currentUser = getCurrentAuthUser()
    if (!currentUser) {
      return error('Unauthorized', 401)
    }
    // 权限检查（需要是项目成员）
    if (!checkProjectPermission(projectId, currentUser._id, 'member')) {
      return error('You do not have permission to create tags', 403)
    }

    const tagId = createTag({
      projectId,
      name: name.trim(),
      color,
      prompt,
      showInQuickBar,
      order
    })

    // 获取创建的标签详情
    const tag = getTagById(tagId)
    return success(tag, 'Tag created successfully')

  } catch (err) {
    k.logger.error('CreateTagError', err instanceof Error ? err.message : String(err))
    // 检查是否是标签名称重复错误
    if (err instanceof Error && err.message.includes('already exists')) {
      return error(err.message, 400, err)
    }
    return error('Failed to create tag', 500, err)
  }
})

// PUT /api/tag/update
k.api.put("update", (body: any) => {
  // 2. 参数验证
  const { id, name, color, prompt, showInQuickBar, order } = body

  if (!id || typeof id !== 'string' || id.trim() === '') {
    return error('Invalid tag ID', 400)
  }

  const tagId = id

  // 3. 更新标签
  try {
    // 获取当前用户
    const currentUser = getCurrentAuthUser()
    if (!currentUser) {
      return error('Unauthorized', 401)
    }
    // 获取标签信息以检查权限
    const tag = getTagById(tagId)

    if (!tag) {
      return error('Tag not found', 404)
    }

    // 权限检查（需要是项目成员）
    if (!checkProjectPermission(tag.projectId, currentUser._id, 'member')) {
      return error('You do not have permission to update this tag', 403)
    }

    const updated = updateTag(tagId, {
      name: name?.trim(),
      color,
      prompt,
      showInQuickBar,
      order
    })

    if (!updated) {
      return error('Failed to update tag', 500)
    }

    // 获取更新后的标签详情
    const updatedTag = getTagById(tagId)
    return success(updatedTag, 'Tag updated successfully')

  } catch (err) {
    k.logger.error('UpdateTagError', err instanceof Error ? err.message : String(err))
    // 检查是否是标签名称重复错误
    if (err instanceof Error && err.message.includes('already exists')) {
      return error(err.message, 400, err)
    }
    return error('Failed to update tag', 500, err)
  }
})

// PUT /api/tag/updateOrder
k.api.put("updateOrder", (body: any) => {
  // 2. 参数验证
  const { projectId, updates } = body

  if (!projectId || typeof projectId !== 'string' || projectId.trim() === '') {
    return error('Invalid project ID', 400)
  }

  if (!Array.isArray(updates) || updates.length === 0) {
    return error('Invalid updates array', 400)
  }

  // 验证 updates 数组格式
  for (const update of updates) {
    if (!update.id || typeof update.order !== 'number') {
      return error('Invalid update format: each item must have id and order', 400)
    }
  }

  // 3. 更新标签顺序
  try {
    // 获取当前用户
    const currentUser = getCurrentAuthUser()
    if (!currentUser) {
      return error('Unauthorized', 401)
    }
    // 权限检查（需要是项目成员）
    if (!checkProjectPermission(projectId, currentUser._id, 'member')) {
      return error('You do not have permission to reorder tags', 403)
    }

    const updated = updateTagOrder(updates)

    if (!updated) {
      return error('Failed to update tag order', 500)
    }

    return success(null, 'Tag order updated successfully')

  } catch (err) {
    k.logger.error('UpdateTagOrderError', err instanceof Error ? err.message : String(err))
    return error('Failed to update tag order', 500, err)
  }
})

// DELETE /api/tag/delete
k.api.delete("delete", (body: any) => {
  // 2. 参数验证
  const { id } = body

  if (!id || typeof id !== 'string' || id.trim() === '') {
    return error('Invalid tag ID', 400)
  }

  const tagId = id

  // 3. 删除标签
  try {
    // 获取当前用户
    const currentUser = getCurrentAuthUser()
    if (!currentUser) {
      return error('Unauthorized', 401)
    }
    // 获取标签信息以检查权限
    const tag = getTagById(tagId)

    if (!tag) {
      return error('Tag not found', 404)
    }

    // 权限检查（需要是项目管理员）
    if (!checkProjectPermission(tag.projectId, currentUser._id, 'admin')) {
      return error('You do not have permission to delete this tag', 403)
    }

    const deleted = deleteTag(tagId)

    if (!deleted) {
      return error('Failed to delete tag', 500)
    }

    return success(null, 'Tag deleted successfully')

  } catch (err) {
    k.logger.error('DeleteTagError', err instanceof Error ? err.message : String(err))
    return error('Failed to delete tag', 500, err)
  }
})
