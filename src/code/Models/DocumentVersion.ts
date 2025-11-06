import { ksql, DataTypes } from 'module/k_sqlite'

/**
 * 文档版本模型
 * 用于存储文档的历史版本记录
 */
export const DocumentVersion = ksql.define(
  'document_versions',
  {
    documentId: {
      type: DataTypes.String,
      required: true,
      ref: {
        tableName: 'documents',
        fieldName: '_id',
        onDelete: 'CASCADE'
      },
      index: true
    },
    version: {
      type: DataTypes.Number,
      required: true,
      index: true
    },
    content: {
      type: DataTypes.String,
      required: true // 该版本的完整内容
    },
    title: {
      type: DataTypes.String,
      required: true // 该版本的标题
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
    changeLog: {
      type: DataTypes.String,
      default: '' // 版本变更说明
    }
  },
  {
    timestamps: true,
    softDelete: false, // 版本记录不使用软删除
    indexes: [
      {
        columns: ['documentId', 'version'],
        name: 'doc_version_unique_idx',
        unique: true
      },
      {
        columns: ['documentId', 'createdAt'],
        name: 'doc_created_at_idx'
      }
    ]
  }
)

export type DocumentVersionType = typeof DocumentVersion.$type