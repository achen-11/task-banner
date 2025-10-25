/**
 * 数据模型统一导出
 */

export { User, type UserType } from 'code/Models/User'
export { Project, type ProjectType } from 'code/Models/Project'
export { ProjectMember, type ProjectMemberType } from 'code/Models/ProjectMember'
export { Module, type ModuleType } from 'code/Models/Module'
export { Task, type TaskType } from 'code/Models/Task'
export { Tag, type TagType } from 'code/Models/Tag'
export { TaskTag, type TaskTagType } from 'code/Models/TaskTag'
export { TaskHistory, type TaskHistoryType } from 'code/Models/TaskHistory'
export { TaskComment, type TaskCommentType } from 'code/Models/TaskComment'
export { Notification, type NotificationType } from 'code/Models/Notification'

// 导出所有模型实例供批量操作使用
export const Models = {
  User,
  Project,
  ProjectMember,
  Module,
  Task,
  Tag,
  TaskTag,
  TaskHistory,
  TaskComment,
  Notification
} as const

export default Models
