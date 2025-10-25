/**
 * 项目 API
 */
import request from '@/utils/request'
import type {
  Project,
  ProjectMember,
  CreateProjectParams,
  UpdateProjectParams,
  AddMemberParams,
  RemoveMemberParams,
  ProjectListResponse,
  MemberListResponse
} from '@/types/project'

/**
 * 获取项目列表
 * @param page 页码
 * @param size 每页数量
 */
export function getProjectList(page = 1, size = 20): Promise<ProjectListResponse> {
  return request.get('/api/project/list', {
    params: { page, size }
  })
}

/**
 * 获取项目详情
 * @param id 项目 ID
 */
export function getProjectDetail(id: string): Promise<Project> {
  return request.get('/api/project/detail', {
    params: { id }
  })
}

/**
 * 创建项目
 * @param data 项目数据
 */
export function createProject(data: CreateProjectParams): Promise<Project> {
  return request.post('/api/project/create', data)
}

/**
 * 更新项目
 * @param data 更新数据
 */
export function updateProject(data: UpdateProjectParams): Promise<Project> {
  return request.put('/api/project/update', data)
}

/**
 * 删除项目
 * @param id 项目 ID
 */
export function deleteProject(id: string): Promise<void> {
  return request.delete('/api/project/delete', {
    data: { id }
  })
}

/**
 * 获取项目成员列表
 * @param projectId 项目 ID
 */
export function getProjectMembers(projectId: string): Promise<MemberListResponse> {
  return request.get('/api/project/members', {
    params: { projectId }
  })
}

/**
 * 添加项目成员
 * @param data 成员数据
 */
export function addProjectMember(data: AddMemberParams): Promise<{ id: string }> {
  return request.post('/api/project/addMember', data)
}

/**
 * 移除项目成员
 * @param data 成员数据
 */
export function removeProjectMember(data: RemoveMemberParams): Promise<void> {
  return request.delete('/api/project/removeMember', {
    data
  })
}

export default {
  getProjectList,
  getProjectDetail,
  createProject,
  updateProject,
  deleteProject,
  getProjectMembers,
  addProjectMember,
  removeProjectMember
}
