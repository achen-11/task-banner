import { ksql, DataTypes } from 'module/k_sqlite'

/**
 * 附件模型（支持任务附件和评论附件）
 */
export const Attachment = ksql.define(
  'attachments',
  {
    // 关联信息
    relatedType: {
      type: DataTypes.String,
      required: true, // 'task' | 'comment'
      index: true
    },
    relatedId: {
      type: DataTypes.String,
      required: true, // taskId 或 commentId
      index: true
    },

    // 文件信息
    name: {
      type: DataTypes.String,
      required: true
    },
    originalName: {
      type: DataTypes.String,
      required: true // 原始文件名
    },
    size: {
      type: DataTypes.Number,
      required: true // 字节数
    },
    mimeType: {
      type: DataTypes.String,
      required: true // image/png, application/pdf, etc.
    },

    // 存储信息
    storagePath: {
      type: DataTypes.String,
      required: true // 服务器存储路径
    },
    url: {
      type: DataTypes.String,
      required: true // 访问 URL
    },
    thumbnailUrl: {
      type: DataTypes.String,
      default: '' // 缩略图 URL（仅图片）
    },

    // 元数据
    uploaderId: {
      type: DataTypes.String,
      required: true,
      index: true
    },
    projectId: {
      type: DataTypes.String,
      required: true,
      index: true
    }
  },
  {
    timestamps: true, // createdAt, updatedAt
    softDelete: false,
    indexes: [
      {
        columns: ['relatedType', 'relatedId'],
        name: 'attachment_related_idx'
      },
      {
        columns: ['projectId', 'createdAt'],
        name: 'attachment_project_created_idx'
      }
    ]
  }
)

export type AttachmentType = typeof Attachment.$type
