import { ksql, DataTypes } from 'module/k_sqlite'

/**
 * 评论反应模型
 */
export const CommentReaction = ksql.define(
  'comment_reactions',
  {
    commentId: {
      type: DataTypes.String,
      required: true,
      ref: {
        tableName: 'task_comments',
        fieldName: '_id',
        onDelete: 'CASCADE'
      },
      index: true
    },
    userId: {
      type: DataTypes.String,
      required: true,
      ref: {
        tableName: 'users',
        fieldName: '_id',
        onDelete: 'CASCADE'
      },
      index: true
    },
    emoji: {
      type: DataTypes.String,
      required: true,
      index: true
    },
    metadata: {
      type: DataTypes.Object, // JSON 格式存储额外信息
      default: () => ({})
    }
  },
  {
    timestamps: true, // createdAt, updatedAt
    softDelete: false,
    indexes: [
      {
        columns: ['commentId', 'emoji'],
        name: 'comment_reaction_comment_emoji_idx'
      },
      {
        columns: ['commentId', 'userId'],
        name: 'comment_reaction_comment_user_idx',
        unique: true // 确保每个用户对每个评论只能有一个反应
      }
    ]
  }
)

export type CommentReactionType = typeof CommentReaction.$type