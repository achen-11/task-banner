import { ksql, DataTypes } from 'module/k_sqlite'

/**
 * 用户模型
 */
export const User = ksql.define(
  'users',
  {
    id: {
      type: DataTypes.Number,
      primaryKey: true,
      autoincrement: true,
      initialValue: 1000
    },
    username: {
      type: DataTypes.String,
      required: true,
      unique: true,
      index: true
    },
    email: {
      type: DataTypes.String,
      required: true,
      unique: true,
      index: true
    },
    password: {
      type: DataTypes.String,
      required: true,
      select: false // 默认查询不包含密码
    },
    avatar: {
      type: DataTypes.String,
      default: ''
    },
    displayName: {
      type: DataTypes.String,
      default: ''
    }
  },
  {
    timestamps: true, // 自动添加 createdAt, updatedAt
    softDelete: false // 不使用软删除
  }
)

export type UserType = typeof User.$type
