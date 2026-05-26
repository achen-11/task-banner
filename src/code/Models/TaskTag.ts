import { ksql, DataTypes } from 'module/k_sqlite'

/**
 * 任务标签关联模型
 */
export const TaskTag = ksql.define(
  'task_tags',
  {
    taskId: {
      type: DataTypes.String,
      required: true,
      index: true
    },
    tagId: {
      type: DataTypes.String,
      required: true,
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
