import { ksql, DataTypes } from 'module/k_sqlite'

/**
 * 标签模型
 * 支持 AI 提示词管理和快速访问栏
 */
export const Tag = ksql.define(
  'tags',
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
      default: '#10B981' // 默认绿色
    },
    prompt: {
      type: DataTypes.String,
      default: ''
    },
    showInQuickBar: {
      type: DataTypes.Boolean,
      default: false
    },
    order: {
      type: DataTypes.Number,
      default: 0
    }
  },
  {
    timestamps: true,
    softDelete: false,
    uniques: [
      {
        columns: ['projectId', 'name'],
        name: 'project_tag_name_unique'
      }
    ]
  }
)

export type TagType = typeof Tag.$type
