import { ksql, DataTypes } from 'module/k_sqlite'

/**
 * 任务标签关联模型
 */
export const TaskTag = ksql.define(
  'task_tags',
  {
    id: {
      type: DataTypes.Number,
      primaryKey: true,
      autoincrement: true
    },
    taskId: {
      type: DataTypes.Number,
      required: true,
      ref: {
        tableName: 'tasks',
        fieldName: 'id',
        onDelete: 'CASCADE'
      },
      index: true
    },
    tagId: {
      type: DataTypes.Number,
      required: true,
      ref: {
        tableName: 'tags',
        fieldName: 'id',
        onDelete: 'CASCADE'
      },
      index: true
    }
  },
  {
    timestamps: false,
    softDelete: false,
    uniques: [
      {
        columns: ['taskId', 'tagId'],
        name: 'task_tag_unique'
      }
    ]
  }
)

export type TaskTagType = typeof TaskTag.$type
