export const meta = {
  name: 'list_projects',
  description: '列出当前用户有权限的项目，并附带模块与标签，便于创建任务时选择 project_id / module_ids / tag_ids',
  approvalRequired: false,
  tags: ['task-banner'],
  inputSchema: {
    type: 'object',
    properties: {},
    additionalProperties: false
  }
} as const

import { getCurrentAuthUser } from 'code/Services/auth'
import { getUserProjects } from 'code/Services/project'
import { getProjectModules } from 'code/Services/module'
import { getProjectTags } from 'code/Services/tag'

const currentUser = getCurrentAuthUser()
if (!currentUser) {
  k.response.json({ ok: false, error: 'Unauthorized' })
} else {
  k.logger.information('list_projects', JSON.stringify({ currentUser }))
  const projects = getUserProjects(currentUser._id)
  const data = projects.map((p) => ({
    _id: p._id,
    name: p.name,
    description: p.description,
    color: p.color,
    status: p.status,
    modules: getProjectModules(p._id).map((m) => ({
      _id: m._id,
      name: m.name,
      color: m.color,
      order: m.order
    })),
    tags: getProjectTags(p._id).map((t) => ({
      _id: t._id,
      name: t.name,
      color: t.color,
      order: t.order
    }))
  }))
  k.response.json({ ok: true, data })
}
