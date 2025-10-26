import { ksql, DataTypes } from 'module/k_sqlite'

/**
 * 任务模块关联模型（支持任务多模块）
 */
export const TaskModule = ksql.define(
  'task_modules',
  {
    taskId: {
      type: DataTypes.String,
      required: true,
      ref: {
        tableName: 'tasks',
        fieldName: '_id',
        onDelete: 'CASCADE'
      },
      index: true
    },
    moduleId: {
      type: DataTypes.String,
      required: true,
      ref: {
        tableName: 'modules',
        fieldName: '_id',
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
        columns: ['taskId', 'moduleId'],
        name: 'task_module_unique'
      }
    ]
  }
)

export type TaskModuleType = typeof TaskModule.$type
