import { ksql, DataTypes } from 'module/k_sqlite'

/**
 * 模块模型（支持多级嵌套）
 */
export const Module = ksql.define(
  'modules',
  {
    projectId: {
      type: DataTypes.String,
      required: true,
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
      type: DataTypes.String,
      default: '', // 空字符串表示顶级模块
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
