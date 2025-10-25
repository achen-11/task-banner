import { ksql, DataTypes } from 'module/k_sqlite'

/**
 * 标签模型
 */
export const Tag = ksql.define(
  'tags',
  {
    projectId: {
      type: DataTypes.String,
      required: true,
      ref: {
        tableName: 'projects',
        fieldName: '_id',
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
      default: '#10B981' // 默认绿色
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
