import { ksql, DataTypes } from 'module/k_sqlite'

/**
 * 项目模型
 */
export const Project = ksql.define(
  'projects',
  {
    name: {
      type: DataTypes.String,
      required: true,
      index: true
    },
    description: {
      type: DataTypes.String,
      default: ''
    },
    color: {
      type: DataTypes.String,
      default: '#3B82F6' // 默认蓝色
    },
    ownerId: {
      type: DataTypes.String,
      required: true,
      ref: {
        tableName: 'users',
        fieldName: '_id',
        onDelete: 'CASCADE'
      },
      index: true
    },
    status: {
      type: DataTypes.String,
      default: 'active', // active, completed, paused
      index: true
    },
    icon: {
      type: DataTypes.String,
      default: ''
    },
    order: {
      type: DataTypes.Number,
      default: 0
    }
  },
  {
    timestamps: true,
    softDelete: false
  }
)

export type ProjectType = typeof Project.$type
