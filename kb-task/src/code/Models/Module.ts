import { ksql, DataTypes } from 'module/k_sqlite'

/**
 * 模块模型（支持多级嵌套）
 */
export const Module = ksql.define(
  'modules',
  {
    id: {
      type: DataTypes.Number,
      primaryKey: true,
      autoincrement: true
    },
    projectId: {
      type: DataTypes.Number,
      required: true,
      ref: {
        tableName: 'projects',
        fieldName: 'id',
        onDelete: 'CASCADE'
      },
      index: true
    },
    name: {
      type: DataTypes.String,
      required: true
    },
    color: {
      type: DataTypes.String,
      default: '#6B7280' // 默认灰色
    },
    parentId: {
      type: DataTypes.Number,
      default: 0, // 0 表示顶级模块
      index: true
    },
    order: {
      type: DataTypes.Number,
      default: 0
    }
  },
  {
    timestamps: true,
    softDelete: false,
    indexes: [
      {
        columns: ['projectId', 'parentId', 'order'],
        name: 'module_project_parent_order_idx'
      }
    ]
  }
)

export type ModuleType = typeof Module.$type
