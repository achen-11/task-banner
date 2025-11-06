import { ksql, DataTypes } from 'module/k_sqlite'

/**
 * 文档模型
 */
export const Document = ksql.define(
  'documents',
  {
    title: {
      type: DataTypes.String,
      required: true,
      index: true
    },
    content: {
      type: DataTypes.String,
      default: '' // Markdown 格式内容
    },
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
    type: {
      type: DataTypes.String,
      default: 'markdown', // markdown, text
      index: true
    },
    version: {
      type: DataTypes.Number,
      default: 1 // 版本号，从 1 开始递增
    },
    createdBy: {
      type: DataTypes.String,
      required: true,
      ref: {
        tableName: 'users',
        fieldName: '_id',
        onDelete: 'CASCADE'
      },
      index: true
    },
    updatedBy: {
      type: DataTypes.String,
      default: '',
      index: true
    },
    status: {
      type: DataTypes.String,
      default: 'draft', // draft, published, archived
      index: true
    },
    tags: {
      type: DataTypes.String,
      default: '' // JSON 数组格式的标签列表
    },
    order: {
      type: DataTypes.Number,
      default: 0 // 排序字段
    }
  },
  {
    timestamps: true,
    softDelete: true, // 支持软删除
    indexes: [
      {
        columns: ['projectId', 'status', 'order'],
        name: 'doc_project_status_order_idx'
      },
      {
        columns: ['projectId', 'title'],
        name: 'doc_project_title_idx'
      }
    ]
  }
)

export type DocumentType = typeof Document.$type