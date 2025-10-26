/**
 * 数据模型统一导出
 */

import { User, type UserType } from 'code/Models/User'
import { Project, type ProjectType } from 'code/Models/Project'
import { ProjectMember, type ProjectMemberType } from 'code/Models/ProjectMember'
import { Module, type ModuleType } from 'code/Models/Module'
import { Task, type TaskType } from 'code/Models/Task'
import { Tag, type TagType } from 'code/Models/Tag'
import { TaskTag, type TaskTagType } from 'code/Models/TaskTag'
import { TaskModule, type TaskModuleType } from 'code/Models/TaskModule'
import { TaskHistory, type TaskHistoryType } from 'code/Models/TaskHistory'
import { TaskComment, type TaskCommentType } from 'code/Models/TaskComment'
import { Attachment, type AttachmentType } from 'code/Models/Attachment'
import { Notification, type NotificationType } from 'code/Models/Notification'

// 重新导出所有模型和类型
export { User, type UserType }
export { Project, type ProjectType }
export { ProjectMember, type ProjectMemberType }
export { Module, type ModuleType }
export { Task, type TaskType }
export { Tag, type TagType }
export { TaskTag, type TaskTagType }
export { TaskModule, type TaskModuleType }
export { TaskHistory, type TaskHistoryType }
export { TaskComment, type TaskCommentType }
export { Attachment, type AttachmentType }
export { Notification, type NotificationType }

// 导出所有模型实例供批量操作使用
export const Models = {
  User,
  Project,
  ProjectMember,
  Module,
  Task,
  Tag,
  TaskTag,
  TaskModule,
  TaskHistory,
  TaskComment,
  Attachment,
  Notification
} as const

export default Models
