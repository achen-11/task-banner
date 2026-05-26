import { ksql, DataTypes } from 'module/k_sqlite'

/**
 * 用户模型
 */
export const User = ksql.define(
  'users',
  {
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
      required: true
    },
    avatar: {
      type: DataTypes.String,
      default: ''
    },
    displayName: {
      type: DataTypes.String,
      default: ''
    },
    isAdmin: {
      type: DataTypes.Boolean,
      default: false
    },
    koobooId: {
      type: DataTypes.String,
      default: '',
      index: true
    },
    preferences: {
      type: DataTypes.Object,
      default: {}
    }
  },
  {
    timestamps: true, // 自动添加 createdAt, updatedAt
    softDelete: false // 不使用软删除
  }
)

export type UserType = typeof User.$type
