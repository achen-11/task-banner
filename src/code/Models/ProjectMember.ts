import { ksql, DataTypes } from 'module/k_sqlite'

/**
 * 项目成员模型
 */
export const ProjectMember = ksql.define(
  'project_members',
  {
    projectId: {
      type: DataTypes.String,
      required: true,
      index: true
    },
    userId: {
      type: DataTypes.String,
      required: true,
      index: true
    },
    role: {
      type: DataTypes.String,
      default: 'member', // owner, admin, member, viewer
      index: true
    },
    joinedAt: {
      type: DataTypes.Timestamp,
      default: () => Date.now()
    }
  },
  {
    timestamps: false, // 不需要自动时间戳，使用 joinedAt
    softDelete: false,
    uniques: [
      {
        columns: ['projectId', 'userId'],
        name: 'project_user_unique'
      }
    ]
  }
)

export type ProjectMemberType = typeof ProjectMember.$type
